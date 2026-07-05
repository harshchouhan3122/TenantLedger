from datetime import date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from models.tenant import (
    create_tenant,
    get_tenants_for_admin,
    get_active_tenant_for_property,
    move_out_tenant,
    update_tenant_documents,
)
from models.property import get_property_by_id
from utils import serialize_doc

tenants_bp = Blueprint("tenants", __name__)


def require_admin():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return None
    return get_jwt_identity()


def _tenant_public(tenant_doc):
    data = serialize_doc(tenant_doc)
    data.pop("aadharNo", None)
    data["aadharMasked"] = f"XXXX-XXXX-{tenant_doc.get('aadharLast4', '****')}"
    return data


@tenants_bp.route("", methods=["POST"])
@jwt_required()
def add_tenant():
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Only admins can add tenants"}), 403

    data = request.get_json(silent=True) or {}
    property_id = data.get("propertyId")
    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    aadhar_no = (data.get("aadharNo") or "").strip()
    move_in_date = (data.get("moveInDate") or "").strip()

    if not all([property_id, name, phone, aadhar_no, move_in_date]):
        return jsonify({"error": "All fields are required"}), 400

    property_doc = get_property_by_id(property_id, admin_id)
    if not property_doc:
        return jsonify({"error": "Property not found"}), 404

    existing_active = get_active_tenant_for_property(property_id, admin_id)
    if existing_active:
        return (
            jsonify(
                {
                    "error": f"This property already has an active tenant "
                    f"({existing_active['name']}). Move them out first."
                }
            ),
            409,
        )

    tenant_doc = create_tenant(admin_id, property_id, name, phone, aadhar_no, move_in_date)
    return jsonify(_tenant_public(tenant_doc)), 201


@tenants_bp.route("", methods=["GET"])
@jwt_required()
def list_tenants():
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Only admins can view this"}), 403

    property_id = request.args.get("propertyId")
    tenants = get_tenants_for_admin(admin_id, property_id)
    return jsonify([_tenant_public(t) for t in tenants])


@tenants_bp.route("/<tenant_id>/move-out", methods=["PATCH"])
@jwt_required()
def move_out(tenant_id):
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Only admins can do this"}), 403

    data = request.get_json(silent=True) or {}
    move_out_date = data.get("moveOutDate") or date.today().isoformat()

    success = move_out_tenant(tenant_id, admin_id, move_out_date)
    if not success:
        return jsonify({"error": "Active tenant not found for this property"}), 404

    return jsonify({"status": "moved out"})


@tenants_bp.route("/<tenant_id>/documents", methods=["PATCH"])
@jwt_required()
def update_documents(tenant_id):
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Only admins can do this"}), 403

    data = request.get_json(silent=True) or {}
    drive_link = (data.get("driveFolderLink") or "").strip() or None

    success = update_tenant_documents(tenant_id, admin_id, drive_link)
    if not success:
        return jsonify({"error": "Tenant not found"}), 404

    return jsonify({"status": "updated", "driveFolderLink": drive_link})
