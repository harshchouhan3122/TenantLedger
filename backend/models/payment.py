from datetime import datetime
from bson import ObjectId
from db import db

payments_collection = db.payments


def create_payment(
    admin_id, tenant_id, property_id, tenant_name, month,
    charges, due_amount, due_reason, remark, due_date,
):
    payment_doc = {
        "tenantId": ObjectId(tenant_id),
        "propertyId": ObjectId(property_id),
        "adminId": ObjectId(admin_id),
        # Denormalized, same pattern as elsewhere — lets the UI show "Paid
        # by Harsh" without a lookup, and survives even if the tenant record
        # itself is later changed.
        "tenantName": tenant_name,
        "month": month,  # "2026-07"
        "charges": charges,  # [{label, amount}]
        "due": {"amount": due_amount, "reason": due_reason},
        "status": "pending",
        "dueDate": due_date,
        "remark": remark,
        "paidDate": None,
        "paidThrough": None,
        "createdAt": datetime.utcnow().isoformat(),
    }
    result = payments_collection.insert_one(payment_doc)
    payment_doc["_id"] = result.inserted_id
    return payment_doc


def get_payment_for_tenant_month(admin_id, tenant_id, month):
    """Used to block creating a second bill for the same tenant + month."""
    return payments_collection.find_one(
        {"adminId": ObjectId(admin_id), "tenantId": ObjectId(tenant_id), "month": month}
    )


def get_payments_for_tenant(admin_id, tenant_id):
    return list(
        payments_collection.find(
            {"adminId": ObjectId(admin_id), "tenantId": ObjectId(tenant_id)}
        ).sort("month", -1)
    )


def get_payment_by_id(payment_id, admin_id):
    return payments_collection.find_one(
        {"_id": ObjectId(payment_id), "adminId": ObjectId(admin_id)}
    )


def update_payment(payment_id, admin_id, charges, due_amount, due_reason, remark, due_date):
    """
    Only succeeds while status is still 'pending' — enforced directly in the
    query filter, not just checked beforehand in the route. This is the
    actual lock: even if two requests raced each other, only one could ever
    match this filter once status flips to 'paid'.
    """
    result = payments_collection.update_one(
        {"_id": ObjectId(payment_id), "adminId": ObjectId(admin_id), "status": "pending"},
        {
            "$set": {
                "charges": charges,
                "due": {"amount": due_amount, "reason": due_reason},
                "remark": remark,
                "dueDate": due_date,
            }
        },
    )
    return result.modified_count > 0


def delete_payment(payment_id, admin_id):
    """Only succeeds while status is still 'pending' — same lock as above."""
    result = payments_collection.delete_one(
        {"_id": ObjectId(payment_id), "adminId": ObjectId(admin_id), "status": "pending"}
    )
    return result.deleted_count > 0


def mark_paid(payment_id, admin_id, paid_through):
    result = payments_collection.update_one(
        {"_id": ObjectId(payment_id), "adminId": ObjectId(admin_id), "status": "pending"},
        {
            "$set": {
                "status": "paid",
                "paidDate": datetime.utcnow().isoformat(),
                "paidThrough": paid_through,
            }
        },
    )
    return result.modified_count > 0


def unmark_paid(payment_id, admin_id):
    """
    Deliberately reopens a paid record for editing. This is the ONLY way
    back to an editable state once paid — never a silent overwrite.
    """
    result = payments_collection.update_one(
        {"_id": ObjectId(payment_id), "adminId": ObjectId(admin_id), "status": "paid"},
        {"$set": {"status": "pending", "paidDate": None, "paidThrough": None}},
    )
    return result.modified_count > 0
