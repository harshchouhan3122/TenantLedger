from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from db import db
from routes.auth import auth_bp
from routes.properties import properties_bp
from routes.tenants import tenants_bp

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

jwt = JWTManager(app)

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(properties_bp, url_prefix="/api/properties")
app.register_blueprint(tenants_bp, url_prefix="/api/tenants")


@app.route("/api/health")
def health():
    try:
        db.client.admin.command("ping")
        return {"status": "ok", "db": db.name, "mongo": "connected"}
    except Exception as e:
        return {"status": "error", "mongo": "failed", "detail": str(e)}, 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)
