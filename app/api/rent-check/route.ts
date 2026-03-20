import { rentDataRepository } from "@/lib/repositories";
import { buildRentCheckResult } from "@/lib/domain/rent-check";
import type { FormSegment, RentCheckInput } from "@/lib/types";

function isFormSegment(value: string): value is FormSegment {
  return value === "apartment_1_2p" || value === "apartment_3p_plus";
}

export async function POST(request: Request): Promise<Response> {
  const payload = (await request.json()) as Partial<RentCheckInput>;
  const locationKey = payload.locationKey?.trim() ?? "";
  const segment = payload.segment;
  const surfaceArea = Number(payload.surfaceArea);
  const monthlyRent = Number(payload.monthlyRent);

  if (!locationKey || !segment || !isFormSegment(segment)) {
    return Response.json({ errorCode: "invalid_selection" }, { status: 400 });
  }

  if (!Number.isFinite(surfaceArea) || surfaceArea <= 0) {
    return Response.json({ errorCode: "invalid_surface_area" }, { status: 400 });
  }

  if (!Number.isFinite(monthlyRent) || monthlyRent <= 0) {
    return Response.json({ errorCode: "invalid_monthly_rent" }, { status: 400 });
  }

  const [location, benchmark] = await Promise.all([
    rentDataRepository.getLocationByInseeCode(locationKey),
    rentDataRepository.getBenchmark(locationKey, segment),
  ]);

  if (!location || !benchmark) {
    return Response.json({ errorCode: "benchmark_not_found" }, { status: 404 });
  }

  const result = buildRentCheckResult(
    {
      locationKey,
      segment,
      surfaceArea,
      monthlyRent,
    },
    benchmark,
    {
      inseeCode: location.inseeCode,
      displayName: location.displayName,
      communeName: location.communeName,
      departmentCode: location.departmentCode,
      isArrondissement: location.isArrondissement,
    },
  );

  return Response.json({ result });
}
