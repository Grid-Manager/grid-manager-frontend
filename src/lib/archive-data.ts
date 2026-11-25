import archiveJson from "@/lib/motorsport-archive.json";
import motorcycleResultsJson from "@/lib/motorcycle-results.json";
import stageResultsJson from "@/lib/stage-results.json";
import type { Category, Pilot, Race, RaceResult, RaceType, Season } from "@/lib/contracts";
import type { ChampionshipStanding } from "@/lib/standings";

type ArchivedEvent = [name: string, date: string, type: RaceType, sourceId?: number | null, laps?: number | null, shortName?: string];
type ArchivedStanding = [name: string, profile: string | null, position: number | null, points: number | null];
type ArchivedResult = [race: number, driver: string, position: number, points: number, status: RaceResult["raceStatusPilot"]];
type ArchivedSeason = {
  source: string | null;
  events: ArchivedEvent[];
  standings: ArchivedStanding[];
  results?: ArchivedResult[];
  numbers?: Record<string, string[]>;
};

const archive = archiveJson as unknown as Record<string, Record<string, ArchivedSeason>>;
type StageResult = {
  categoryId: number;
  date: string;
  raceType: RaceType;
  source: string;
  entries: {
    position: number | null;
    drivers: string[];
    status: RaceResult["raceStatusPilot"];
    points?: number;
    number?: string;
    team?: string;
  }[];
};
const stageResults = [...stageResultsJson, ...motorcycleResultsJson] as StageResult[];
const seriesKeys = ["f1", "f2", "f3", "indy", "fe", "wec", "lmgt3", "moto", "m2", "m3", "stock", "cup"];
const seasonSources = new Map<number, string>();
const pilotProfiles = new Map<number, string>();
const snapshotDate = "2026-11-25";

export function pilotNameKey(name: string) {
  const normalized = name.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalized === "carlossainzjr" ? "carlossainz" : normalized;
}

const entryAliases: Record<string, string> = {
  albon: "alexanderalbon",
  alexalbon: "alexanderalbon",
  andremoraesjr: "andremoraes",
  arthurleist: "arthurtobiasleist",
  atilarobertoa: "atilaabreu",
  enzoelias: "enzoweisheimer",
  enzoweisheimerelias: "enzoweisheimer",
  felipebartz: "felipebarrichellobartz",
  felipebaptista: "feliperodrigues",
  feliperodriguesbaptista: "feliperodrigues",
  heliocastroneves: "helioalvesc",
  johnhnemechek: "johnhunternemechek",
  josepmariamarti: "pepemarti",
  leorammerstofer: "leorammerstorfer",
  leoreis: "leonardoreis",
  lucaskohl: "lucasbellkohl",
  rafareis: "rafaelreis",
  sergiosettecamara: "sergiosantossette",
  toprakrazgatloglu: "toprakrazgatlioglu",
  xabierzurutuza: "xabizurutuza",
  zontavandengoorbergh: "zontavdgoorbergh",
};

export function entryNameKey(name: string) {
  const key = pilotNameKey(name.replace(/\s+(?:\(R\)|RY|R)$/, ""));
  return entryAliases[key] ?? key;
}

