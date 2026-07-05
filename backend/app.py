from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from db import db
from routes.auth import auth_bp

app = Flask(__name__)
app.config.from_object(Config)

# supports_credentials=True is required for cookies to be sent/received
# cross-origin (frontend on :5173, backend on :5001 during dev). The origin
# must be an exact match — browsers reject "*" once credentials are involved.
# Update this list when you deploy to your real frontend URL.
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

jwt = JWTManager(app)

app.register_blueprint(auth_bp, url_prefix="/api/auth")


@app.route("/api/health")
def health():
    try:
        db.client.admin.command("ping")
        return {"status": "ok", "db": db.name, "mongo": "connected"}
    except Exception as e:
        return {"status": "error", "mongo": "failed", "detail": str(e)}, 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)
