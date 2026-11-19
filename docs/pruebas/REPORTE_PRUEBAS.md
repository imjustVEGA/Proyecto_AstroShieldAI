# Reporte de pruebas · fusión Astroshield AI → FER

Fecha: 19 de noviembre de 2026. Se probó el estado final de la carpeta `FER VERSION MIERDA`.

## 1. Pruebas automáticas del backend (pytest) — 34/34 OK

`python -m pytest backend/tests`

- Limpieza SATCAT: normalización, NORAD inválido rechazado, duplicados idénticos vs. en conflicto,
  valores fuera de rango, objetos acoplados y reingresados, apogeo/perigeo invertidos, columnas faltantes.
- Limpieza NEO: un `id` = un asteroide con varias aproximaciones, agregados alineados, booleanos inválidos, filas idénticas.
- Clasificación orbital: periodo de la ISS ≈ 93 min, GEO ≈ 1 día sidéreo, reglas LEO/MEO/GEO/HEO.
- Priorización: niveles A/B/C según reglas, orden y razones, pesos que suman 1.
- Datos reales: 70 587 objetos SATCAT (0 rechazados, unidades coherentes con Kepler) y 27 423 NEO (90 836 aproximaciones).
- Capa de API: dashboard, búsqueda (ISS), filtros SATCAT, orden con nulos al final, 2 173 PHA, NEO 2469219 con
  43 aproximaciones, histogramas, capas orbitales, fuentes y comportamiento cuando falta un CSV (503 sin caerse).

## 2. Prueba de humo de la API en ejecución — 24/24 OK

`python backend/scripts/smoke_api.py` (Uvicorn encendido): health, login JWT, 401 sin token, 404/422,
todos los endpoints de datos, usuarios y `/predict` con el modelo entrenado.

## 3. Pruebas funcionales en navegador (Chrome) — 14/14 OK, 0 errores de consola

1. Login admin/admin123 redirige al dashboard
2. Dashboard: KPIs reales (98 010 objetos), globo 3D con capas y "En el radar"
3. Búsqueda global (Ctrl K)
4. Explorador: órbita esquemática de MOLNIYA 3-50 y SES-1 (GEO), capas activables
5. Objetos NEO: gráficas, filtro PHA (2 173 registros) y ficha con aproximaciones
6. SATCAT: búsqueda STARLINK, orden por lanzamiento, ficha y enlace al explorador
7. Análisis de riesgos: niveles A/B/C, metodología y ranking
8. Estadísticas: distribuciones, filtro por tipo y pestaña NEO
9. Simulación: órbita Molniya, carga de la ISS por NORAD, clasificador de IA con un NEO real
10. Reportes: exportación CSV del nivel A (522 filas + encabezado)
11. Fuentes de datos: estado de carga, SHA-256 e incidencias
12. Usuarios (admin)
13. Vista móvil con menú lateral
14. Cerrar sesión

## Limitaciones de este entorno de prueba

- Se probó con Python 3.13 / pandas 3.0 / scikit-learn 1.9 y con una compilación equivalente a Vite (esbuild + Tailwind);
  tu entorno usa pandas 2.1 y Vite 5, que no se pudieron ejecutar aquí.
- Docker no está disponible en este entorno: los Dockerfile y `docker-compose.yml` no se construyeron.
