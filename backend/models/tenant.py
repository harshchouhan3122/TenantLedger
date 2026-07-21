from bson import ObjectId
from db import db
from crypto_utils import encrypt_value

tenants_collection = db.tenants


def get_active_tenant_for_property(property_id, admin_id):
    return tenants_collection.find_one(
        {
            "propertyId": ObjectId(property_id),
            "adminId": ObjectId(admin_id),
            "active": True,
        }
    )


def get_tenant_by_id(tenant_id, admin_id):
    """
    Fetches one tenant, but only if it belongs to this admin. Needed by the
    payments feature to look up which property a tenant belongs to, and
    their name, when creating a bill.
    """
    return tenants_collection.find_one(
        {"_id": ObjectId(tenant_id), "adminId": ObjectId(admin_id)}
    )


def create_tenant(admin_id, property_id, name, phone, aadhar_no, move_in_date):
    aadhar_clean = aadhar_no.replace(" ", "").replace("-", "")

    tenant_doc = {
        "propertyId": ObjectId(property_id),
        "adminId": ObjectId(admin_id),
        "name": name,
        "phone": phone,
        "aadharNo": encrypt_value(aadhar_clean),
        "aadharLast4": aadhar_clean[-4:] if len(aadhar_clean) >= 4 else "",
        "moveInDate": move_in_date,
        "moveOutDate": None,
        "active": True,
        "documents": {"driveFolderLink": None, "files": []},
    }
    result = tenants_collection.insert_one(tenant_doc)
    tenant_doc["_id"] = result.inserted_id
    return tenant_doc


def get_tenants_for_admin(admin_id, property_id=None):
    query = {"adminId": ObjectId(admin_id)}
    if property_id:
        query["propertyId"] = ObjectId(property_id)
    return list(tenants_collection.find(query).sort("moveInDate", -1))


def update_tenant(tenant_id, admin_id, name, phone, aadhar_no, move_in_date):
    update_fields = {
        "name": name,
        "phone": phone,
        "moveInDate": move_in_date,
    }

    if aadhar_no:
        aadhar_clean = aadhar_no.replace(" ", "").replace("-", "")
        update_fields["aadharNo"] = encrypt_value(aadhar_clean)
        update_fields["aadharLast4"] = aadhar_clean[-4:] if len(aadhar_clean) >= 4 else ""

    result = tenants_collection.update_one(
        {"_id": ObjectId(tenant_id), "adminId": ObjectId(admin_id)},
        {"$set": update_fields},
    )
    # matched_count, not modified_count — same fix as payments. Editing a
    # tenant back to identical values shouldn't be reported as a failure.
    return result.matched_count > 0


def move_out_tenant(tenant_id, admin_id, move_out_date):
    result = tenants_collection.update_one(
        {"_id": ObjectId(tenant_id), "adminId": ObjectId(admin_id), "active": True},
        {"$set": {"moveOutDate": move_out_date, "active": False}},
    )
    return result.matched_count > 0


def update_tenant_documents(tenant_id, admin_id, drive_folder_link):
    """
    Updates just the Drive folder link for a tenant. This is the manual,
    zero-setup version of the documents feature — the admin pastes a link
    they created themselves in Google Drive. Later, this same field can be
    populated automatically by a Drive API integration without any schema
    change.
    """
    result = tenants_collection.update_one(
        {"_id": ObjectId(tenant_id), "adminId": ObjectId(admin_id)},
        {"$set": {"documents.driveFolderLink": drive_folder_link}},
    )
    return result.matched_count > 0
