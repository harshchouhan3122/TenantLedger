import bcrypt
from db import db
from bson import ObjectId
from pymongo.errors import DuplicateKeyError

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


# def get_users():
#     users = users_collection.find()
#     users = [{"username": user['name'], "role": user['role'], "contact": user['phone'][3:] } for user in users]
#     # users = [user['name'] for user in users]
#     return users

def get_users():
    users = users_collection.find()

    result = []

    for user in users:
        result.append({
            "id": str(user["_id"]),
            "name": user["name"],
            # "phone": user["phone"][3:] if user.get("phone") else "",
            "phone": user["phone"][3:] if user["phone"][0] == "+" else user["phone"],
            "role": user["role"],
        })

    return result


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



from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models.user import (
    create_user,
    find_user_by_id,
    user_exists,
)

users_bp = Blueprint("users", __name__)


@users_bp.route("", methods=["POST"])
@jwt_required()
def register_user():

    current_user = find_user_by_id(get_jwt_identity())

    if current_user["role"] != "master":
        return jsonify({"error": "Only master user can create users."}), 403

    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()
    password = data.get("password", "")
    role = data.get("role", "admin")

    if not name or not phone or not password:
        return jsonify({"error": "All fields are required."}), 400

    if role not in ["master", "admin", "tenant"]:
        return jsonify({"error": "Invalid role selected."}), 400

    if user_exists(phone):
        return jsonify(
            {"error": "User already exists with this contact number."}
        ), 409

    user_id = create_user(
        name=name,
        phone=phone,
        password=password,
        role=role,
    )

    user = find_user_by_id(user_id)

    return jsonify(
        {
            "message": "User created successfully.",
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "phone": user["phone"],
                "role": user["role"],
            },
        }
    ), 201


def phone_exists_except_user(phone, user_id):
    return users_collection.find_one(
        {
            "phone": phone,
            "_id": {"$ne": ObjectId(user_id)}
        }
    )


def update_user(user_id, name, phone, role):
    result = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "name": name,
                "phone": phone,
                "role": role,
            }
        }
    )

    return result.modified_count > 0


def delete_user(user_id):
    result = users_collection.delete_one(
        {"_id": ObjectId(user_id)}
    )

    return result.deleted_count > 0



def reset_user_password(user_id, new_password):
    password_hash = bcrypt.hashpw(
        new_password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    result = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "passwordHash": password_hash
            }
        }
    )

    return result.modified_count > 0