import type { RentDataRepository } from "@/lib/repositories/rent-data-repository";
import { csvRentDataRepository } from "@/lib/repositories/csv-rent-data-repository";

export const rentDataRepository: RentDataRepository = csvRentDataRepository;
