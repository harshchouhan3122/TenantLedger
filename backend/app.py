from flask_cors import CORS
from flask import Flask
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

client = MongoClient(os.getenv("MONGO_URI"))
db = client.get_database()

port = os.getenv("PORT")

@app.route("/api/health")
def health():
    try:
        client.admin.command("ping")
        return {"status": "ok", "db": db.name, "mongo": "connected"}
    except Exception as e:
        return {"status": "error", "mongo": "failed", "detail": str(e)}, 500

if __name__ == "__main__":
    print(f"Listening on port : {port}")
    app.run(debug=True, port=port)