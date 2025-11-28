from flask import Flask, request, jsonify 
import pickle
import pandas as pd 
import os

# Inicializa o Flask
app = Flask(__name__)

# Encontra o caminho absoluto do modelo para garantir que ele seja encontrado
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "modelo.pkl")

# Carrega o modelo de ML
with open(MODEL_PATH, "rb") as f:
    modelo = pickle.load(f)

@app.route('/predict', methods=['POST'])
def predict_priority():
    try:
        data = request.get_json()

        # Validação básica dos dados recebidos
        required_fields = ['idade', 'temperatura', 'saturacao', 'queixa']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Dados de entrada incompletos'}), 400

        # Cria um DataFrame para o modelo
        df = pd.DataFrame([data])
        
        # Realiza a predição
        prediction = modelo.predict(df)
        
        # Retorna a predição como JSON
        return jsonify({'prioridade': prediction[0]})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Roda o servidor na sua rede local na porta 5000
    # O '0.0.0.0' permite que outros dispositivos na mesma rede (como seu celular) acessem
    app.run(host='0.0.0.0', port=5000, debug=True)