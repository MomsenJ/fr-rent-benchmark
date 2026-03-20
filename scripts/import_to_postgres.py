#!/usr/bin/env python3
"""Import processed rent benchmark CSVs into PostgreSQL using COPY."""

from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path

import psycopg


BASE_DIR = Path(__file__).resolve().parents[1]
PROCESSED_DIR = BASE_DIR / "data" / "processed"
LOCATIONS_CSV = PROCESSED_DIR / "locations.csv"
BENCHMARKS_CSV = PROCESSED_DIR / "rent_benchmarks.csv"


@dataclass
class ImportStats:
    staging_rows: int
    upserted_rows: int
    table_total_rows: int


def require_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required")
    return database_url


def copy_csv(cursor: psycopg.Cursor, csv_path: Path, copy_sql: str) -> None:
    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        with cursor.copy(copy_sql) as copy:
            while chunk := handle.read(1024 * 1024):
                copy.write(chunk)


def get_table_count(cursor: psycopg.Cursor, table_name: str) -> int:
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    return int(cursor.fetchone()[0])


def get_staging_count(cursor: psycopg.Cursor, table_name: str) -> int:
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = int(cursor.fetchone()[0])
    if count == 0:
        raise RuntimeError(f"{table_name} is empty after COPY; processed CSV may be empty.")
    return count


def import_locations(cursor: psycopg.Cursor) -> ImportStats:
    cursor.execute(
        """
        CREATE TEMP TABLE staging_locations (
            insee_code TEXT,
            commune_name TEXT,
            department_code TEXT,
            region_code TEXT,
            display_name TEXT,
            is_arrondissement BOOLEAN
        ) ON COMMIT DROP
        """
    )
    copy_csv(
        cursor,
        LOCATIONS_CSV,
        """
        COPY staging_locations (
            insee_code,
            commune_name,
            department_code,
            region_code,
            display_name,
            is_arrondissement
        )
        FROM STDIN WITH (FORMAT CSV, HEADER TRUE)
        """,
    )
    staging_rows = get_staging_count(cursor, "staging_locations")
    cursor.execute(
        """
        INSERT INTO locations (
            insee_code,
            commune_name,
            department_code,
            region_code,
            display_name,
            is_arrondissement
        )
        SELECT
            insee_code,
            commune_name,
            department_code,
            region_code,
            display_name,
            is_arrondissement
        FROM staging_locations
        ON CONFLICT (insee_code) DO UPDATE
        SET
            commune_name = EXCLUDED.commune_name,
            department_code = EXCLUDED.department_code,
            region_code = EXCLUDED.region_code,
            display_name = EXCLUDED.display_name,
            is_arrondissement = EXCLUDED.is_arrondissement,
            updated_at = NOW()
        """
    )
    upserted_rows = cursor.rowcount
    table_total_rows = get_table_count(cursor, "locations")
    return ImportStats(
        staging_rows=staging_rows,
        upserted_rows=upserted_rows,
        table_total_rows=table_total_rows,
    )


