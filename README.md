# AstroShieldAI

MVP con FastAPI, RandomForest, IsolationForest y React para monitorear NEOs de
NASA CNEOS. El proyecto no incluye datos inventados: descarga el CSV oficial y
guárdalo como `backend/data/neos.csv`.

## Backend

```powershell
py -3.11 -m venv .venv
.venv\Scripts\pip install -r backend\requirements.txt
python -m backend.train
uvicorn backend.app.main:app --reload
```

La API expone `GET /health`, `GET /neos`, `POST /predict` y `GET /stats`.
El request de `/predict` usa exactamente las cinco features numéricas definidas
en el contrato del MVP.

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Configura `VITE_API_URL` si la API no está en `http://localhost:8000`.

ASTROSHIELD AI

Backend / IA:

Python 3.11.9: Lenguaje base para la IA y el procesamiento.

FastAPI 0.109.0: Crear el "puente" (API) para conectar Python con React.

Uvicorn 0.27.0: Encender el servidor de FastAPI.

Pandas 2.1.4: Limpiar y ordenar los datos (CSV).

NumPy 1.26.2: Hacer cálculos matemáticos con los datos.

Scikit-Learn 1.3.2: Entrenar los modelos (Random Forest e Isolation Forest).

Imbalanced-Learn 0.11.0: Ayudar al modelo a detectar los asteroides peligrosos (que son los menos).

Joblib 1.3.2: Guardar el modelo entrenado en un archivo.

Frontend / UI:

React 18.2.0: Crear la interfaz visual interactiva.

Vite 5.0.8: Compilar React de forma rápida.

Tailwind CSS 3.4.1: Dar el diseño oscuro y futurista.

Axios 1.6.5: Pedir los datos a Python (FastAPI).

Recharts 2.10.4: Dibujar las gráficas de barras.

React-Globe.gl 2.27.2: Renderizar el globo terráqueo 3D.

React Router DOM 6.21.1: Navegar entre las pantallas (Dashboard, NEO, etc.).

Lucide React 0.309.0: Agregar íconos bonitos al menú.

Hosting / Despliegue:

Render.com: Alojar el backend (Python) gratis.

Vercel.com: Alojar el frontend (React) gratis.

Herramientas de Apoyo:

Visual Studio Code: Editor de código.

Git / GitHub: Control de versiones del proyecto.

Node.js 20.11.0: Necesario para que React funcione.

Canva: Diseñar los wireframes (Alta fidelidad).
