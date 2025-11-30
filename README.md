# Chronos – Sistema de Controle de Ponto com Reconhecimento Facial e Geolocalização

Sistema completo para registro de ponto, escalas, holerites e tarefas, com autenticação baseada em papéis (admin, chefia, funcionário) e módulo de reconhecimento facial integrado via API em Python + Docker.

O projeto possui:
- Backend Node.js em deploy no Render
- API de Reconhecimento Facial em Python (Docker Hub + Render)
- Aplicativo Mobile (React Native + Expo) com APK disponível para download
- Machine Learning para análises internas
- Banco MongoDB
- Frontend configurável via variáveis de ambiente

---

## 🚀 Links do Projeto

### 📱 APK Android
Baixe e instale o app:  
👉 https://expo.dev/accounts/anabiafernandes/projects/chronos/builds/d29dc61d-f2ec-466a-bc75-9af89e11fce4

### 🌐 Backend (Node + Express) – Deploy no Render
https://chronos-8rba.onrender.com

### 🧠 API de Reconhecimento Facial (Python + Docker) – Deploy no Render
https://minha-faceapi-latest.onrender.com

---

## 🔧 Tecnologias Utilizadas

### Backend
- Node.js + Express
- MongoDB
- JWT
- Swagger
- bcryptjs
- RBAC (roles: admin, chefia, funcionário)

### Machine Learning / Reconhecimento Facial
- Python
- OpenCV / face recognition
- Pandas, NumPy, Scikit-learn
- Docker Hub + Render

### Mobile
- React Native
- Expo
- APK gerado via EAS Build

---

## 📦 Funcionalidades

### 👤 Usuários
- CRUD completo
- Admin cria chefias e funcionários
- Controle de permissões por papel

### ⏱ Ponto
- Registrar entrada, saída, início e retorno do almoço
- Registro com timestamp e localização
- Consulta dos pontos do usuário

### 🧾 Relatório em PDF
- Cálculo automático de horas trabalhadas
- Subtração automática de almoço
- Cálculo de salário líquido
- Gera relatório em PDF dos pontos batidos
- Listagem (admin) e visualização individual

### 🗓 Escala
- Criar e editar escalas
- Consultar escala própria ou geral

### 📋 Tarefas
- CRUD de tarefas para funcionários
- Gestão por chefia/admin

### 🤖 Machine Learning
- Modelo para análise/diagnóstico com integração ao backend
- API em Python consumida pelo Node

---

## ⚙️ Como Rodar o Projeto Localmente

### 1️⃣ Clonar o repositório

```bash
git clone https://github.com/anabefernandes/chronos-.git
cd chronos
```

---

# 🛠 Backend (Node.js)

### 2️⃣ Criar .env no backend:

```env
PORT=5000
MONGO_URI=<SUA_URL_MONGO>
JWT_SECRET=<SENHA_SEGURA>

CORS_ORIGIN=*
CREATE_SECRET=123456
ADMIN_EMAIL=admin@email.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin
```

### 3️⃣ Instalar dependências e rodar:

```bash
npm install
npm run dev
```

Backend estará disponível em:  
`http://localhost:5000`

---

# 🧠 Machine Learning (Python)

### Configuração local (opcional)

```bash
cd backend/ml
python -m venv ml.venv
source ml.venv/bin/activate  # ou ml.venv\Scripts\activate no Windows
pip install pandas scikit-learn numpy joblib python-dotenv
```

### Rodar os scripts:

```bash
python treinar_modelo.py
python app.py
```

### Endpoint de teste:

```
POST http://localhost:5000/api/ml/predict
```

### Exemplo de body:

```json
{
  "idade": 25,
  "temperatura": 37.8,
  "saturacao": 98,
  "queixa": "Dor de garganta e tosse leve"
}
```

---

# 📱 Frontend – React Native + Expo

### ✔️ 1. Usando o APK (produção)
Basta instalar o arquivo no Android.

### ✔️ 2. Rodando localmente

Criar arquivo `.env` no frontend:

```env
EXPO_PUBLIC_API_URL=https://chronos-8rba.onrender.com
EXPO_PUBLIC_FACEAPI_URL=https://minha-faceapi-latest.onrender.com
EXPO_PUBLIC_APP_NAME=Chronos
EXPO_PUBLIC_APP_ENV=production
```

Rodar:

```bash
npm install
npx expo start
```

Abrir no Expo Go ou no emulador Android.

---

# 🐳 Reconhecimento Facial via Docker (opcional)

```bash
docker pull <seu-usuario-docker>/<nome-da-imagem>
docker run -p 5001:5001 <seu-usuario-docker>/<nome-da-imagem>
```

---

# 📘 Documentação da API

Backend possui documentação via Swagger em:

```
/api-docs
```