def import_rent_benchmarks(cursor: psycopg.Cursor) -> ImportStats:
    cursor.execute(
        """
        CREATE TEMP TABLE staging_rent_benchmarks (
            source_dataset TEXT,
            source_type TEXT,
            source_year INT,
            segment TEXT,
            reference_surface_m2 NUMERIC,
            location_key TEXT,
            location_label TEXT,
            department_code TEXT,
            region_code TEXT,
            zone_id TEXT,
            benchmark_rent_per_m2 NUMERIC,
            prediction_interval_lower NUMERIC,
            prediction_interval_upper NUMERIC,
            prediction_level TEXT,
            nb_observations_commune INT,
            nb_observations_zone INT,
            r2_adj NUMERIC,
            confidence_base TEXT,
            is_active BOOLEAN
        ) ON COMMIT DROP
        """
    )
    copy_csv(
        cursor,
        BENCHMARKS_CSV,
        """
        COPY staging_rent_benchmarks (
            source_dataset,
            source_type,
            source_year,
            segment,
            reference_surface_m2,
            location_key,
            location_label,
            department_code,
            region_code,
            zone_id,
            benchmark_rent_per_m2,
            prediction_interval_lower,
            prediction_interval_upper,
            prediction_level,
            nb_observations_commune,
            nb_observations_zone,
            r2_adj,
            confidence_base,
            is_active
        )
        FROM STDIN WITH (FORMAT CSV, HEADER TRUE)
        """,
    )
    staging_rows = get_staging_count(cursor, "staging_rent_benchmarks")
    cursor.execute(
        """
        INSERT INTO rent_benchmarks (
            source_dataset,
            source_type,
            source_year,
            segment,
            reference_surface_m2,
            location_key,
            location_label,
            department_code,
            region_code,
            zone_id,
            benchmark_rent_per_m2,
            prediction_interval_lower,
            prediction_interval_upper,
            prediction_level,
            nb_observations_commune,
            nb_observations_zone,
            r2_adj,
            confidence_base,
            is_active
        )
        SELECT
            source.source_dataset,
            source.source_type,
            source.source_year,
            source.segment,
            source.reference_surface_m2,
            source.location_key,
            source.location_label,
            source.department_code,
            source.region_code,
            source.zone_id,
            source.benchmark_rent_per_m2,
            source.prediction_interval_lower,
            source.prediction_interval_upper,
            source.prediction_level,
            source.nb_observations_commune,
            source.nb_observations_zone,
            source.r2_adj,
            source.confidence_base,
            source.is_active
        FROM staging_rent_benchmarks AS source
        ON CONFLICT (source_dataset, location_key) DO UPDATE
        SET
            source_type = EXCLUDED.source_type,
            source_year = EXCLUDED.source_year,
            segment = EXCLUDED.segment,
            reference_surface_m2 = EXCLUDED.reference_surface_m2,
            location_label = EXCLUDED.location_label,
            department_code = EXCLUDED.department_code,
            region_code = EXCLUDED.region_code,
            zone_id = EXCLUDED.zone_id,
            benchmark_rent_per_m2 = EXCLUDED.benchmark_rent_per_m2,
            prediction_interval_lower = EXCLUDED.prediction_interval_lower,
            prediction_interval_upper = EXCLUDED.prediction_interval_upper,
            prediction_level = EXCLUDED.prediction_level,
            nb_observations_commune = EXCLUDED.nb_observations_commune,
            nb_observations_zone = EXCLUDED.nb_observations_zone,
            r2_adj = EXCLUDED.r2_adj,
            confidence_base = EXCLUDED.confidence_base,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
        """
    )
    upserted_rows = cursor.rowcount
    table_total_rows = get_table_count(cursor, "rent_benchmarks")
    return ImportStats(
        staging_rows=staging_rows,
        upserted_rows=upserted_rows,
        table_total_rows=table_total_rows,
    )


def main() -> None:
    if not LOCATIONS_CSV.exists() or not BENCHMARKS_CSV.exists():
        raise FileNotFoundError("Processed CSVs not found. Run scripts/clean_rent_benchmarks.py first.")

    with psycopg.connect(require_database_url()) as connection:
        with connection.cursor() as cursor:
            location_stats = import_locations(cursor)
            benchmark_stats = import_rent_benchmarks(cursor)
        connection.commit()

    print("Import summary")
    print("==============")
    print(
        "locations: "
        f"staging_rows={location_stats.staging_rows}, "
        f"upserted_rows={location_stats.upserted_rows}, "
        f"table_total_rows={location_stats.table_total_rows}"
    )
    print(
        "rent_benchmarks: "
        f"staging_rows={benchmark_stats.staging_rows}, "
        f"upserted_rows={benchmark_stats.upserted_rows}, "
        f"table_total_rows={benchmark_stats.table_total_rows}"
    )
    print(f"Source CSVs: {LOCATIONS_CSV} | {BENCHMARKS_CSV}")


if __name__ == "__main__":
    main()
