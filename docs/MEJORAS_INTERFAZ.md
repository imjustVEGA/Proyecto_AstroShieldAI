# Mejoras de interfaz, mapa 3D y accesibilidad · AstroShield AI

Fecha: 20 de noviembre de 2026. Alcance: solo el frontend (`frontend/`). El backend, los modelos de datos, la
limpieza, la priorización y el modelo de IA no se modificaron.

## 1. Análisis previo

- **Stack**: React 18 + Vite 5 + Tailwind 3, globo con `react-globe.gl` (three.js), gráficas con Recharts, API FastAPI
  con datos reales en memoria (SATCAT de CelesTrak y NEO de NASA NeoWs).
- **Mapa 3D anterior**: diez capas de altitud dibujadas siempre, cada una con 24 meridianos y 13 paralelos, más el anillo
  GEO; cámara muy lejana (Tierra pequeña) y un solo objeto elegible desde un `<select>` con 9 ejemplos.
- **Qué permiten los datos** (lo que marca qué se puede dibujar):

  | Dato | SATCAT | NEO |
  |---|---|---|
  | Tamaño, forma e inclinación de la órbita | Sí (apogeo, perigeo, inclinación) | No |
  | Orientación de la órbita (RAAN, ω), época, TLE/OMM | No | No |
  | Posición actual | No | No |
  | Distancia a la Tierra | Altura (perigeo–apogeo) | Distancia mínima por aproximación |
  | Velocidad | Calculable con vis-viva | Velocidad relativa por aproximación |
  | Fecha de aproximación | — | **No** (el CSV no la trae) |
  | Riesgo | No calculable | Nivel de atención A/B/C del sistema y PHA de NASA; **sin probabilidad de impacto** |
  | `sentry_object` | — | Constante (`False`) en todo el archivo |

- **Tipografía**: casi todos los textos estaban en px fijos (7,5 a 13 px), así que no podían escalarse.

## 2. Mapa 3D (`/explorer`, ahora "Mapa 3D")

- **Vista inicial limpia**: solo la Tierra, grande y centrada. Sin capas ni trayectorias hasta elegir un objeto.
- **Selección**: panel con buscador, categorías (Destacados, NEO, Satélites, Cohetes, Basura espacial, Sin clasificar),
  filtros (régimen orbital y orden para SATCAT; nivel de atención o PHA para NEO), paginación y selección múltiple
  (hasta 8). Lista "En el mapa" para enfocar o quitar cada objeto y botón **Limpiar**.
- **Al seleccionar**: la cámara encuadra el objeto, se resalta, los demás se atenúan (sin rótulo, órbita tenue) y aparece
  la ficha resumida. La ficha técnica completa (`SatelliteDetailPanel` / `NeoDetailPanel`) se abre como panel lateral sin
  salir del mapa. La cámara desplaza la escena para que la ficha no tape el objeto.
- **Satélites, cohetes, basura**: órbita esquemática real en tamaño, forma e inclinación (RAAN = ω = 0, rotulado); el punto
  marca el perigeo.
- **NEO**: no hay trayectoria en los datos, así que no se inventa. Se dibuja **a escala** la distancia mínima registrada como
  anillo alrededor de la Tierra, con la órbita de la Luna como referencia; la dirección del marcador es ilustrativa y se
  indica. La ficha muestra "Fecha de aproximación: no disponible", "Trayectoria: no disponible" y "Probabilidad de impacto:
  no calculada".
- **Objetos de interés**: nivel A (alta) en rojo y B (media) en ámbar, siempre con texto; nunca se presenta proximidad
  como probabilidad de impacto. Para SATCAT el riesgo figura como "No calculable con estos datos".
- **Capas opcionales** (botón Capas): órbitas y distancias, referencias (GEO y Luna) y densidad por altitud (las capas
  agregadas de antes, ahora con 5 líneas guía en lugar de 37).
- **Leyenda** dinámica (solo lo que está dibujado) y plegable; indicador "Tierra" de tamaño constante cuando la vista se aleja
  para un NEO lejano (hasta ~195 LD).
- **Teclado** con el mapa enfocado: flechas giran, `+`/`−` acercan o alejan, `0` encuadra.
- **Abajo, en pestañas**: Cómo leer el mapa (pasos y glosario), Ocupación por altitud y Alcance de los datos.
- La selección vive en la URL: `?sel=s25544,n3542519&active=s25544`. `?id=25544` sigue funcionando.

## 3. Interfaz por niveles

- **Dashboard**: cuatro indicadores formulados como preguntas (¿Qué se monitorea? ¿Qué requiere atención? ¿Qué tan cerca
  pasan? ¿Qué hay en órbita?), vista previa del mapa con la órbita real de la ISS, "En el radar" con enlaces al mapa y
  sección de análisis separada. Nuevo dato real: NEO que pasaron más cerca que la Luna (`/neo?max_distance_km=384399`).
- **Objetos NEO y Catálogo SATCAT**: pestañas *Vista general* (indicadores y catálogo) y *Análisis* (gráficas). Detalles
  técnicos en la ficha de cada objeto.
- **Análisis de riesgos**: pestañas *Resumen* y *Metodología y ranking completo*; acceso a los 3 primeros en el mapa.
- **Explicaciones**: glosario común (`GLOSSARY` en `components/labels.jsx`) para NEO, PHA, LD, UA, NORAD, LEO/MEO/GEO/HEO,
  apogeo, perigeo, inclinación, H, RCS y TLE, usado en tooltips del mapa, el dashboard y las tablas.
