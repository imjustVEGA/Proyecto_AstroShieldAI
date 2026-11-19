"""Etiquetas legibles para los códigos de SATCAT (según la documentación de CelesTrak)."""

OBJECT_TYPE_LABELS = {
    "PAY": "Carga útil (satélite)",
    "R/B": "Cuerpo de cohete",
    "DEB": "Fragmento / basura espacial",
    "UNK": "Desconocido",
}

OPS_STATUS_LABELS = {
    "+": "Operativo",
    "-": "No operativo",
    "P": "Parcialmente operativo",
    "B": "Respaldo",
    "S": "Reserva",
    "X": "Misión extendida",
    "D": "Reingresado",
    "?": "Desconocido",
    None: "Sin dato",
}

ORBIT_TYPE_LABELS = {
    "ORB": "En órbita",
    "LAN": "Aterrizaje",
    "IMP": "Impacto / reingreso",
    "DOC": "Acoplado a otro objeto",
    "R/T": "Ida y vuelta",
}

DATA_STATUS_LABELS = {
    "NCE": "Sin elementos actuales",
    "NIE": "Sin elementos iniciales",
    "NEA": "Sin elementos disponibles",
}

ORBIT_CENTER_LABELS = {
    "EA": "Tierra", "MO": "Luna", "SU": "Sol", "MA": "Marte", "VE": "Venus", "ME": "Mercurio",
    "JU": "Júpiter", "SA": "Saturno", "UR": "Urano", "NE": "Neptuno", "PL": "Plutón",
    "EM": "Baricentro Tierra-Luna", "AS": "Asteroide", "CO": "Cometa", "SS": "Escape del sistema solar",
    "EL1": "Punto de Lagrange L1", "EL2": "Punto de Lagrange L2",
}


def label(mapping: dict, code: str | None) -> str:
    return mapping.get(code, code or "Sin dato")
