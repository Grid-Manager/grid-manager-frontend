import type { Pilot, Race, RaceResult } from "@/lib/contracts";

export interface ChampionshipStanding {
  pilot: Pilot;
  points: number;
  starts: number | null;
  position: number;
}

export function compareRaceResults(a: RaceResult, b: RaceResult) {
  return (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER) || a.id - b.id;
}

export function groupRaceResults(results: RaceResult[]): RaceResult[][] {
  const groups = new Map<string, RaceResult[]>();
  for (const result of results) {
    const key = result.crew ? `${result.raceId}:${result.crew.number}` : String(result.id);
    const group = groups.get(key);
    if (group) group.push(result);
    else groups.set(key, [result]);
  }
  return [...groups.values()];
}

export function calculateStandings(
  seasonId: number,
  pilots: Pilot[],
  races: Race[],
  results: RaceResult[],
  limit = Number.POSITIVE_INFINITY,
): ChampionshipStanding[] {
  const seasonRaceIds = new Set(
    races.filter((race) => race.seasonId === seasonId).map((race) => race.id),
  );
  const pointsByPilot = new Map<number, { points: number; starts: number }>();

  for (const result of results) {
    if (!seasonRaceIds.has(result.raceId) || result.points === null) continue;
    const current = pointsByPilot.get(result.pilotId) ?? { points: 0, starts: 0 };
    current.points += result.points;
    current.starts += 1;
    pointsByPilot.set(result.pilotId, current);
  }

  const sorted = [...pointsByPilot.entries()]
    .map(([pilotId, result]) => ({
      pilot: pilots.find((pilot) => pilot.id === pilotId),
      ...result,
    }))
    .filter((entry): entry is { pilot: Pilot; points: number; starts: number } => Boolean(entry.pilot))
    .sort((a, b) => b.points - a.points || a.pilot.name.localeCompare(b.pilot.name, "pt-BR"));

  let position = 0;
  return sorted.slice(0, limit).map((entry, index) => {
    if (index === 0 || sorted[index - 1].points !== entry.points) {
      position = index + 1;
    }
    return { ...entry, position };
  });
}
