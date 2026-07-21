import os
from dotenv import load_dotenv

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/drive"]
SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE")
PARENT_FOLDER_ID = os.getenv("GOOGLE_DRIVE_PARENT_FOLDER_ID")

_drive_service = None


def _get_drive_service():
    global _drive_service

    if _drive_service is None:
        if not SERVICE_ACCOUNT_FILE or not PARENT_FOLDER_ID:
            raise RuntimeError(
                "GOOGLE_SERVICE_ACCOUNT_FILE and GOOGLE_DRIVE_PARENT_FOLDER_ID "
                "must be set in .env to use Drive folder automation."
            )

        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES
        )
        _drive_service = build("drive", "v3", credentials=credentials)

    return _drive_service


def create_tenant_folder(folder_name):
    service = _get_drive_service()

    file_metadata = {
        "name": folder_name,
        "mimeType": "application/vnd.google-apps.folder",
        "parents": [PARENT_FOLDER_ID],
    }
    folder = service.files().create(body=file_metadata, fields="id, webViewLink").execute()
    return folder.get("webViewLink")
