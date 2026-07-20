from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from models.payment import (
    create_payment,
    get_payment_for_tenant_month,
    get_payments_for_tenant,
    get_payment_by_id,
    update_payment,
    delete_payment,
    mark_paid,
    unmark_paid,
)
from models.tenant import get_tenant_by_id
from utils import serialize_doc

payments_bp = Blueprint("payments", __name__)


def require_admin():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return None
    return get_jwt_identity()


def _parse_charges(raw_charges):
    """
    Validates and normalizes the charges array from the request body.
    Returns None if anything is malformed, so the caller can respond with
    a clean 400 instead of a raw exception.
    """
    if not raw_charges or not isinstance(raw_charges, list):
        return None
    try:
        return [
            {"label": str(c["label"]).strip(), "amount": float(c["amount"])}
            for c in raw_charges
            if str(c.get("label", "")).strip()
        ]
    except (KeyError, TypeError, ValueError):
        return None


@payments_bp.route("", methods=["POST"])
@jwt_required()
def add_payment():
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Only admins can add bills"}), 403

    data = request.get_json(silent=True) or {}
    tenant_id = data.get("tenantId")
    month = (data.get("month") or "").strip()
    charges = _parse_charges(data.get("charges"))
    due_reason = (data.get("dueReason") or "").strip()
    remark = (data.get("remark") or "").strip()
    due_date = (data.get("dueDate") or "").strip()

    try:
        due_amount = float(data.get("dueAmount", 0) or 0)
    except (TypeError, ValueError):
        return jsonify({"error": "Due amount must be a number"}), 400

    if not tenant_id or not month:
        return jsonify({"error": "Tenant and month are required"}), 400
    if not charges:
        return jsonify({"error": "At least one valid charge is required"}), 400

    tenant = get_tenant_by_id(tenant_id, admin_id)
    if not tenant:
        return jsonify({"error": "Tenant not found"}), 404

    if get_payment_for_tenant_month(admin_id, tenant_id, month):
        return jsonify({"error": f"A bill for {month} already exists for this tenant"}), 409

    payment_doc = create_payment(
        admin_id,
        tenant_id,
        str(tenant["propertyId"]),
        tenant["name"],
        month,
        charges,
        due_amount,
        due_reason,
        remark,
        due_date,
    )
    return jsonify(serialize_doc(payment_doc)), 201


@payments_bp.route("/tenant/<tenant_id>", methods=["GET"])
@jwt_required()
def list_payments_for_tenant(tenant_id):
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Only admins can view this"}), 403

    payments = get_payments_for_tenant(admin_id, tenant_id)
    return jsonify([serialize_doc(p) for p in payments])


@payments_bp.route("/<payment_id>", methods=["PATCH"])
@jwt_required()
def edit_payment(payment_id):
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Only admins can do this"}), 403

    payment = get_payment_by_id(payment_id, admin_id)
    if not payment:
        return jsonify({"error": "Bill not found"}), 404
    if payment["status"] != "pending":
        return (
            jsonify(
                {"error": "This bill is already marked paid. Unmark it as paid before editing."}
            ),
            409,
        )

    data = request.get_json(silent=True) or {}
    charges = _parse_charges(data.get("charges"))
    due_reason = (data.get("dueReason") or "").strip()
    remark = (data.get("remark") or "").strip()
    due_date = (data.get("dueDate") or "").strip()

    try:
        due_amount = float(data.get("dueAmount", 0) or 0)
    except (TypeError, ValueError):
        return jsonify({"error": "Due amount must be a number"}), 400

    if not charges:
        return jsonify({"error": "At least one valid charge is required"}), 400

    success = update_payment(payment_id, admin_id, charges, due_amount, due_reason, remark, due_date)
    if not success:
        return jsonify({"error": "Couldn't update — it may no longer be pending"}), 409

    updated = get_payment_by_id(payment_id, admin_id)
    return jsonify(serialize_doc(updated))


@payments_bp.route("/<payment_id>", methods=["DELETE"])
@jwt_required()
def remove_payment(payment_id):
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Only admins can do this"}), 403

    payment = get_payment_by_id(payment_id, admin_id)
    if not payment:
        return jsonify({"error": "Bill not found"}), 404
    if payment["status"] != "pending":
        return jsonify({"error": "Can't delete a bill that's already marked paid. Unmark it first."}), 409

    delete_payment(payment_id, admin_id)
    return jsonify({"status": "deleted"})


@payments_bp.route("/<payment_id>/mark-paid", methods=["PATCH"])
@jwt_required()
def mark_payment_paid(payment_id):
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Only admins can do this"}), 403

    data = request.get_json(silent=True) or {}
    paid_through = (data.get("paidThrough") or "").strip() or "Not specified"

    success = mark_paid(payment_id, admin_id, paid_through)
    if not success:
        return jsonify({"error": "Bill not found or already marked paid"}), 404

    return jsonify({"status": "paid"})


@payments_bp.route("/<payment_id>/unmark-paid", methods=["PATCH"])
@jwt_required()
def unmark_payment_paid(payment_id):
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Only admins can do this"}), 403

    success = unmark_paid(payment_id, admin_id)
    if not success:
        return jsonify({"error": "Bill not found or not currently marked paid"}), 404

    return jsonify({"status": "pending"})
