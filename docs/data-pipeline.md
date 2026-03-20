# Data Pipeline

This document explains how to regenerate the processed CSV files used by the app.

Current runtime note:

- the deployed web app currently reads `data/processed/locations.csv` and `data/processed/rent_benchmarks.csv` directly from disk
- if you only want to run or deploy the current app, these processed files are the only required runtime datasets
- project setup and deployment guidance live in [`README.md`](../README.md) and [`docs/deployment.md`](deployment.md)

## Raw inputs

Place the three source CSVs in `data/raw/` with these names:

- `pred-app12-mef-dhup.csv`
- `pred-app3-mef-dhup.csv`
- `pred-app-mef-dhup.csv`

The cleaner reads semicolon-delimited French CSVs, preserves accents, trims text fields, converts comma decimals to standard numeric values, and writes UTF-8 processed outputs.

## Run the cleaner

Install the Python dependencies you need:

```bash
python3 -m pip install pandas
```

Run the cleaning step from the project root:

```bash
python3 scripts/clean_rent_benchmarks.py
```

This writes:

- `data/processed/locations.csv`
- `data/processed/rent_benchmarks.csv`

The script also prints a validation summary with rows read, kept, rows dropped for missing required fields, deduplicated rows, total dropped rows, location label conflict warnings, distinct location count, distinct benchmark row count, and the `confidence_base` distribution.

## Create tables

Apply the schema before importing data:

```bash
psql "$DATABASE_URL" -f sql/create_tables.sql
```

## Import processed CSVs

Install the PostgreSQL driver if needed:

```bash
python3 -m pip install psycopg[binary]
```

Set your database connection string and run the importer:

```bash
export DATABASE_URL="postgresql://user:password@host:5432/dbname"
python3 scripts/import_to_postgres.py
```

The importer uses PostgreSQL `COPY ... FROM STDIN` into temporary staging tables, then upserts `locations` and updates-or-inserts `rent_benchmarks` so reruns do not create duplicate logical rows.

After each `COPY`, the importer checks that the staging table is not empty and raises an error if the processed CSV appears empty. On success it prints an import summary with staging row counts, rows affected by the upsert, and the final row totals in each target table.

## confidence_base

`confidence_base` is derived during cleaning:

- `high`: `prediction_level = commune`, `r2_adj >= 0.7`, `nb_observations_commune >= 100`, and the prediction interval width is at most 30% of the benchmark rent.
- `medium`: `r2_adj >= 0.5` and `nb_observations_commune >= 30`.
- `low`: every other case, including rows where the interval ratio cannot be computed safely.
