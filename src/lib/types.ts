export type Segment = "apartment_1_2p" | "apartment_3p_plus" | "apartment_all";
export type FormSegment = Exclude<Segment, "apartment_all">;
export type CategoryLabel = "low" | "fair" | "high" | "very high";

export interface LocationRecord {
  inseeCode: string;
  communeName: string;
  departmentCode: string | null;
  regionCode: string | null;
  displayName: string;
  isArrondissement: boolean;
}

export interface RentBenchmarkRecord {
  sourceDataset: string;
  sourceType: string;
  sourceYear: number;
  segment: Segment;
  referenceSurfaceM2: number;
  locationKey: string;
  locationLabel: string;
  departmentCode: string | null;
  regionCode: string | null;
  zoneId: string | null;
  benchmarkRentPerM2: number;
  predictionIntervalLower: number | null;
  predictionIntervalUpper: number | null;
  predictionLevel: string | null;
  nbObservationsCommune: number | null;
  nbObservationsZone: number | null;
  r2Adj: number | null;
  confidenceBase: string | null;
  isActive: boolean;
}

export interface DatasetSummary {
  locationCount: number;
  benchmarkCount: number;
  propertySegments: FormSegment[];
}

export interface SearchLocationResult {
  inseeCode: string;
  displayName: string;
  communeName: string;
  departmentCode: string | null;
  isArrondissement: boolean;
}

export interface RentCheckInput {
  locationKey: string;
  segment: FormSegment;
  surfaceArea: number;
  monthlyRent: number;
}

export interface RentCheckResult {
  commune: SearchLocationResult;
  segment: FormSegment;
  benchmarkRentPerM2: number;
  adjustedBenchmarkRentPerM2: number;
  expectedMonthlyRent: number;
  expectedMonthlyRentLower: number | null;
  expectedMonthlyRentUpper: number | null;
  monthlyRent: number;
  euroGap: number;
  percentageGap: number;
  categoryLabel: CategoryLabel;
  referenceSurfaceM2: number;
  confidenceBase: string | null;
  predictionLevel: string | null;
  sourceDataset: string;
  sourceYear: number;
}
