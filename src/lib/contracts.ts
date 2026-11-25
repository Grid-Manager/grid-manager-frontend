export type ApiStatus = "ready" | "not-configured" | "unavailable" | "not-found";

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CollectionResult<T> {
  status: ApiStatus;
  data: PagedResponse<T> | null;
}

export interface EntityResult<T> {
  status: ApiStatus;
  data: T | null;
}

export interface Category {
  id: number;
  name: string;
  acronym: string;
  propulsionType: string;
  vehicleType: string;
  tireSupplier: string;
  governingBody: string;
  horsePower: number | null;
  engineDescription?: string;
  foundingYear: number | null;
  licensePattern: string | null;
}

export interface Pilot {
  id: number;
  name: string;
  age: number | null;
  pilotNumber: number | null;
  raceNumbersBySeason?: Record<number, string[]>;
  latestRaceNumbers?: string[];
  categoryId: number;
  licenseId: number | null;
  seasonIds: number[];
}

export interface Season {
  id: number;
  name: string;
  year: number;
  categoryId: number;
  winnerPilotId: number | null;
  pilotIds: number[];
}

export type RaceStatus = "SCHEDULED" | "IN_PROGRESS" | "FINISHED";
export type RaceType = "STANDARD" | "SPRINT" | "FEATURE" | "ENDURANCE";
export type PilotRaceStatus = "FINISHED" | "DNF" | "DSQ" | "NC" | "DNS";

export interface Race {
  id: number;
  name: string;
  shortName?: string;
  resultSource?: string;
  realizationDate: string;
  startTime: string | null;
  laps: number | null;
  circuitLength: number | null;
  fastLap: string | null;
  hasSafetyCar: boolean | null;
  safetyCarLaps: number | null;
  raceStatus: RaceStatus;
  raceType: RaceType;
  seasonId: number;
  pilotFasterLapId: number | null;
}

export interface RaceResult {
  id: number;
  position: number | null;
  points: number | null;
  crew?: { number: string; team: string };
  raceStatusPilot: PilotRaceStatus;
  penalties: number | null;
  yellowFlags: number | null;
  redFlags: number | null;
  flagCount: number | null;
  pilotId: number;
  raceId: number;
}

export interface License {
  id: number;
  licenseNumber: string;
  pilotId: number;
}
