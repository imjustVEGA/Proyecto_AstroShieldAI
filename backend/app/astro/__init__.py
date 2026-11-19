"""Núcleo de datos de AstroShield (portado desde la carpeta Astroshield AI).

En Astroshield AI estos módulos trabajaban sobre PostgreSQL + PostGIS. Aquí se
conservan las mismas reglas de limpieza, clasificación orbital y priorización,
pero se ejecutan con pandas en memoria para que el proyecto siga funcionando
con el backend ligero de FER (FastAPI + SQLite solo para usuarios).
"""
