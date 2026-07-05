"""
One-time script to create the first admin user in the database.

Run it once from the backend/ folder (with your venv activated):
    python seed_admin.py

You can run it again later to create your friend's admin account too —
just run it again with their details.
"""

import getpass
from models.user import create_user, find_user_by_phone


def main():
    print("Create an admin account\n")

    name = input("Name: ").strip()
    phone = input("Phone (with country code, e.g. +91XXXXXXXXXX): ").strip()

    if find_user_by_phone(phone):
        print("\nA user with this phone number already exists. Aborting.")
        return

    password = getpass.getpass("Password: ").strip()
    confirm = getpass.getpass("Confirm password: ").strip()

    if not password:
        print("\nPassword cannot be empty. Aborting.")
        return

    if password != confirm:
        print("\nPasswords do not match. Aborting.")
        return

    user_id = create_user(name=name, phone=phone, password=password, role="admin")
    print(f"\nAdmin account created successfully. User id: {user_id}")


if __name__ == "__main__":
    main()
