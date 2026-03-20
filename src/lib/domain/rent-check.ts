import type {
  CategoryLabel,
  RentBenchmarkRecord,
  RentCheckInput,
  RentCheckResult,
  SearchLocationResult,
} from "@/lib/types";

export function getSizeAdjustmentMultiplier(surfaceArea: number, referenceSurfaceM2: number): number {
  if (surfaceArea < 0.7 * referenceSurfaceM2) {
    return 1.08;
  }

  if (surfaceArea < 0.9 * referenceSurfaceM2) {
    return 1.04;
  }

  if (surfaceArea <= 1.1 * referenceSurfaceM2) {
    return 1;
  }

  if (surfaceArea <= 1.4 * referenceSurfaceM2) {
    return 0.95;
  }

  return 0.9;
}

export function getCategoryLabel(percentageGap: number): CategoryLabel {
  if (percentageGap <= -0.1) {
    return "low";
  }

  if (percentageGap < 0.1) {
    return "fair";
  }

  if (percentageGap < 0.2) {
    return "high";
  }

  return "very high";
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildRentCheckResult(
  input: RentCheckInput,
  benchmark: RentBenchmarkRecord,
  commune: SearchLocationResult,
): RentCheckResult {
  const multiplier = getSizeAdjustmentMultiplier(input.surfaceArea, benchmark.referenceSurfaceM2);
  const adjustedBenchmarkRentPerM2 = benchmark.benchmarkRentPerM2 * multiplier;
  const expectedMonthlyRent = adjustedBenchmarkRentPerM2 * input.surfaceArea;
  const expectedMonthlyRentLower =
    benchmark.predictionIntervalLower === null
      ? null
      : benchmark.predictionIntervalLower * multiplier * input.surfaceArea;
  const expectedMonthlyRentUpper =
    benchmark.predictionIntervalUpper === null
      ? null
      : benchmark.predictionIntervalUpper * multiplier * input.surfaceArea;
  const euroGap = input.monthlyRent - expectedMonthlyRent;
  const percentageGap = expectedMonthlyRent === 0 ? 0 : euroGap / expectedMonthlyRent;

  return {
    commune,
    segment: input.segment,
    benchmarkRentPerM2: roundToTwoDecimals(benchmark.benchmarkRentPerM2),
    adjustedBenchmarkRentPerM2: roundToTwoDecimals(adjustedBenchmarkRentPerM2),
    expectedMonthlyRent: roundToTwoDecimals(expectedMonthlyRent),
    expectedMonthlyRentLower:
      expectedMonthlyRentLower === null ? null : roundToTwoDecimals(expectedMonthlyRentLower),
    expectedMonthlyRentUpper:
      expectedMonthlyRentUpper === null ? null : roundToTwoDecimals(expectedMonthlyRentUpper),
    monthlyRent: roundToTwoDecimals(input.monthlyRent),
    euroGap: roundToTwoDecimals(euroGap),
    percentageGap: roundToTwoDecimals(percentageGap),
    categoryLabel: getCategoryLabel(percentageGap),
    referenceSurfaceM2: benchmark.referenceSurfaceM2,
    confidenceBase: benchmark.confidenceBase,
    predictionLevel: benchmark.predictionLevel,
    sourceDataset: benchmark.sourceDataset,
    sourceYear: benchmark.sourceYear,
  };
}
