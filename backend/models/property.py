from bson import ObjectId
from db import db

properties_collection = db.properties


def create_property(admin_id, name, property_type, address):
    property_doc = {
        "adminId": ObjectId(admin_id),
        "name": name,
        "type": property_type,  # "shop" | "house"
        "address": address,
        "documents": {"driveFolderLink": None, "files": []},
    }
    result = properties_collection.insert_one(property_doc)
    property_doc["_id"] = result.inserted_id
    return property_doc


def get_properties_for_admin(admin_id):
    """Only ever returns properties owned by this admin — never all properties."""
    return list(properties_collection.find({"adminId": ObjectId(admin_id)}))


def get_property_by_id(property_id, admin_id):
    """
    Fetches one property, but ONLY if it belongs to this admin. If a
    different admin's property id is passed in, this returns None rather
    than someone else's data — this is the enforcement point for isolation
    on a single-record lookup.
    """
    return properties_collection.find_one(
        {"_id": ObjectId(property_id), "adminId": ObjectId(admin_id)}
    )
