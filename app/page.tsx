import { RentCheckClient } from "@/components/rent-check-client";
import { rentDataRepository } from "@/lib/repositories";

export default async function HomePage() {
  const summary = await rentDataRepository.getDatasetSummary();

  return <RentCheckClient summary={summary} />;
}
