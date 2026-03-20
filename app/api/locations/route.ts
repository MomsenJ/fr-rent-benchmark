import { NextRequest } from "next/server";

import { rentDataRepository } from "@/lib/repositories";

export async function GET(request: NextRequest): Promise<Response> {
  const query = request.nextUrl.searchParams.get("query") ?? "";
  const locations = await rentDataRepository.searchLocations(query);
  return Response.json({ locations });
}
