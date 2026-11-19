"""Registro de incidencias de calidad durante la limpieza de datos.

Versión en memoria del registro de Astroshield AI: cuenta todas las incidencias
por código y severidad, y guarda una muestra acotada para mostrarla en la
interfaz sin recorrer fila por fila los ~160 mil registros.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import asdict, dataclass, field
from typing import Literal

import pandas as pd

Severity = Literal["error", "warning", "info"]
SAMPLE_PER_CODE = 25


class SchemaError(ValueError):
    """El archivo no tiene las columnas esperadas."""


@dataclass(frozen=True)
class Issue:
    row_number: int | None  # fila del CSV original (1 = primera fila de datos)
    record_key: str | None
    field: str | None
    code: str
    severity: Severity
    raw_value: str | None
    message: str


@dataclass
class IssueCollector:
    samples: list[Issue] = field(default_factory=list)
    by_code: Counter = field(default_factory=Counter)
    by_severity: Counter = field(default_factory=Counter)
    messages: dict[str, tuple[str, str]] = field(default_factory=dict)

    def add_mask(
        self,
        frame: pd.DataFrame,
        mask: pd.Series,
        *,
        code: str,
        severity: Severity,
        message: str,
        field_name: str | None = None,
        key_column: str | None = None,
    ) -> int:
        """Registra una incidencia por cada fila donde `mask` es verdadero."""
        selected_mask = mask.fillna(False).astype(bool)
        count = int(selected_mask.sum())
        if not count:
            return 0
        self.by_code[code] += count
        self.by_severity[severity] += count
        self.messages[code] = (severity, message)
        for _, row in frame.loc[selected_mask].head(SAMPLE_PER_CODE).iterrows():
            raw = row.get(f"_raw_{field_name}") if field_name else None
            key = row.get(key_column) if key_column else None
            self.samples.append(
                Issue(
                    row_number=int(row["_row_number"]) if "_row_number" in row else None,
                    record_key=None if key is None or pd.isna(key) else str(key),
                    field=field_name,
                    code=code,
                    severity=severity,
                    raw_value=None if raw is None or pd.isna(raw) else str(raw),
                    message=message,
                )
            )
        return count

    def counts_by_code(self) -> dict[str, int]:
        return dict(self.by_code)

    def counts_by_severity(self) -> dict[str, int]:
        return dict(self.by_severity)

    def summary(self) -> list[dict[str, object]]:
        return [
            {"code": code, "severity": self.messages[code][0], "message": self.messages[code][1], "count": count}
            for code, count in self.by_code.most_common()
        ]

    def sample_dicts(self) -> list[dict[str, object]]:
        return [asdict(i) for i in self.samples]


def require_columns(frame: pd.DataFrame, expected: list[str], source: str) -> None:
    missing = [c for c in expected if c not in frame.columns]
    if missing:
        raise SchemaError(f"{source}: faltan columnas {missing}")


def blank_counts(raw: pd.DataFrame, columns: list[str]) -> dict[str, int]:
    """Cuenta celdas vacías del archivo original, por columna."""
    return {c: int((raw[c].astype(str).str.strip() == "").sum()) for c in columns}


def normalize_blanks(raw: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    """Recorta espacios y convierte cadenas vacías en NA sin alterar el original."""
    out = pd.DataFrame(index=raw.index)
    for c in columns:
        values = raw[c].astype(str).str.strip()
        out[c] = values.mask(values == "")
        out[f"_raw_{c}"] = raw[c]
    out["_row_number"] = range(1, len(raw) + 1)
    return out


def parse_float(frame: pd.DataFrame, column: str, issues: IssueCollector, key_column: str) -> pd.Series:
    parsed = pd.to_numeric(frame[column], errors="coerce").astype(float)
    invalid = frame[column].notna() & parsed.isna()
    issues.add_mask(
        frame, invalid, code="invalid_number", severity="warning",
        message=f"{column} no es numérico; se guarda como nulo", field_name=column, key_column=key_column,
    )
    return parsed


def parse_date(frame: pd.DataFrame, column: str, issues: IssueCollector, key_column: str) -> pd.Series:
    parsed = pd.to_datetime(frame[column], errors="coerce", format="%Y-%m-%d")
    invalid = frame[column].notna() & parsed.isna()
    issues.add_mask(
        frame, invalid, code="invalid_date", severity="warning",
        message=f"{column} no tiene formato AAAA-MM-DD; se guarda como nulo",
        field_name=column, key_column=key_column,
    )
    return parsed
