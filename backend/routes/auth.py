from flask import Blueprint, request, jsonify
from flask_jwt_extended import ( create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt, set_access_cookies, set_refresh_cookies, unset_jwt_cookies )
import bcrypt

from models.user import (
    find_user_by_phone,
    verify_password,
    find_user_by_id,
    update_user_profile,
    update_password,
)

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


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():

    user = find_user_by_id(get_jwt_identity())

    return jsonify(
        {
            "id": str(user["_id"]),
            "name": user["name"],
            "phone": user["phone"],
            "role": user["role"],
        }
    )


@auth_bp.route("/profile", methods=["PATCH"])
@jwt_required()
def edit_profile():

    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()

    if not name:
        return jsonify({"error": "Name is required"}), 400

    if not phone:
        return jsonify({"error": "Phone is required"}), 400

    user = update_user_profile(
        get_jwt_identity(),
        name,
        phone,
    )

    return jsonify(
        {
            "id": str(user["_id"]),
            "name": user["name"],
            "phone": user["phone"],
            "role": user["role"],
        }
    )


@auth_bp.route("/change-password", methods=["PATCH"])
@jwt_required()
def change_password():

    data = request.get_json(silent=True) or {}

    current_password = data.get("currentPassword", "")
    new_password = data.get("newPassword", "")
    confirm_password = data.get("confirmPassword", "")

    if not current_password or not new_password or not confirm_password:
        return jsonify({"error": "All fields are required."}), 400

    if new_password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400

    user = find_user_by_id(get_jwt_identity())

    if not verify_password(current_password, user["passwordHash"]):
        return jsonify({"error": "Current password is incorrect."}), 401

    password_hash = bcrypt.hashpw(
        new_password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    update_password(
        get_jwt_identity(),
        password_hash,
    )

    return jsonify(
        {
            "message": "Password updated successfully."
        }
    )