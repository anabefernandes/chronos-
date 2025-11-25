import sys
import json
import pickle
import pandas as pd 
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # pasta onde app.py está
with open(os.path.join(BASE_DIR, "modelo.pkl"), "rb") as f:
    modelo = pickle.load(f)

# Se não passar argumento, usa um exemplo de teste
if len(sys.argv) > 1:
    input_json = json.loads(sys.argv[1])
else:
    input_json = {"idade":30, "temperatura":37.2, "saturacao":96, "queixa":"dor de cabeça"}

df = pd.DataFrame([input_json])
pred = modelo.predict(df)
print(json.dumps(pred[0]))
