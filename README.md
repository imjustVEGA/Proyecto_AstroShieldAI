# AstroShieldAI

MVP con FastAPI, RandomForest, IsolationForest y React para monitorear NEOs de
NASA CNEOS. El proyecto no incluye datos inventados: descarga el CSV oficial y
guárdalo como `backend/data/neos.csv`.

## Backend (PowerShell, terminal 1)

```powershell
python -m venv backend\venv
& backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
& backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Deja esta terminal abierta mientras uses la aplicación. La API expone
`POST /token`, `GET /users/`, `GET /satcat` y `GET /stats`, entre otros endpoints.
El request de `/predict` usa exactamente las cinco features numéricas definidas
en el contrato del MVP.

Si el puerto 8000 está ocupado, arranca Uvicorn con `--port 8030` y cambia
`VITE_API_URL` en la terminal del frontend a `http://127.0.0.1:8030`.

## Credenciales de prueba

Al iniciar el backend se crea automáticamente una cuenta de administrador si
todavía no existe:

- **Email / usuario:** `admin@astroshield.com` (también puedes ingresar `admin`)
- **Contraseña:** `admin123`
- **Rol:** administrador

Estas credenciales son únicamente para desarrollo local. Antes de desplegar,
configura `ASTROSHIELD_ADMIN_EMAIL`, `ASTROSHIELD_ADMIN_USERNAME`,
`ASTROSHIELD_ADMIN_PASSWORD` y `ASTROSHIELD_JWT_SECRET` con valores seguros.

## Frontend (PowerShell, terminal 2)

```powershell
Set-Location frontend
npm install
$env:VITE_API_URL = "http://127.0.0.1:8000"
npm run dev
```

Abre la URL que muestre Vite (normalmente `http://localhost:5173`). CORS permite
ese origen y `http://127.0.0.1:5173`; Axios conecta con la API en
`http://127.0.0.1:8000`. Si cambias `VITE_API_URL`, reinicia Vite para aplicar
el cambio.

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
