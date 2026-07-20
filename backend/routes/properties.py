from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from models.property import (
    create_property,
    get_properties_for_admin,
    delete_property,
    add_charge_type,
    update_charge_type,
    delete_charge_type,
)
from models.tenant import get_active_tenant_for_property
from utils import serialize_doc

properties_bp = Blueprint("properties", __name__)

VALID_TYPES = ("shop", "house")


def require_admin():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return None
    return get_jwt_identity()


def _parse_amount(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


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

    result = []
    for property_doc in properties:
        serialized = serialize_doc(property_doc)
        active_tenant = get_active_tenant_for_property(property_doc["_id"], admin_id)
        serialized["occupied"] = active_tenant is not None
        serialized["activeTenantId"] = str(active_tenant["_id"]) if active_tenant else None
        serialized["activeTenantName"] = active_tenant["name"] if active_tenant else None
        result.append(serialized)

    return jsonify(result)


@properties_bp.route("/<property_id>", methods=["DELETE"])
@jwt_required()
def remove_property(property_id):
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Only admins can delete properties"}), 403

    # Block deleting a property that still has an active tenant — otherwise
    # that tenant's records would point to a property that no longer exists.
    active_tenant = get_active_tenant_for_property(property_id, admin_id)
    if active_tenant:
        return (
            jsonify(
                {
                    "error": f"Can't delete — this property still has an active "
                    f"tenant ({active_tenant['name']}). Move them out first."
                }
            ),
            409,
        )

    deleted = delete_property(property_id, admin_id)
    if not deleted:
        return jsonify({"error": "Property not found"}), 404

    return jsonify({"status": "deleted"})


@properties_bp.route("/<property_id>/charge-types", methods=["POST"])
@jwt_required()
def add_property_charge_type(property_id):
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Only admins can do this"}), 403

    data = request.get_json(silent=True) or {}
    label = (data.get("label") or "").strip()
    default_amount = _parse_amount(data.get("defaultAmount"))

    if not label:
        return jsonify({"error": "Charge type label is required"}), 400
    if default_amount is None:
        return jsonify({"error": "Default amount must be a number"}), 400

    charge_type = add_charge_type(property_id, admin_id, label, default_amount)
    if charge_type is None:
        return jsonify({"error": "Property not found"}), 404

    return jsonify(charge_type), 201


@properties_bp.route("/<property_id>/charge-types/<charge_type_id>", methods=["PATCH"])
@jwt_required()
def edit_property_charge_type(property_id, charge_type_id):
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Only admins can do this"}), 403

    data = request.get_json(silent=True) or {}
    label = (data.get("label") or "").strip()
    default_amount = _parse_amount(data.get("defaultAmount"))

    if not label:
        return jsonify({"error": "Charge type label is required"}), 400
    if default_amount is None:
        return jsonify({"error": "Default amount must be a number"}), 400

    success = update_charge_type(property_id, admin_id, charge_type_id, label, default_amount)
    if not success:
        return jsonify({"error": "Charge type not found"}), 404

    return jsonify({"status": "updated"})


@properties_bp.route("/<property_id>/charge-types/<charge_type_id>", methods=["DELETE"])
@jwt_required()
def remove_property_charge_type(property_id, charge_type_id):
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Only admins can do this"}), 403

    success = delete_charge_type(property_id, admin_id, charge_type_id)
    if not success:
        return jsonify({"error": "Charge type not found"}), 404

    return jsonify({"status": "deleted"})
