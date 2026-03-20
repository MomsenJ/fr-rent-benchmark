import "server-only";

import { loadBenchmarks, loadLocations } from "@/lib/data/csv-loader";
import type { RentDataRepository } from "@/lib/repositories/rent-data-repository";
import type {
  DatasetSummary,
  FormSegment,
  LocationRecord,
  RentBenchmarkRecord,
  SearchLocationResult,
} from "@/lib/types";

const PROPERTY_SEGMENTS: FormSegment[] = ["apartment_1_2p", "apartment_3p_plus"];

interface BenchmarkIndex {
  byLocationAndSegment: Map<string, RentBenchmarkRecord>;
  summary: DatasetSummary;
}

let benchmarkIndexPromise: Promise<BenchmarkIndex> | null = null;

function normalizeSearchValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function toSearchLocationResult(location: LocationRecord): SearchLocationResult {
  return {
    inseeCode: location.inseeCode,
    displayName: location.displayName,
    communeName: location.communeName,
    departmentCode: location.departmentCode,
    isArrondissement: location.isArrondissement,
  };
}

async function getBenchmarkIndex(): Promise<BenchmarkIndex> {
  if (!benchmarkIndexPromise) {
    benchmarkIndexPromise = (async () => {
      const benchmarks = await loadBenchmarks();
      const map = new Map<string, RentBenchmarkRecord>();

      for (const benchmark of benchmarks) {
        map.set(`${benchmark.locationKey}:${benchmark.segment}`, benchmark);
      }

      return {
        byLocationAndSegment: map,
        summary: {
          locationCount: (await loadLocations()).length,
          benchmarkCount: benchmarks.length,
          propertySegments: PROPERTY_SEGMENTS,
        },
      };
    })();
  }

  return benchmarkIndexPromise;
}

export const csvRentDataRepository: RentDataRepository = {
  async searchLocations(query: string, limit = 8): Promise<SearchLocationResult[]> {
    const normalizedQuery = normalizeSearchValue(query);
    if (normalizedQuery.length < 2) {
      return [];
    }

    const locations = await loadLocations();
    const matches = locations
      .map((location) => {
        const displayName = normalizeSearchValue(location.displayName);
        const communeName = normalizeSearchValue(location.communeName);
        const departmentCode = normalizeSearchValue(location.departmentCode ?? "");

        let score = Number.POSITIVE_INFINITY;
        if (location.inseeCode.startsWith(normalizedQuery)) {
          score = 0;
        } else if (displayName.startsWith(normalizedQuery)) {
          score = 1;
        } else if (communeName.startsWith(normalizedQuery)) {
          score = 2;
        } else if (displayName.includes(normalizedQuery)) {
          score = 3;
        } else if (communeName.includes(normalizedQuery)) {
          score = 4;
        } else if (departmentCode === normalizedQuery) {
          score = 5;
        }

        return { location, score };
      })
      .filter((entry) => Number.isFinite(entry.score))
      .sort((left, right) => {
        if (left.score !== right.score) {
          return left.score - right.score;
        }

        return left.location.displayName.localeCompare(right.location.displayName, "fr");
      })
      .slice(0, limit)
      .map((entry) => toSearchLocationResult(entry.location));

    return matches;
  },

  async getLocationByInseeCode(inseeCode: string): Promise<LocationRecord | null> {
    const locations = await loadLocations();
    return locations.find((location) => location.inseeCode === inseeCode) ?? null;
  },

  async getBenchmark(locationKey: string, segment: FormSegment): Promise<RentBenchmarkRecord | null> {
    const index = await getBenchmarkIndex();
    return index.byLocationAndSegment.get(`${locationKey}:${segment}`) ?? null;
  },

  async getDatasetSummary(): Promise<DatasetSummary> {
    const index = await getBenchmarkIndex();
    return index.summary;
  },
};
