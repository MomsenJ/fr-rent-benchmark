#!/usr/bin/env python3
"""Clean and normalize French rent benchmark CSVs for the MVP schema."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

EXPECTED_COLUMNS = [
    "id_zone",
    "INSEE_C",
    "LIBGEO",
    "EPCI",
    "DEP",
    "REG",
    "loypredm2",
    "lwr.IPm2",
    "upr.IPm2",
    "TYPPRED",
    "nbobs_com",
    "nbobs_mail",
    "R2_adj",
]

TEXT_COLUMNS = ["id_zone", "INSEE_C", "LIBGEO", "EPCI", "DEP", "REG", "TYPPRED"]
DECIMAL_COLUMNS = ["loypredm2", "lwr.IPm2", "upr.IPm2", "R2_adj"]
INTEGER_COLUMNS = ["nbobs_com", "nbobs_mail"]
REQUIRED_COLUMNS = ["INSEE_C", "LIBGEO", "loypredm2"]

LOCATIONS_OUTPUT_COLUMNS = [
    "insee_code",
    "commune_name",
    "department_code",
    "region_code",
    "display_name",
    "is_arrondissement",
]

RENT_BENCHMARKS_OUTPUT_COLUMNS = [
    "source_dataset",
    "source_type",
    "source_year",
    "segment",
    "reference_surface_m2",
    "location_key",
    "location_label",
    "department_code",
    "region_code",
    "zone_id",
    "benchmark_rent_per_m2",
    "prediction_interval_lower",
    "prediction_interval_upper",
    "prediction_level",
    "nb_observations_commune",
    "nb_observations_zone",
    "r2_adj",
    "confidence_base",
    "is_active",
]

DATASET_CONFIGS = [
    {
        "file_name": "pred-app12-mef-dhup.csv",
        "source_dataset": "pred_app12_2025",
        "source_type": "listing_prediction",
        "source_year": 2025,
        "segment": "apartment_1_2p",
        "reference_surface_m2": 37,
    },
    {
        "file_name": "pred-app3-mef-dhup.csv",
        "source_dataset": "pred_app3_2025",
        "source_type": "listing_prediction",
        "source_year": 2025,
        "segment": "apartment_3p_plus",
        "reference_surface_m2": 72,
    },
    {
        "file_name": "pred-app-mef-dhup.csv",
        "source_dataset": "pred_app_all_2025",
        "source_type": "listing_prediction",
        "source_year": 2025,
        "segment": "apartment_all",
        "reference_surface_m2": 52,
    },
]


@dataclass
class DatasetSummary:
    file_name: str
    encoding_used: str
    rows_read: int
    rows_kept: int
    rows_dropped_missing: int
    duplicates_found: int


def detect_encoding(path: Path, encodings: Iterable[str] = ("utf-8-sig", "utf-8", "latin-1")) -> str:
    for encoding in encodings:
        try:
            with path.open("r", encoding=encoding, newline="") as handle:
                handle.read(8192)
            return encoding
        except UnicodeDecodeError:
            continue
    raise UnicodeDecodeError("unknown", b"", 0, 1, f"Could not decode {path}")


def read_raw_csv(path: Path) -> tuple[pd.DataFrame, str]:
    encoding = detect_encoding(path)
    frame = pd.read_csv(
        path,
        sep=";",
        dtype=str,
        keep_default_na=False,
        encoding=encoding,
    )
    missing_columns = [column for column in EXPECTED_COLUMNS if column not in frame.columns]
    if missing_columns:
        raise ValueError(f"{path.name} is missing expected columns: {missing_columns}")
    return frame[EXPECTED_COLUMNS].copy(), encoding


def trim_text_columns(frame: pd.DataFrame) -> pd.DataFrame:
    for column in frame.columns:
        frame[column] = frame[column].map(lambda value: value.strip() if isinstance(value, str) else value)
    return frame


def empty_string_to_null(series: pd.Series) -> pd.Series:
    return series.replace("", pd.NA)


def parse_decimal_series(series: pd.Series) -> pd.Series:
    normalized = empty_string_to_null(series).str.replace(",", ".", regex=False)
    return pd.to_numeric(normalized, errors="coerce")


def parse_integer_series(series: pd.Series) -> pd.Series:
    normalized = empty_string_to_null(series)
    return pd.to_numeric(normalized, errors="coerce").astype("Int64")


def normalize_prediction_level(value: object) -> object:
    if pd.isna(value):
        return pd.NA
    lowered = str(value).strip().lower()
    mapping = {
        "commune": "commune",
        "epci": "epci",
        "maille": "maille",
        "maile": "maille",
    }
    return mapping.get(lowered, lowered)


def normalize_insee_code(value: object) -> str:
    if pd.isna(value):
        return ""
    code = str(value).strip().upper()
    if code.isdigit() and len(code) < 5:
        code = code.zfill(5)
    return code


ARRONDISSEMENT_INSEE_CODES = {
    *(f"{code:05d}" for code in range(75101, 75121)),
    *(f"{code:05d}" for code in range(13201, 13217)),
    *(f"{code:05d}" for code in range(69381, 69390)),
}


def is_arrondissement_insee_code(value: object) -> bool:
    return normalize_insee_code(value) in ARRONDISSEMENT_INSEE_CODES


def add_confidence_base(frame: pd.DataFrame) -> pd.DataFrame:
    interval_width_ratio = pd.Series(float("inf"), index=frame.index, dtype="float64")
    valid_ratio_mask = (
        frame["benchmark_rent_per_m2"].notna()
        & frame["prediction_interval_lower"].notna()
        & frame["prediction_interval_upper"].notna()
        & (frame["benchmark_rent_per_m2"] > 0)
    )
    interval_width_ratio.loc[valid_ratio_mask] = (
        (frame.loc[valid_ratio_mask, "prediction_interval_upper"] - frame.loc[valid_ratio_mask, "prediction_interval_lower"])
        / frame.loc[valid_ratio_mask, "benchmark_rent_per_m2"]
    )

    high_mask = (
        (frame["prediction_level"] == "commune")
        & (frame["r2_adj"] >= 0.7)
        & (frame["nb_observations_commune"] >= 100)
        & (interval_width_ratio <= 0.30)
    ).fillna(False)

    medium_mask = (
        (frame["r2_adj"] >= 0.5)
        & (frame["nb_observations_commune"] >= 30)
    ).fillna(False)

    frame["confidence_base"] = "low"
    frame.loc[medium_mask, "confidence_base"] = "medium"
    frame.loc[high_mask, "confidence_base"] = "high"
    return frame


def find_location_label_conflicts(frame: pd.DataFrame) -> list[str]:
    distinct_labels = (
        frame[["location_key", "location_label"]]
        .dropna(subset=["location_key", "location_label"])
        .drop_duplicates()
        .groupby("location_key")["location_label"]
        .agg(lambda values: sorted(values))
    )
    conflicts = distinct_labels[distinct_labels.map(len) > 1]
    warnings: list[str] = []
    for location_key, labels in conflicts.items():
        warnings.append(f"location_key {location_key} has multiple labels: {', '.join(labels)}")
    return warnings


def build_locations(frame: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    warnings = find_location_label_conflicts(frame)
    locations = frame[
        ["location_key", "location_label", "department_code", "region_code"]
    ].drop_duplicates(subset=["location_key"], keep="first")
    locations = locations.rename(
        columns={
            "location_key": "insee_code",
            "location_label": "commune_name",
        }
    )
    locations["display_name"] = locations.apply(
        lambda row: f"{row['commune_name']} ({row['department_code']})"
        if pd.notna(row["department_code"])
        else row["commune_name"],
        axis=1,
    )
    locations["is_arrondissement"] = locations["insee_code"].map(is_arrondissement_insee_code)
    locations["insee_code"] = locations["insee_code"].map(normalize_insee_code)
    output = locations[LOCATIONS_OUTPUT_COLUMNS].sort_values(["commune_name", "insee_code"]).reset_index(drop=True)
    return output, warnings


def normalize_dataset(config: dict[str, object]) -> tuple[pd.DataFrame, DatasetSummary]:
    path = RAW_DIR / str(config["file_name"])
    raw_frame, encoding_used = read_raw_csv(path)
    frame = trim_text_columns(raw_frame)

    for column in TEXT_COLUMNS:
        frame[column] = empty_string_to_null(frame[column])

    for column in DECIMAL_COLUMNS:
        frame[column] = parse_decimal_series(frame[column])

    for column in INTEGER_COLUMNS:
        frame[column] = parse_integer_series(frame[column])

    frame["TYPPRED"] = frame["TYPPRED"].map(normalize_prediction_level)

    required_mask = frame["INSEE_C"].notna() & frame["LIBGEO"].notna() & frame["loypredm2"].notna()
    dropped_rows_missing = int((~required_mask).sum())
    frame = frame.loc[required_mask].copy()

    frame = frame.rename(
        columns={
            "INSEE_C": "location_key",
            "LIBGEO": "location_label",
            "DEP": "department_code",
            "REG": "region_code",
            "id_zone": "zone_id",
            "loypredm2": "benchmark_rent_per_m2",
            "lwr.IPm2": "prediction_interval_lower",
            "upr.IPm2": "prediction_interval_upper",
            "TYPPRED": "prediction_level",
            "nbobs_com": "nb_observations_commune",
            "nbobs_mail": "nb_observations_zone",
            "R2_adj": "r2_adj",
        }
    )

    frame["source_dataset"] = config["source_dataset"]
    frame["source_type"] = config["source_type"]
    frame["source_year"] = int(config["source_year"])
    frame["segment"] = config["segment"]
    frame["reference_surface_m2"] = config["reference_surface_m2"]
    frame["is_active"] = True

    duplicates_found = int(frame.duplicated(subset=["source_dataset", "location_key"], keep="first").sum())
    frame = frame.drop_duplicates(subset=["source_dataset", "location_key"], keep="first").copy()

    frame = add_confidence_base(frame)
    frame["zone_id"] = frame["zone_id"].astype("string")

    output = frame[RENT_BENCHMARKS_OUTPUT_COLUMNS].copy()
    summary = DatasetSummary(
        file_name=str(config["file_name"]),
        encoding_used=encoding_used,
        rows_read=len(raw_frame),
        rows_kept=len(output),
        rows_dropped_missing=dropped_rows_missing,
        duplicates_found=duplicates_found,
    )
    return output, summary


def write_csv(frame: pd.DataFrame, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(path, index=False, encoding="utf-8", na_rep="")


def print_summary(
    summaries: list[DatasetSummary],
    locations: pd.DataFrame,
    benchmarks: pd.DataFrame,
    location_warnings: list[str],
) -> None:
    print("Validation summary")
    print("==================")
    for summary in summaries:
        rows_dropped_total = summary.rows_dropped_missing + summary.duplicates_found
        print(
            f"{summary.file_name}: "
            f"read={summary.rows_read}, kept={summary.rows_kept}, "
            f"dropped_missing={summary.rows_dropped_missing}, "
            f"deduplicated={summary.duplicates_found}, "
            f"dropped_total={rows_dropped_total}, encoding={summary.encoding_used}"
        )
    if location_warnings:
        print(f"Location label conflicts: {len(location_warnings)}")
        for warning in location_warnings[:10]:
            print(f"  warning: {warning}")
        if len(location_warnings) > 10:
            print(f"  ... {len(location_warnings) - 10} more")
    else:
        print("Location label conflicts: 0")
    print(f"Distinct locations: {len(locations)}")
    print(f"Distinct benchmark rows: {len(benchmarks)}")
    confidence_counts = benchmarks["confidence_base"].value_counts(dropna=False).sort_index()
    print("Confidence distribution:")
    for label, count in confidence_counts.items():
        print(f"  {label}: {count}")


def main() -> None:
    benchmark_frames: list[pd.DataFrame] = []
    summaries: list[DatasetSummary] = []

    for config in DATASET_CONFIGS:
        frame, summary = normalize_dataset(config)
        benchmark_frames.append(frame)
        summaries.append(summary)

    rent_benchmarks = pd.concat(benchmark_frames, ignore_index=True)
    rent_benchmarks = rent_benchmarks.sort_values(
        ["segment", "location_key", "source_dataset"]
    ).reset_index(drop=True)
    locations, location_warnings = build_locations(rent_benchmarks)

    write_csv(locations, PROCESSED_DIR / "locations.csv")
    write_csv(rent_benchmarks, PROCESSED_DIR / "rent_benchmarks.csv")
    print_summary(summaries, locations, rent_benchmarks, location_warnings)


if __name__ == "__main__":
    main()