- **Distancias**: `formatApproach` muestra decimales suficientes (antes un NEO a 0,017 LD aparecía como "0,0 LD").

## 4. Accesibilidad

- Botón **Accesibilidad** visible en la barra superior y sección en *Configuración* (mismos controles).
- **Tamaño del texto**: normal (100 %), grande (112,5 %) y muy grande (125 %), con botones A−/A+. Se migraron todas las
  clases `text-[Npx]` a `rem` y se subió el mínimo de 7,5–10 px a 11 px; los textos de cuerpo pasan de 12–13 px a 13–14 px.
- **Contraste**: paleta en variables CSS; los textos secundarios pasan de 4,6:1 a 7,2:1 sobre los paneles en la paleta estándar y hay un modo de **alto
  contraste** (fondo negro, textos casi blancos, bordes visibles, foco amarillo de 3 px).
- **Estados**: foco visible global, selección con barra lateral en filas y menú, `aria-pressed`/`aria-selected`/`aria-current`,
  deshabilitados con opacidad y saturación reducidas.
- **Teclado**: enlace "Saltar al contenido principal", pestañas y grupos de opciones con flechas, `Escape` cierra el panel
  de accesibilidad, el menú móvil y las fichas.
- **Movimiento reducido**: respeta `prefers-reduced-motion` o la elección manual; el globo no gira solo, las transiciones de
  cámara son instantáneas y se desactiva el destello animado de la órbita.
- **Diseño adaptable**: el mapa decide su distribución por el ancho real y el tamaño de texto (panel a la izquierda o debajo;
  ficha sobre el mapa, contraída o debajo).

## 5. Archivos

Nuevos:

- `src/context/AccessibilityContext.jsx`: preferencias, aplicación en `<html>` y `MotionConfig`.
- `src/components/AccessibilityControls.jsx`: controles y menú de la barra superior.
- `src/components/globe/layers.js`: capas por defecto y reglas de visibilidad compartidas por el globo y la leyenda.
- `src/features/map/useMapSelection.js`, `mapModel.js`, `ObjectBrowser.jsx`, `MapObjectCard.jsx`.
- `src/hooks/useElementSize.js`.

Modificados: `index.html`, `tailwind.config.js`, `src/index.css`, `src/main.jsx`, `GlobeView.jsx`, `Explorer.jsx`,
`Dashboard.jsx`, `Neos.jsx`, `Satcat.jsx`, `Risks.jsx`, `Configuracion.jsx`, `Simulacion.jsx`, `Layout.jsx`, `TopBar.jsx`,
`Sidebar.jsx`, `GlobalSearch.jsx`, `primitives.jsx` (Button con ref, `Tabs`, `TabPanel`, `Term`, InfoTip), `common.jsx`,
`labels.jsx` (categorías y glosario), `NeoDetailPanel.jsx`, `SatelliteDetailPanel.jsx`, `BarChartCard.jsx`, `useQuery.js`
(`fetchCached`), `queries.js`, `format.js`, `constants.js` y, solo por la migración de tamaños de texto, el resto de
pantallas y gráficas.

Sin dependencias nuevas.

## 6. Pruebas (20 nov 2026, Linux, Node 22, Chrome headless con WebGL por software)

| Prueba | Resultado |
|---|---|
| `vite build` | OK (sin errores) |
| `pytest backend/tests` | 34/34 |
| `backend/scripts/smoke_api.py` | 24/24 |
| Mapa 3D: vista limpia, selección NEO y satélite, filtros GEO y nivel A, búsqueda, trayectorias, ficha técnica, teclado, limpiar, `?id=` | 17/17 |
| Accesibilidad: 3 tamaños, A−/A+, alto contraste, movimiento, Escape, persistencia, pestañas con teclado, Configuración, foco visible | 17/17 |
| 15 rutas × 4 tamaños (390, 768, 1280, 1920 px) × texto normal y muy grande con alto contraste | Sin desbordamiento horizontal ni errores de consola |

Aviso esperado (no es error): en desarrollo, con movimiento reducido, framer-motion escribe un `console.warn`
"You have Reduced Motion enabled…". En la compilación de producción no aparece.

## 7. Limitaciones y datos que harían falta

- **Trayectorias y posiciones reales de satélites**: requieren TLE/OMM (por ejemplo, CelesTrak GP) y propagación SGP4.
- **Trayectorias, fechas y probabilidad de impacto de NEO**: requieren fecha de cada aproximación y elementos orbitales con
  incertidumbre (NASA JPL SBDB / CAD y Sentry). Con eso se podría dibujar la trayectoria hiperbólica real del sobrevuelo.
- **Riesgo de colisión entre objetos artificiales**: requiere análisis de conjunciones (CDM / SOCRATES).
- El alto contraste no recolorea las gráficas de Recharts ni el globo (usan colores fijos validados), solo sus textos.
- Vite sigue avisando que el paquete del globo pesa ~1,9 MB (three.js); ya se carga aparte y solo en pantallas con globo.
- En el entorno de prueba, el modelo `random_forest.joblib` (entrenado con otra versión de scikit-learn) devolvió una
  probabilidad mayor que 1. La barra de Simulación ahora se limita a 0–100 %; si ocurre en tu PC, vuelve a entrenar con
  `python -m backend.train`.
