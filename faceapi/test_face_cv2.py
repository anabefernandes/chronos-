import cv2 # type: ignore
import face_recognition # type: ignore
import numpy as np # type: ignore
from PIL import Image # type: ignore

# Caminho da imagem
image_path = "faces/pessoa6.jpg"

# ---- Tentativa 1: abrir com OpenCV ----
image_bgr = cv2.imread(image_path)

# Verifica se a imagem foi carregada corretamente
if image_bgr is None:
    raise ValueError("Erro ao carregar a imagem. Verifique o caminho do arquivo.")

# Converte de BGR para RGB
image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

# ---- Verificações de integridade ----
print("Tipo:", type(image_rgb))
print("Shape:", image_rgb.shape)
print("dtype:", image_rgb.dtype)

# Caso a imagem tenha canal alfa (4 canais), remove-o
if image_rgb.shape[2] == 4:
    print("Removendo canal alfa...")
    image_rgb = cv2.cvtColor(image_rgb, cv2.COLOR_BGRA2RGB)

# Garante que a imagem é uint8 e com valores válidos
if image_rgb.dtype != np.uint8 or image_rgb.min() < 0 or image_rgb.max() > 255:
    print("Convertendo imagem para uint8...")
    image_rgb = cv2.convertScaleAbs(image_rgb)

# ---- Caso OpenCV falhe silenciosamente, usa PIL como fallback ----
try:
    # Tentativa de detectar rostos
    face_locations = face_recognition.face_locations(image_rgb)
except Exception as e:
    print("Erro detectado com OpenCV:", e)
    print("Tentando reabrir a imagem com PIL...")
    
    # Reabrir com PIL (garante formato RGB limpo)
    image = Image.open(image_path).convert("RGB")
    image_rgb = np.array(image)
    face_locations = face_recognition.face_locations(image_rgb)

# ---- Exibir resultados ----
print("Rostos detectados:", face_locations)
print(f"Total de rostos encontrados: {len(face_locations)}")
