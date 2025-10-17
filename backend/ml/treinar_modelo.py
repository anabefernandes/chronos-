import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix

# 1. Carregar dataset
df = pd.read_csv("fichas_pacientes_realista.csv")
print("Dataset carregado:", df.shape)

# 2. Separar features e target
X = df[["idade", "temperatura", "saturacao", "queixa"]]
y = df["prioridade"]

# 3. Dividir treino/teste
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 4. Pré-processamento e pipeline
preprocessor = ColumnTransformer([
    ("tfidf", TfidfVectorizer(), "queixa"),
    ("num", StandardScaler(), ["idade", "temperatura", "saturacao"])
])

pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("clf", RandomForestClassifier(n_estimators=100, random_state=42))
])

# 5. Treinar modelo
pipeline.fit(X_train, y_train)

# 6. Avaliar
y_pred = pipeline.predict(X_test)
print("=== Relatório de Classificação ===")
print(classification_report(y_test, y_pred))
print("=== Matriz de Confusão ===")
print(confusion_matrix(y_test, y_pred))

# 7. Salvar modelo treinado
with open("modelo.pkl", "wb") as f:
    pickle.dump(pipeline, f)

print("✅ Modelo salvo em 'modelo.pkl'")
