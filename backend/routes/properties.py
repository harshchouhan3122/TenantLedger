from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from models.property import create_property, get_properties_for_admin
from utils import serialize_doc

properties_bp = Blueprint("properties", __name__)

VALID_TYPES = ("shop", "house")


def require_admin():
    """
    Returns the logged-in admin's own user id if this request's token has
    role "admin", otherwise returns None. Every route below must check this
    before doing anything — it's what stops a future tenant-role account
    from creating or listing properties, once tenant logins exist.
    """
    claims = get_jwt()
    if claims.get("role") != "admin":
        return None
    return get_jwt_identity()


@properties_bp.route("", methods=["POST"])
@jwt_required()
def add_property():
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Only admins can add properties"}), 403

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    property_type = (data.get("type") or "").strip().lower()
    address = (data.get("address") or "").strip()

    if not name:
        return jsonify({"error": "Property name is required"}), 400

    if property_type not in VALID_TYPES:
        return jsonify({"error": "Type must be 'shop' or 'house'"}), 400

    property_doc = create_property(admin_id, name, property_type, address)
    return jsonify(serialize_doc(property_doc)), 201


@properties_bp.route("", methods=["GET"])
@jwt_required()
def list_properties():
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Only admins can view this"}), 403

    properties = get_properties_for_admin(admin_id)
    return jsonify([serialize_doc(p) for p in properties])
