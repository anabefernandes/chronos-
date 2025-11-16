import os
import io
import sys
import base64
from PIL import Image # type: ignore
import numpy as np # type: ignore
from dotenv import load_dotenv # type: ignore
from flask import Flask, request, jsonify # type: ignore
from pymongo import MongoClient # type: ignore
import face_recognition # type: ignore

# Corrige encoding do terminal
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Carrega variáveis do .env
load_dotenv()

PORT = int(os.getenv("FACEAPI_PORT", 5001))
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "Faces")

# Conexão com o MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
users_col = db["users"]

# Flask
app = Flask(__name__)

# -----------------------------
# Função utilitária
# -----------------------------
def extract_face_embedding(image_base64):
    try:
        img_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        img_np = np.array(image)
        encodings = face_recognition.face_encodings(img_np)
        if not encodings:
            return None
        return encodings[0]
    except Exception as e:
        print("Erro ao extrair embedding:", e)
        return None

# -----------------------------
# ENDPOINT - ENROLL (Cadastrar Rosto)
# -----------------------------
@app.route("/enroll", methods=["POST"])
def enroll():
    data = request.json
    user_id = data.get("user_id")
    image = data.get("image")

    if not user_id or not image:
        return jsonify({"error": "user_id e image são obrigatórios"}), 400

    existing_user = users_col.find_one({"_id": user_id})
    if existing_user and "embedding" in existing_user:
        return jsonify({"error": "Usuário já possui cadastro facial"}), 400

    embedding = extract_face_embedding(image)
    if embedding is None:
        return jsonify({"error": "Nenhum rosto detectado"}), 400

    try:
        # Se o usuário não existe, cria; se existe sem embedding, atualiza
        users_col.update_one(
            {"_id": user_id},
            {"$set": {"embedding": embedding.tolist()}},
            upsert=True
        )
        print(f"Rosto cadastrado com sucesso para user_id: {user_id}")
        return jsonify({"message": "Rosto cadastrado com sucesso!"})
    except Exception as e:
        print("Erro ao salvar no banco:", e)
        return jsonify({"error": "Erro ao cadastrar rosto"}), 500
    
# -----------------------------
# ENDPOINT - CHECK ENROLLED (Verifica cadastro facial)
# -----------------------------
@app.route("/check-enrolled/<user_id>", methods=["GET"])
def check_enrolled(user_id):
    if not user_id:
        return jsonify({"error": "user_id é obrigatório"}), 400

    try:
        user = users_col.find_one({"_id": user_id})
        if user and "embedding" in user:
            return jsonify({"enrolled": True})
        else:
            return jsonify({"enrolled": False})
    except Exception as e:
        print("Erro ao verificar cadastro:", e)
        return jsonify({"error": "Erro ao verificar cadastro"}), 500


# -----------------------------
# INÍCIO DO SERVIDOR
# -----------------------------
if __name__ == "__main__":
    import logging
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)

    print("======================================")
    print("  FACE API INICIADA")
    print(f"  Porta: {PORT}")
    print("  Rotas disponíveis:")
    print("    POST /enroll → cadastrar rosto")
    print("    POST /verify → validar rosto")
    print("======================================")

    app.run(host="0.0.0.0", port=PORT, debug=False)
