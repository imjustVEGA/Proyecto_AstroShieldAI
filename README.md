# AstroShield AI

Plataforma web para analizar, clasificar, visualizar y priorizar objetos espaciales: satélites, cuerpos de
cohete, basura espacial (catálogo **SATCAT** de CelesTrak) y asteroides cercanos a la Tierra (**NEO** de NASA NeoWs).

Esta versión une los dos proyectos del equipo:

| Viene de **Astroshield AI** | Viene de **FER** |
|---|---|
| Diseño de interfaz (paleta, tipografía Manrope, layout, componentes) | Login con JWT, roles y gestión de usuarios (SQLite) |
| Globo 3D con capas orbitales por altitud, referencia GEO y órbita esquemática | Stack ligero: FastAPI + pandas, React 18 + Vite + Tailwind 3 |
| Limpieza y validación de SATCAT y NEO, clasificación orbital LEO/MEO/GEO/HEO | Modelo de IA (Random Forest + Isolation Forest) en `/predict` |
| Priorización transparente de NEO (niveles A/B/C), estadísticas, fuentes de datos | Reportes CSV, configuración |

> Es un **sistema de apoyo a decisiones**. Los indicadores son descriptivos; no son predicciones de colisión ni
> probabilidades de impacto.

## Puesta en marcha (Windows, PowerShell)

### Backend (terminal 1)

```powershell
python -m venv backend\venv
& backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
& backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Los datos reales ya están en `backend/data/`:

- `satcat_celestrak.csv` — 70 587 objetos (CelesTrak SATCAT)
- `neo_nasa.csv` — 90 836 aproximaciones de 27 423 asteroides (NASA NeoWs)

Al arrancar, el backend los limpia en memoria (≈2 s) con las mismas reglas de Astroshield AI. No necesita
PostgreSQL: la base SQLite solo guarda usuarios.

**Modelo de IA (una sola vez):** para activar el clasificador de la pantalla *Simulación orbital*:

```powershell
& backend\venv\Scripts\python.exe -m backend.train
```

### Frontend (terminal 2)

```powershell
Set-Location frontend
npm install
$env:VITE_API_URL = "http://127.0.0.1:8000"
npm run dev
```

Abre `http://localhost:5173`. Si el puerto 8000 está ocupado, usa `--port 8030` en Uvicorn y cambia `VITE_API_URL`.

### Credenciales de prueba

- **Usuario:** `admin` (o `admin@astroshield.com`) · **Contraseña:** `admin123` · **Rol:** administrador

Solo para desarrollo local. Antes de desplegar configura `ASTROSHIELD_ADMIN_EMAIL`, `ASTROSHIELD_ADMIN_USERNAME`,
`ASTROSHIELD_ADMIN_PASSWORD` y `ASTROSHIELD_JWT_SECRET`.

## Con Docker (imágenes de backend y frontend)

```powershell
docker compose up -d --build
docker compose run --rm backend python -m backend.train   # opcional: modelo de IA
```

- Aplicación: http://localhost:8080
- API y documentación OpenAPI: http://localhost:8000/docs

`backend/data` y `backend/app/models` se montan como volúmenes: los datos, usuarios y modelos persisten.

## Secciones de la interfaz

| Ruta | Sección | Contenido |
|---|---|---|
| `/` | Dashboard | Resumen en 4 preguntas (qué se monitorea, qué requiere atención, qué tan cerca pasan, qué hay en órbita), vista previa del mapa, "En el radar" y análisis |
| `/explorer` | Mapa 3D | Elemento principal: buscador, categorías (NEO, satélites, cohetes, basura espacial, sin clasificar), selección de hasta 8 objetos, órbitas y distancias bajo demanda, ficha resumida y ficha técnica |
| `/neos` | Objetos NEO | Pestañas *Vista general* (indicadores y catálogo con filtros) y *Análisis* (4 gráficas); ficha técnica por objeto |
| `/satcat` | Catálogo SATCAT | Pestañas *Vista general* (indicadores y tabla con filtros) y *Análisis* (4 gráficas); ficha completa |
| `/risks` | Análisis de riesgos | Pestañas *Resumen* (niveles A/B/C y objetos prioritarios) y *Metodología y ranking completo* |
| `/estadisticas` | Estadísticas | Distribuciones orbitales, matrices tipo × estado, comparación NEO |
| `/simulacion` | Simulación orbital | Órbita kepleriana en el globo (periodo, vis-viva, ocupación real de la capa) y clasificador de IA |
| `/reportes` | Reportes | Vista previa y exportación CSV (ranking NEO, catálogo NEO, SATCAT) |
| `/datos` | Fuentes de datos | Procedencia, SHA-256, unidades verificadas e incidencias de calidad |
| `/configuracion` | Configuración | Accesibilidad, tema y filas por tabla |
| `/usuarios` | Usuarios | Alta, edición y baja de cuentas (solo administradores) |

