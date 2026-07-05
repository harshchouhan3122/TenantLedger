import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

_key = os.getenv("ENCRYPTION_KEY")
if not _key:
    raise RuntimeError(
        "ENCRYPTION_KEY is missing from .env. Generate one with:\n"
        '  python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"'
    )

_fernet = Fernet(_key.encode())


def encrypt_value(plain_text):
    """Encrypt a plain string (e.g. an Aadhar number) before storing it."""
    return _fernet.encrypt(plain_text.encode()).decode()


def decrypt_value(encrypted_text):
    """Decrypt a value previously encrypted with encrypt_value(). Not used
    yet — reserved for a future 'reveal full Aadhar' admin action."""
    return _fernet.decrypt(encrypted_text.encode()).decode()