export function uniqueRoster(pilots: Pilot[]) {
  const seen = new Set<string>();
  return pilots.filter((pilot) => {
    const key = pilot.raceNumbersBySeason ? `${pilot.categoryId}:${entryNameKey(pilot.name)}` : String(pilot.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function stablePilotId(categoryId: number, name: string) {
  let hash = 2166136261;
  for (const character of name) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return categoryId * 4294967296 + (hash >>> 0);
}

export function getArchivedSeasonSource(seasonId: number) {
  return seasonSources.get(seasonId);
}

export function getArchivedPilotProfile(pilotId: number) {
  return pilotProfiles.get(pilotId);
}

export function appendArchive(
  categories: Category[],
  pilots: Pilot[],
  seasons: Season[],
  races: Race[],
  results: RaceResult[],
  standings: Map<number, ChampionshipStanding[]>,
) {
  for (const category of categories) {
    const key = seriesKeys[category.id - 900001];
    const currentSeason = seasons.find((season) => season.categoryId === category.id && season.year === 2026);
    const pilotsByName = new Map(pilots.filter((pilot) => pilot.categoryId === category.id).map((pilot) => [pilotNameKey(pilot.name), pilot]));
    for (const pilot of pilotsByName.values()) {
      pilot.raceNumbersBySeason = currentSeason && pilot.pilotNumber !== null
        ? { [currentSeason.id]: [String(pilot.pilotNumber)] }
        : {};
    }
    for (const [yearString, source] of Object.entries(archive[key] ?? {})) {
      const year = Number(yearString);
      const current = year === 2026 || (key === "fe" && year === 2025);
      const season = current ? currentSeason : {
        id: category.id * 10000 + year,
        name: key === "f2" && year < 2017 ? "GP2 Series" : key === "fe" ? `Fórmula E ${year}/${String(year + 1).slice(-2)}` : category.name,
        year,
        categoryId: category.id,
        winnerPilotId: null,
        pilotIds: [],
      };
      if (!season) continue;
      if (current && key === "fe") season.name = "Fórmula E 2025/26";
      if (!current) seasons.push(season);
      if (source.source) seasonSources.set(season.id, source.source);

      const register = (name: string, profile?: string | null) => {
        const normalized = pilotNameKey(name);
        let pilot = pilotsByName.get(normalized);
        if (!pilot) {
          pilot = {
            id: stablePilotId(category.id, normalized), name, age: null, pilotNumber: null,
            categoryId: category.id, licenseId: null, seasonIds: [], raceNumbersBySeason: {},
          };
          pilotsByName.set(normalized, pilot);
          pilots.push(pilot);
        }
        if (!pilot.seasonIds.includes(season.id)) pilot.seasonIds.push(season.id);
        if (!season.pilotIds.includes(pilot.id)) season.pilotIds.push(pilot.id);
        if (profile && !pilotProfiles.has(pilot.id)) pilotProfiles.set(pilot.id, profile);
        return pilot;
      };

      const field = source.standings.flatMap<ChampionshipStanding>(([name, profile, position, points]) => {
        const pilot = register(name, profile ?? (key === "f1" ? name : undefined));
        return position === null || points === null ? [] : [{ pilot, position, points, starts: null }];
      });
      if (!current || (key === "f1" && field.length)) standings.set(season.id, field);

      const alreadyPublished = current ? races.filter((race) => race.seasonId === season.id) : [];
      const eventIds = new Map<number, number>();
      const usedRaceIds = new Set<number>();
      source.events.forEach(([name, realizationDate, raceType, externalId, laps, shortName], index) => {
        const known = alreadyPublished.find((race) => {
          // Las Vegas is dated after midnight in the source and on race day in the local calendar.
          const sameLasVegasRace = key === "f1" && name.includes("Las Vegas") && race.name.includes("Las Vegas");
          return (race.realizationDate === realizationDate || sameLasVegasRace) && race.raceType === raceType && !usedRaceIds.has(race.id);
        });
        if (known) {
          usedRaceIds.add(known.id);
          if (shortName) known.shortName = shortName;
          if (externalId != null) eventIds.set(externalId, known.id);
          return;
        }
        const id = season.id * 100 + index + 1;
        if (!realizationDate) return;
        if (externalId != null) eventIds.set(externalId, id);
        races.push({
          id, seasonId: season.id, name, shortName, realizationDate, raceType, laps: laps ?? null,
          raceStatus: realizationDate <= snapshotDate ? "FINISHED" : "SCHEDULED",
          startTime: null, circuitLength: null, fastLap: null, hasSafetyCar: null,
          safetyCarLaps: null, pilotFasterLapId: null,
        });
      });

      const verifiedStages = new Map<number, { race: Race; stage: StageResult }>();
      for (const stage of stageResults) {
        if (stage.categoryId !== category.id || !stage.date.startsWith(yearString + "-")) continue;
        const race = races.find((item) => item.seasonId === season.id && item.realizationDate === stage.date && item.raceType === stage.raceType);
        if (race) verifiedStages.set(race.id, { race, stage });
      }
      const importedRaces = new Set(source.results?.map(([externalId]) => eventIds.get(externalId)));
      for (const raceId of verifiedStages.keys()) importedRaces.add(raceId);
      if (current && importedRaces.size) {
        for (let index = results.length - 1; index >= 0; index--) {
          if (importedRaces.has(results[index].raceId)) results.splice(index, 1);
        }
      }
      source.results?.forEach(([externalId, name, position, points, raceStatusPilot], index) => {
        const raceId = eventIds.get(externalId);
        if (raceId === undefined || verifiedStages.has(raceId)) return;
        const pilot = register(name);
        results.push({
          id: season.id * 10000 + index + 1, raceId, pilotId: pilot.id, position, points,
          raceStatusPilot, penalties: null, yellowFlags: null, redFlags: null, flagCount: null,
        });
      });

      for (const { race, stage } of verifiedStages.values()) {
        race.resultSource = stage.source;
        let verifiedResultId = 5_000_000_000_000 + race.id * 100;
        const participants = new Set<number>();
        for (const entry of stage.entries) {
          const crew = entry.team && entry.number ? { team: entry.team, number: entry.number } : undefined;
          for (const name of entry.drivers) {
            const preferred = pilotsByName.get(entryNameKey(name));
            const pilot = register(preferred?.name ?? name);
            if (participants.has(pilot.id)) continue;
            participants.add(pilot.id);
            results.push({
              id: verifiedResultId++, raceId: race.id, pilotId: pilot.id, position: entry.position,
              points: entry.points ?? null, raceStatusPilot: entry.status, crew,
              penalties: null, yellowFlags: null, redFlags: null, flagCount: null,
            });
          }
        }
      }

      const numbersByName = new Map<string, Set<string>>();
      for (const [name, numbers] of Object.entries(source.numbers ?? {})) {
        const nameKey = entryNameKey(name);
        const entries = numbersByName.get(nameKey) ?? new Set<string>();
        numbers.forEach((number) => entries.add(number));
        numbersByName.set(nameKey, entries);
      }
      for (const { stage } of verifiedStages.values()) {
        for (const { number, drivers } of stage.entries) {
          if (!number) continue;
          for (const name of drivers) {
            const key = entryNameKey(name);
            const entries = numbersByName.get(key) ?? new Set<string>();
            entries.add(number);
            numbersByName.set(key, entries);
          }
        }
      }
      for (const pilot of pilotsByName.values()) {
        const numbers = numbersByName.get(entryNameKey(pilot.name));
        if (!numbers?.size || !pilot.seasonIds.includes(season.id) || !pilot.raceNumbersBySeason) continue;
        pilot.raceNumbersBySeason[season.id] = [...numbers];
      }
    }

    const seasonIdsByYear = seasons.filter((season) => season.categoryId === category.id)
      .sort((a, b) => b.year - a.year).map((season) => season.id);
    for (const pilot of pilotsByName.values()) {
      const latest = seasonIdsByYear.find((id) => pilot.seasonIds.includes(id));
      pilot.latestRaceNumbers = latest === undefined ? [] : pilot.raceNumbersBySeason?.[latest] ?? [];
    }
  }
}
