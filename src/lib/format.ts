import type { Pilot, PilotRaceStatus, Race, RaceStatus, RaceType, Season } from "@/lib/contracts";

export function formatDate(value: string | null | undefined, compact = false): string {
  if (!value) return "Data não informada";

  const datePart = value.slice(0, 10);
  const date = new Date(datePart + "T12:00:00Z");
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: compact ? "2-digit" : "short",
    year: compact ? undefined : "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatRaceStart(value: string | null | undefined): string {
  if (!value) return "Horário não informado";
  const datePart = value.slice(0, 10);
  const timePart = value.slice(11, 16);
  return timePart ? formatDate(datePart) + " · " + timePart : formatDate(datePart);
}

export function formatDecimal(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
}

export function seasonPeriod({ name, year }: Pick<Season, "name" | "year">): string {
  return name.match(/\b\d{4}\/\d{2,4}\b/)?.[0] ?? String(year);
}

export function raceTitle(race: Pick<Race, "name" | "shortName">): string {
  return race.shortName ?? race.name.replace(/\s+·\s+(?:sprint|corrida(?: principal)?|hypercar|lmgt3|moto[23])(?:\s+\d+)?$/i, "");
}

export function raceSession(race: Pick<Race, "name" | "raceType">): string {
  const session = race.name.match(/\s+·\s+(Sprint|Corrida(?: principal)?)(\s+\d+)?$/i);
  if (session?.[2]) return session[1] + session[2];
  return labelRaceType(race.raceType);
}

export function pilotRaceNumbers(pilot: Pilot, seasonId?: number): string[] {
  if (pilot.raceNumbersBySeason) {
    return seasonId === undefined ? pilot.latestRaceNumbers ?? [] : pilot.raceNumbersBySeason[seasonId] ?? [];
  }
  return pilot.pilotNumber == null ? [] : [String(pilot.pilotNumber)];
}

export function formatPosition(value: number | null): string {
  return value === null ? "—" : String(value).padStart(2, "0");
}

const raceStatusLabels: Record<RaceStatus, string> = {
  SCHEDULED: "Agendada",
  IN_PROGRESS: "Em andamento",
  FINISHED: "Finalizada",
};

const raceTypeLabels: Record<RaceType, string> = {
  STANDARD: "Corrida",
  SPRINT: "Sprint",
  FEATURE: "Corrida principal",
  ENDURANCE: "Endurance",
};

const pilotStatusLabels: Record<PilotRaceStatus, string> = {
  FINISHED: "Finalizou",
  DNF: "Não concluiu",
  DSQ: "Desclassificado",
  NC: "Não classificado",
  DNS: "Não largou",
};

export function labelRaceStatus(value: RaceStatus): string {
  return raceStatusLabels[value] ?? value;
}

export function labelRaceType(value: RaceType): string {
  return raceTypeLabels[value] ?? value;
}

export function labelPilotStatus(value: PilotRaceStatus): string {
  return pilotStatusLabels[value] ?? value;
}