El mapa guarda la selección en la URL (`/explorer?sel=s25544,n3542519&active=s25544`; `s` = NORAD de SATCAT,
`n` = id de NEO), así que una vista se puede compartir o recargar. Los enlaces anteriores `/explorer?id=25544` siguen funcionando.

### Accesibilidad

Botón **Accesibilidad** en la barra superior (también en *Configuración*), con efecto en toda la aplicación y
guardado en el navegador:

- Tamaño del texto: normal, grande (112,5 %) y muy grande (125 %). Toda la tipografía y los espaciados están en `rem`.
- Alto contraste: textos y bordes más marcados y foco amarillo.
- Animaciones: según el sistema (`prefers-reduced-motion`), reducidas o completas.
- Teclado: enlace "Saltar al contenido", foco visible, pestañas con flechas, `Escape` cierra paneles y en el mapa
  las flechas giran la vista, `+`/`−` acercan o alejan y `0` vuelve a encuadrar.

Búsqueda global en la barra superior (atajo **Ctrl K**).

## API

Todas las rutas de datos requieren el token de `POST /token`.

| Método y ruta | Descripción |
|---|---|
| `GET /health` | Estado del servicio y de los datasets |
| `GET /dashboard/summary` | Indicadores, NEO destacados, lanzamientos recientes |
| `GET /search?q=` | Búsqueda global en SATCAT y NEO |
| `GET /satcat` | Lista paginada. Filtros: `q`, `object_type`, `owner`, `state`, `ops_status`, `orbit_class`, `incomplete_only`; orden `sort`, `order` |
| `GET /satcat/statistics` · `GET /satcat/{norad_id}` | Estadísticas del catálogo · ficha con etiquetas, calidad y registro original |
| `GET /neo` | Asteroides (uno por objeto). Filtros de peligrosidad, nivel, diámetro (km), velocidad (km/h) y distancia (km) |
| `GET /neo/statistics` · `GET /neo/distance-diameter` · `GET /neo/{id}` | Histogramas · dispersión · ficha con aproximaciones |
| `GET /analytics/orbital-distribution` · `/analytics/object-classification` · `/analytics/neo-prioritization` | Analítica descriptiva y priorización |
| `GET /visualization/orbital-shells` · `/visualization/capabilities` | Capas del globo y qué se puede visualizar |
| `GET /datasets` | Fuentes, estado de carga e informe de calidad |
| `POST /predict` | Clasificador de IA (Random Forest + Isolation Forest) |
| `POST /token` · `/users/` | Autenticación y CRUD de usuarios |

## Pruebas

```powershell
& backend\venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
& backend\venv\Scripts\python.exe -m pytest backend\tests            # limpieza, órbitas, priorización y API
& backend\venv\Scripts\python.exe backend\scripts\smoke_api.py        # con el backend encendido
```

## Textura de la Tierra

El globo usa `frontend/public/textures/tierra-astroshield.jpg`, generada a partir de los contornos de Natural Earth
(dominio público) con la paleta de la app, así que funciona sin internet. Para regenerarla:

```powershell
pip install pillow
python frontend\scripts\generar_textura_tierra.py
```

## Priorización NEO (resumen)

1. **Nivel A**: `hazardous` según la fuente **y** alguna aproximación registrada a ≤ 0.05 UA.
2. **Nivel B**: `hazardous`, o diámetro máximo estimado ≥ 140 m con aproximación ≤ 0.05 UA.
3. **Nivel C**: el resto.
4. **Orden dentro de cada nivel**: puntuación 0–100 = 45 % proximidad + 35 % tamaño + 20 % velocidad, en
   percentiles relativos a este dataset.

## Stack

Backend: Python 3.12, FastAPI 0.109, pandas 2.1, NumPy 1.26, scikit-learn 1.3, imbalanced-learn 0.11,
SQLAlchemy 2 (SQLite), python-jose, passlib.
Frontend: React 18.2, Vite 5, Tailwind CSS 3.4, react-globe.gl + three.js, Recharts, Axios, React Router 6,
framer-motion, lucide-react, sonner.
