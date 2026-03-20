import type {
  DatasetSummary,
  FormSegment,
  LocationRecord,
  RentBenchmarkRecord,
  SearchLocationResult,
} from "@/lib/types";

export interface RentDataRepository {
  searchLocations(query: string, limit?: number): Promise<SearchLocationResult[]>;
  getLocationByInseeCode(inseeCode: string): Promise<LocationRecord | null>;
  getBenchmark(locationKey: string, segment: FormSegment): Promise<RentBenchmarkRecord | null>;
  getDatasetSummary(): Promise<DatasetSummary>;
}
