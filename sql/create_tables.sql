CREATE TABLE IF NOT EXISTS locations (
    id BIGSERIAL PRIMARY KEY,
    insee_code TEXT NOT NULL UNIQUE,
    commune_name TEXT NOT NULL,
    department_code TEXT,
    region_code TEXT,
    display_name TEXT NOT NULL,
    is_arrondissement BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rent_benchmarks (
    id BIGSERIAL PRIMARY KEY,
    source_dataset TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_year INT NOT NULL,
    segment TEXT NOT NULL,
    reference_surface_m2 NUMERIC NOT NULL,
    location_key TEXT NOT NULL,
    location_label TEXT NOT NULL,
    department_code TEXT,
    region_code TEXT,
    zone_id TEXT,
    benchmark_rent_per_m2 NUMERIC NOT NULL,
    prediction_interval_lower NUMERIC,
    prediction_interval_upper NUMERIC,
    prediction_level TEXT,
    nb_observations_commune INT,
    nb_observations_zone INT,
    r2_adj NUMERIC,
    confidence_base TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT rent_benchmarks_source_dataset_location_key_key
        UNIQUE (source_dataset, location_key),
    CONSTRAINT rent_benchmarks_location_key_fkey
        FOREIGN KEY (location_key) REFERENCES locations (insee_code),
    CONSTRAINT rent_benchmarks_confidence_base_check
        CHECK (confidence_base IS NULL OR confidence_base IN ('high', 'medium', 'low')),
    CONSTRAINT rent_benchmarks_prediction_level_check
        CHECK (
            prediction_level IS NULL
            OR prediction_level = BTRIM(LOWER(prediction_level))
        )
);

CREATE INDEX IF NOT EXISTS idx_locations_commune_name
    ON locations (commune_name);

CREATE INDEX IF NOT EXISTS idx_rent_benchmarks_location_key_segment
    ON rent_benchmarks (location_key, segment);

CREATE INDEX IF NOT EXISTS idx_rent_benchmarks_segment
    ON rent_benchmarks (segment);
