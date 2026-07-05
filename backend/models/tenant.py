from bson import ObjectId
from db import db
from crypto_utils import encrypt_value

tenants_collection = db.tenants


def get_active_tenant_for_property(property_id, admin_id):
    """
    Used before creating a new tenant, to enforce "only one active tenant
    per property at a time" — and used by the properties list to show
    occupied/vacant status.
    """
    return tenants_collection.find_one(
        {
            "propertyId": ObjectId(property_id),
            "adminId": ObjectId(admin_id),
            "active": True,
        }
    )


def create_tenant(admin_id, property_id, name, phone, aadhar_no, move_in_date):
    aadhar_clean = aadhar_no.replace(" ", "").replace("-", "")

    tenant_doc = {
        "propertyId": ObjectId(property_id),
        "adminId": ObjectId(admin_id),
        "name": name,
        "phone": phone,
        "aadharNo": encrypt_value(aadhar_clean),
        # Plain, unencrypted last 4 digits — lets the UI show a masked
        # "XXXX-XXXX-1234" without ever needing to decrypt anything.
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
    """
    All tenants (past and present) belonging to this admin. Optionally
    filtered to one property — this is what powers a property's
    "current tenant + past tenant history" view.
    """
    query = {"adminId": ObjectId(admin_id)}
    if property_id:
        query["propertyId"] = ObjectId(property_id)
    return list(tenants_collection.find(query).sort("moveInDate", -1))


def move_out_tenant(tenant_id, admin_id, move_out_date):
    """
    Closes a tenancy WITHOUT deleting it — sets active to False and records
    the move-out date. The tenant's entire payment history stays attached
    to this same document forever. A new tenant for the same property is
    always a brand-new document, never a re-use of this one.
    """
    result = tenants_collection.update_one(
        {"_id": ObjectId(tenant_id), "adminId": ObjectId(admin_id), "active": True},
        {"$set": {"moveOutDate": move_out_date, "active": False}},
    )
    return result.modified_count > 0
