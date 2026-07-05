from flask import Blueprint, request, jsonify
from flask_jwt_extended import ( create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt, set_access_cookies, set_refresh_cookies, unset_jwt_cookies )
from models.user import find_user_by_phone, verify_password

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    phone = data.get("phone")
    password = data.get("password")

    if not phone or not password:
        return jsonify({"error": "Phone and password are required"}), 400

    user = find_user_by_phone(phone)
    if not user or not verify_password(password, user["passwordHash"]):
        return jsonify({"error": "Invalid phone or password"}), 401

    identity = str(user["_id"])
    additional_claims = {
        "role": user["role"],
        "name": user["name"],
        "tenantId": str(user["tenantId"]) if user.get("tenantId") else None,
    }

    access_token = create_access_token(identity=identity, additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=identity, additional_claims=additional_claims)

    # The tokens themselves never appear here — they're attached as httpOnly
    # cookies below, invisible to JavaScript. Only non-sensitive profile info
    # goes in the JSON body for the frontend to display.
    response = jsonify(
        {
            "user": {
                "id": identity,
                "name": user["name"],
                "phone": user["phone"],
                "role": user["role"],
            }
        }
    )
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)
    return response


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """
    The frontend calls this when a request fails because the access token
    expired. Since the refresh cookie lives much longer, this silently
    issues a new short-lived access token without asking for login again.
    """
    identity = get_jwt_identity()
    claims = get_jwt()
    additional_claims = {
        "role": claims.get("role"),
        "name": claims.get("name"),
        "tenantId": claims.get("tenantId"),
    }
    new_access_token = create_access_token(identity=identity, additional_claims=additional_claims)

    response = jsonify({"status": "refreshed"})
    set_access_cookies(response, new_access_token)
    return response


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """Explicitly clears both cookies — the frontend can't just 'forget' a
    cookie the way it could drop a token from memory."""
    response = jsonify({"status": "logged out"})
    unset_jwt_cookies(response)
    return response


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """Used on app load to check 'is there a valid session cookie, and whose is it'."""
    identity = get_jwt_identity()
    claims = get_jwt()
    return jsonify(
        {
            "id": identity,
            "role": claims.get("role"),
            "name": claims.get("name"),
            "tenantId": claims.get("tenantId"),
        }
    )
