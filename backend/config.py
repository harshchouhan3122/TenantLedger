import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

IS_PRODUCTION = os.getenv("FLASK_ENV") == "production"


class Config:
    MONGO_URI = os.getenv("MONGO_URI")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")

    # --- Cookie-based JWT settings ---
    JWT_TOKEN_LOCATION = ["cookies"]

    # Only send cookies over HTTPS once deployed. Locally this stays False
    # since your dev server runs on plain http://localhost.
    JWT_COOKIE_SECURE = IS_PRODUCTION

    # "Lax" blocks the cookie from being sent on cross-site requests
    # initiated elsewhere, while still allowing normal same-site navigation.
    JWT_COOKIE_SAMESITE = "Lax"

    # Adds a second, non-httpOnly CSRF cookie. Since the JWT cookie itself
    # is sent automatically by the browser, this extra token (which the
    # frontend must read and send back as a header) proves a request
    # actually came from our own frontend page.
    JWT_COOKIE_CSRF_PROTECT = True

    # Scope each cookie to only the routes that need it — reduces exposure.
    JWT_ACCESS_COOKIE_PATH = "/api/"
    JWT_REFRESH_COOKIE_PATH = "/api/auth/refresh"

    # Short-lived: if this token were ever stolen, it's only useful for
    # a few minutes.
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)

    # Longer-lived: lets the frontend silently get a new access token
    # without forcing a fresh login every 15 minutes.
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
