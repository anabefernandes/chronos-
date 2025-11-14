from threading import Thread
import uuid
from flask import Flask, request, jsonify
import face_recognition
import numpy as np
from PIL import Image
import io
import base64
from datetime import datetime
from pymongo import MongoClient
import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


app = Flask(__name__)

# Conexão com o MongoDB 
MONGO_URI = "mongodb+srv://mariadudaeduardafds:PS5PZFS8fARRGH96@teste.jxs1hc9.mongodb.net/?appName=Teste" 
DB_NAME = "chronos"
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
users = db["users"]  

def extrair_encoding(image_base64):
    """Converte imagem Base64 em encoding facial otimizado."""
    try:
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]

        img_data = base64.b64decode(image_base64)
        img_pil = Image.open(io.BytesIO(img_data)).convert("RGB")
        img_pil.thumbnail((800, 800))  # Reduz tamanho pra acelerar
        img_np = np.array(img_pil, dtype=np.uint8)

        face_locations = face_recognition.face_locations(img_np, model="hog")
        encodings = face_recognition.face_encodings(img_np, face_locations)

        if len(encodings) == 0:
            return None, "Nenhum rosto detectado na imagem"

        return encodings[0], None
    except Exception as e:
        return None, f"Erro ao processar imagem: {str(e)}"
    

def processar_encoding_async(user_id, image_base64, email):
    encoding, erro = extrair_encoding(image_base64)
    if encoding is not None:
        users.update_one(
            {"_id": user_id},
            {"$set": {"face_encoding": encoding.tolist(), "email": email}},
            upsert=True
        )


@app.route("/enroll", methods=["POST"])
def enroll_face():
    """
    Recebe JSON com:
      - user_id
      - image (base64)
    Gera encoding e salva no MongoDB.
    """
    data = request.get_json()
    user_id = data.get("user_id")
    image_base64 = data.get("image")
    email = data.get("email") or str(uuid.uuid4())

    if not user_id or not image_base64:
        return jsonify({"error": "Campos obrigatórios ausentes"}), 400
    
    user_existente = users.find_one({"_id": user_id}, {"face_encoding": 1})
    if user_existente and user_existente.get("face_encoding"):
        return jsonify({"message": "Rosto já cadastrado!"}), 200
    
    Thread(target=processar_encoding_async, args=(user_id, image_base64, email)).start()
    return jsonify({"message": "Processamento iniciado!"}), 202



@app.route("/verify", methods=["POST"])
def verify_face():
    """
    Recebe JSON com:
      - user_id
      - image (base64)
      - status (entrada/saída)
      - localizacao
    Compara rosto enviado com encoding salvo no banco.
    """
    data = request.get_json()
    user_id = data.get("user_id")
    image_base64 = data.get("image")
    status = data.get("status", "entrada")
    localizacao = data.get("localizacao", "não informada")

    if not user_id or not image_base64:
        return jsonify({"error": "Campos obrigatórios ausentes"}), 400

    # Recupera encoding do usuário
    user = users.find_one({"_id": user_id})
    if not user or "face_encoding" not in user:
        return jsonify({"error": "Usuário sem rosto cadastrado"}), 404

    ref_encoding = np.array(user["face_encoding"])

    # Extrai encoding da imagem enviada
    probe_encoding, erro = extrair_encoding(image_base64)
    if probe_encoding is None:
        return jsonify({"error": erro}), 400

    # Calcula distância entre rostos
    distance = face_recognition.face_distance([ref_encoding], probe_encoding)[0]
    match = distance <= 0.5  # threshold ajustável

    if not match:
        return jsonify({
            "match": False,
            "distance": float(distance),
            "error": "Rosto não reconhecido"
        }), 401

    ponto = {
        "user_id": user_id,
        "status": status,
        "localizacao": localizacao,
        "data_hora": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    return jsonify({
        "Encontrado": True,
        "distance": float(distance),
        "ponto": ponto
    }), 200


# =========================================
# INÍCIO DO SERVIDOR
# =========================================
if __name__ == "__main__":
    print("Servidor Flask rodando em http://192.168.0.214:5001")
    print("POST /enroll → cadastrar rosto")
    print("POST /verify → validar rosto e bater ponto")
    app.run(host="0.0.0.0", port=5001)
