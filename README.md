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
