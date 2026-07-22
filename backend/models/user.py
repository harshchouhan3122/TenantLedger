import bcrypt
from db import db
from bson import ObjectId

users_collection = db.users


def find_user_by_phone(phone):
    """Look up a user (admin or tenant) by their phone number."""
    return users_collection.find_one({"phone": phone})

def user_exists(phone):
    return users_collection.find_one({"phone": phone}) is not None

def create_user(name, phone, password, role="admin", tenant_id=None):
    """
    Create a new user. Used by the seed script now (admin), and later by the
    admin dashboard when creating tenant login accounts.
    """
    if find_user_by_phone(phone):
        raise ValueError("A user with this phone number already exists")

    # pass (str) -> byte -> Pass+Salt byte -> str (Hashed Password store in db)
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    user = {
        "name": name,
        "phone": phone,
        "passwordHash": password_hash.decode("utf-8"),
        "role": role,  # "admin" | "tenant"
        "tenantId": tenant_id,  # ObjectId of the tenants collection, or None for admins
    }
    result = users_collection.insert_one(user)
    return result.inserted_id


def verify_password(plain_password, password_hash):
    """Check a plain-text password against the stored bcrypt hash."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))


def get_users():
    users = users_collection.find()
    users = [{"username": user['name'], "role": user['role'], "contact": user['phone'][3:] } for user in users]
    # users = [user['name'] for user in users]
    return users


def find_user_by_id(user_id):
    return users_collection.find_one({"_id": ObjectId(user_id)})


def update_user_profile(user_id, name, phone):
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "name": name,
                "phone": phone,
            }
        },
    )
    return find_user_by_id(user_id)

def update_password(user_id, password_hash):
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "passwordHash": password_hash,
            }
        },
    )