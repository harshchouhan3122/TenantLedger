# import firebase_admin
# from firebase_admin import credentials

# cred = credentials.Certificate(
#     "firebase/serviceAccountKey.json"
# )

# firebase_admin.initialize_app(cred)


import os
import json
import firebase_admin
from firebase_admin import credentials

if not firebase_admin._apps:

    env = os.getenv("FLASK_ENV", "development")

    if env == "production":
        firebase_json = os.getenv("FIREBASE_SERVICE_ACCOUNT")

        if not firebase_json:
            raise RuntimeError("FIREBASE_SERVICE_ACCOUNT is not configured.")

        cred = credentials.Certificate(json.loads(firebase_json))

    else:
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        cred = credentials.Certificate(
            os.path.join(BASE_DIR, "firebase/serviceAccountKey.json")
        )

    firebase_admin.initialize_app(cred)