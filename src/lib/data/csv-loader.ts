import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "csv-parse/sync";

import type { LocationRecord, RentBenchmarkRecord } from "@/lib/types";

const LOCATIONS_PATH = path.join(process.cwd(), "data", "processed", "locations.csv");
const BENCHMARKS_PATH = path.join(process.cwd(), "data", "processed", "rent_benchmarks.csv");

let locationsPromise: Promise<LocationRecord[]> | null = null;
let benchmarksPromise: Promise<RentBenchmarkRecord[]> | null = null;

function emptyToNull(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseNumber(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function parseCsv(content: string): Record<string, string>[] {
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];
}

async function readCsvFile(filePath: string): Promise<Record<string, string>[]> {
  const content = await readFile(filePath, "utf-8");
  return parseCsv(content);
}

async function loadLocationsInternal(): Promise<LocationRecord[]> {
  const records = await readCsvFile(LOCATIONS_PATH);

  return records.map((record) => ({
    inseeCode: record.insee_code,
    communeName: record.commune_name,
    departmentCode: emptyToNull(record.department_code),
    regionCode: emptyToNull(record.region_code),
    displayName: record.display_name,
    isArrondissement: parseBoolean(record.is_arrondissement),
  }));
}

async function loadBenchmarksInternal(): Promise<RentBenchmarkRecord[]> {
  const records = await readCsvFile(BENCHMARKS_PATH);

  return records.map((record) => ({
    sourceDataset: record.source_dataset,
    sourceType: record.source_type,
    sourceYear: Number(record.source_year),
    segment: record.segment as RentBenchmarkRecord["segment"],
    referenceSurfaceM2: Number(record.reference_surface_m2),
    locationKey: record.location_key,
    locationLabel: record.location_label,
    departmentCode: emptyToNull(record.department_code),
    regionCode: emptyToNull(record.region_code),
    zoneId: emptyToNull(record.zone_id),
    benchmarkRentPerM2: Number(record.benchmark_rent_per_m2),
    predictionIntervalLower: parseNumber(record.prediction_interval_lower),
    predictionIntervalUpper: parseNumber(record.prediction_interval_upper),
    predictionLevel: emptyToNull(record.prediction_level),
    nbObservationsCommune: parseNumber(record.nb_observations_commune),
    nbObservationsZone: parseNumber(record.nb_observations_zone),
    r2Adj: parseNumber(record.r2_adj),
    confidenceBase: emptyToNull(record.confidence_base),
    isActive: parseBoolean(record.is_active),
  }));
}

export async function loadLocations(): Promise<LocationRecord[]> {
  if (!locationsPromise) {
    locationsPromise = loadLocationsInternal();
  }

  return locationsPromise;
}

export async function loadBenchmarks(): Promise<RentBenchmarkRecord[]> {
  if (!benchmarksPromise) {
    benchmarksPromise = loadBenchmarksInternal();
  }

  return benchmarksPromise;
}
