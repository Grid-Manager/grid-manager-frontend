import type { Category, Pilot, Race, RaceResult, Season } from "@/lib/contracts";
import type { ChampionshipStanding } from "@/lib/standings";
import { referenceDrivers, type ReferenceDriver } from "@/lib/reference-drivers";
import { appendArchive } from "@/lib/archive-data";

type SourceLink = { label: string; href: string };
type Round = {
  name: string;
  date: string;
  status: Race["raceStatus"];
  time?: string;
  laps?: number;
  length?: number;
  type?: Race["raceType"];
  finish?: readonly (readonly [name: string, points: number])[];
};
type Series = {
  id: number;
  name: string;
  acronym: string;
  vehicle: string;
  power: string;
  body: string;
  tires?: string;
  engine?: string;
  horsePower?: number;
  foundingYear?: number;
  coverage?: string;
  drivers: ReferenceDriver[];
  rounds: Round[];
  sources: SourceLink[];
};

const series: Series[] = [
  {
    id: 900001, name: "Fórmula 1", acronym: "F1", vehicle: "Monoposto", power: "Híbrida", body: "FIA",
    tires: "Pirelli", engine: "V6 1,6 L turbo", foundingYear: 1950, drivers: referenceDrivers.f1,
    rounds: [
      { name: "GP de São Paulo", date: "2026-11-08", status: "FINISHED", time: "14:00", laps: 71, length: 4.309,
        finish: [["Lando Norris", 25], ["Max Verstappen", 18], ["Isack Hadjar", 15], ["George Russell", 12], ["Kimi Antonelli", 10]] },
      { name: "GP de Las Vegas", date: "2026-11-21", status: "FINISHED", time: "20:00", laps: 50, length: 6.201,
        finish: [["Max Verstappen", 25], ["Lando Norris", 18], ["Oscar Piastri", 15], ["Kimi Antonelli", 12], ["Pierre Gasly", 10]] },
      { name: "GP do Catar", date: "2026-11-29", status: "SCHEDULED", time: "19:00", laps: 57, length: 5.419 },
      { name: "GP de Abu Dhabi", date: "2026-12-06", status: "SCHEDULED", time: "17:00", laps: 58, length: 5.281 },
    ],
    sources: [
      { label: "Calendário", href: "https://www.formula1.com/en/racing/2026" },
      { label: "Classificação", href: "https://www.formula1.com/en/results/2026/drivers" },
      { label: "Número de Alexander Albon", href: "https://www.formula1.com/en/drivers/alexander-albon" },
      { label: "Unidades de potência de 2026", href: "https://www.formula1.com/en/latest/article/2026-regulations-explained-all-you-need-to-know-about-the-new-power-units.14jfv7a36905uDJDdNyfQd" },
      { label: "GP de São Paulo", href: "https://www.formula1.com/en/results/2026/races/1299/brazil/race-result" },
      { label: "GP de Las Vegas", href: "https://www.formula1.com/en/results/2026/races/1300/las-vegas/race-result" },
    ],
  },
  {
    id: 900002, name: "Fórmula 2", acronym: "F2", vehicle: "Monoposto", power: "Combustão", body: "FIA",
    tires: "Pirelli", engine: "Mecachrome V6 3,4 L turbo", horsePower: 620, foundingYear: 2017, drivers: referenceDrivers.f2,
    rounds: [
      { name: "Baku · Corrida principal 2", date: "2026-09-26", status: "FINISHED", type: "FEATURE", length: 6.003,
        finish: [["Rafael Câmara", 25], ["Nikola Tsolov", 19], ["Alexander Dunne", 15], ["Martinius Stenshorne", 12], ["Laurens van Hoepen", 10]] },
      { name: "Lusail · Corrida principal", date: "2026-11-29", status: "SCHEDULED", type: "FEATURE" },
      { name: "Yas Marina · Corrida principal", date: "2026-12-06", status: "SCHEDULED", type: "FEATURE" },
    ],
    sources: [
      { label: "Classificação", href: "https://www.fiaformula2.com/en/standings/2026/drivers" },
      { label: "Calendário e resultados", href: "https://www.fiaformula2.com/en/racing/2026" },
      { label: "Carro e motor", href: "https://www.fiaformula2.com/en/information/the-car-and-engine-f2%26lang%3Den.14LCsEEMG9yyx5DkhcN1J8" },
    ],
  },
  {
    id: 900003, name: "Fórmula 3", acronym: "F3", vehicle: "Monoposto", power: "Combustão", body: "FIA",
    tires: "Pirelli", engine: "Mecachrome V6 3,4 L aspirado", horsePower: 380, foundingYear: 2019, drivers: referenceDrivers.f3,
    rounds: [{ name: "Madri · Corrida principal 2", date: "2026-09-13", status: "FINISHED", type: "FEATURE",
      finish: [["Tuukka Taponen", 26], ["Ugo Ugochukwu", 18], ["Pedro Clerot", 15], ["Taito Kato", 12], ["Mattia Colnaghi", 10]] }],
    sources: [
      { label: "Classificação", href: "https://www.fiaformula3.com/en/standings/2026/drivers" },
      { label: "Calendário e resultados", href: "https://www.fiaformula3.com/en/racing/2026" },
      { label: "Carro e motor", href: "https://www.fiaformula3.com/en/latest/article/fia-formula-3-next-generation-car-unveiled-in-monzaAikataulut.fvztJX3uvkG3x0YCbf0K4" },
    ],
  },
  {
    id: 900004, name: "IndyCar", acronym: "INDY", vehicle: "Monoposto", power: "Híbrida", body: "INDYCAR",
    tires: "Firestone", engine: "V6 2,2 L biturbo", drivers: referenceDrivers.indy,
    rounds: [{ name: "GP de Monterey", date: "2026-09-06", status: "FINISHED", laps: 95, length: 3.602,
      finish: [["Scott McLaughlin", 54], ["Kyle Kirkwood", 40], ["Alexander Rossi", 36], ["Felix Rosenqvist", 33], ["David Malukas", 30]] }],
    sources: [
      { label: "Classificação", href: "https://www.indycar.com/standings/2026" },
      { label: "Especificações do carro", href: "https://www.indycar.com/Fan-Info/INDYCAR-101/Cars" },
      { label: "GP de Monterey", href: "https://www.indycar.com/results/amazon/2026/mission-foods-grand-prix-of-monterey/race" },
    ],
  },
  {
    id: 900005, name: "Fórmula E", acronym: "FE", vehicle: "Monoposto", power: "Elétrica", body: "FIA",
    tires: "Hankook", foundingYear: 2014, drivers: referenceDrivers.fe,
    rounds: [
      { name: "E-Prix de Londres · Corrida 2", date: "2026-08-16", status: "FINISHED",
        finish: [["Taylor Barnard", 25], ["Nyck De Vries", 21], ["Edoardo Mortara", 15], ["Mitch Evans", 12], ["Sébastien Buemi", 10]] },
    ],
    sources: [
      { label: "Classificação e resultados", href: "https://www.fiaformulae.com/en/results-and-standings?season=12&tab=drivers" },
      { label: "Histórico e gerações dos carros", href: "https://www.fiaformulae.com/en/history" },
    ],
  },
  {
    id: 900006, name: "WEC Hypercar", acronym: "HYP", vehicle: "Protótipo", power: "Híbrida ou combustão", body: "FIA / ACO",
    tires: "Michelin", foundingYear: 2021, drivers: referenceDrivers.hyper,
    rounds: [{ name: "6 Horas de Monza · Hypercar", date: "2026-11-08", status: "FINISHED", type: "ENDURANCE", laps: 191 }],
    sources: [
      { label: "Classificação por classe", href: "https://www.fiawec.com/en/season/2026" },
      { label: "6 Horas de Monza", href: "https://www.fiawec.com/en/race/summary/5066" },
      { label: "Pneus por classe", href: "https://www.fiawec.com/en/news/tyre-partners/8259" },
    ],
  },
  {
    id: 900007, name: "WEC LMGT3", acronym: "LMGT3", vehicle: "Gran Turismo", power: "Combustão", body: "FIA / ACO",
    tires: "Goodyear", foundingYear: 2024, drivers: referenceDrivers.lm,
    rounds: [{ name: "6 Horas de Monza · LMGT3", date: "2026-11-08", status: "FINISHED", type: "ENDURANCE", laps: 173 }],
    sources: [
      { label: "Classificação por classe", href: "https://www.fiawec.com/en/season/2026" },
      { label: "6 Horas de Monza", href: "https://www.fiawec.com/en/race/summary/5066" },
      { label: "Pneus por classe", href: "https://www.fiawec.com/en/news/goodyear-to-become-exclusive-tyre-supplier-to-fia-wecs-new-lmgt3-class/7616" },
    ],
  },
  {
    id: 900008, name: "MotoGP", acronym: "MOTOGP", vehicle: "Moto", power: "Combustão", body: "FIM",
    tires: "Michelin", engine: "1.000 cm³ · 4 cilindros", drivers: referenceDrivers.gp,
    rounds: [
      { name: "GP de Portugal", date: "2026-11-22", status: "FINISHED" },
      { name: "GP de Valência", date: "2026-11-29", status: "SCHEDULED", time: "14:00" },
    ],
    sources: [
      { label: "Classificação", href: "https://stats.motogp.com/en/world-standing/2026/MotoGP/RidersChampionship" },
      { label: "GP de Portugal", href: "https://www.motogp.com/en/news/2026/11/22/bezzecchi-vence-em-portugal-enquanto-marc-marquez-termina-em-8-lugar-e-conquista-seu-8-titulo-da-motogp/1186076" },
      { label: "GP de Valência", href: "https://www.motogp.com/en/calendar/2026/event/valencia/6ad2859f-51c4-459e-9714-338814e7537f" },
      { label: "Pneus e classes", href: "https://www.motogp.com/en/news/2026/09/08/why-do-motogp-bikes-use-slick-tyresx-the-science-behind-racing-rubber/1089039" },
    ],
  },
  {
    id: 900009, name: "Moto2", acronym: "MOTO2", vehicle: "Moto", power: "Combustão", body: "FIM",
    tires: "Pirelli", engine: "765 cm³ · 3 cilindros", foundingYear: 2010, drivers: referenceDrivers.moto2,
    rounds: [{ name: "GP de Valência · Moto2", date: "2026-11-29", status: "SCHEDULED", time: "12:15", laps: 22 }],
    sources: [
      { label: "Classificação", href: "https://stats.motogp.com/en/world-standing/2026/Moto2/RidersChampionship" },
      { label: "Motores por categoria", href: "https://www.motogp.com/en/news/2025/03/12/a-f/521463" },
      { label: "Pneus", href: "https://www.motogp.com/en/news/2023/06/29/pirelli-to-become-exclusive-tyre-supplier-to-moto2-moto3/433087" },
      { label: "GP de Valência", href: "https://www.motogp.com/en/calendar/2026/event/valencia/6ad2859f-51c4-459e-9714-338814e7537f" },
    ],
  },
  {
    id: 900010, name: "Moto3", acronym: "MOTO3", vehicle: "Moto", power: "Combustão", body: "FIM",
    tires: "Pirelli", engine: "250 cm³ · 1 cilindro", foundingYear: 2012, drivers: referenceDrivers.moto3,
    rounds: [{ name: "GP de Valência · Moto3", date: "2026-11-29", status: "SCHEDULED", time: "11:00", laps: 20 }],
    sources: [
      { label: "Classificação", href: "https://stats.motogp.com/en/world-standing/2026/Moto3/RidersChampionship" },
      { label: "Motores por categoria", href: "https://www.motogp.com/en/news/2025/03/12/a-f/521463" },
      { label: "Pneus", href: "https://www.motogp.com/en/news/2023/06/29/pirelli-to-become-exclusive-tyre-supplier-to-moto2-moto3/433087" },
      { label: "GP de Valência", href: "https://www.motogp.com/en/calendar/2026/event/valencia/6ad2859f-51c4-459e-9714-338814e7537f" },
    ],
  },
  {
    id: 900011, name: "Stock Car Pro Series", acronym: "STOCK", vehicle: "Turismo", power: "Combustão", body: "CBA",
    tires: "Hankook", drivers: referenceDrivers.stock,
    coverage: "Classificação após a etapa de Cascavel de 18 out 2026.",
    rounds: [
      { name: "Cascavel · Etapa 10", date: "2026-10-18", status: "FINISHED" },
    ],
    sources: [
      { label: "Classificação CBA · Página 1", href: "https://cba.org.br/campeonato/classificacao/212/261/stock-car-pro-series/" },
      { label: "Regulamento técnico", href: "https://cba.org.br/upload/downloads/860/stock-car-pro-series-regulamento-tecnico-2026-.pdf" },
      { label: "Página 2", href: "https://cba.org.br/campeonato/classificacao/212/261/stock-car-pro-series/10" },
      { label: "Página 3", href: "https://cba.org.br/campeonato/classificacao/212/261/stock-car-pro-series/20" },
    ],
  },
  {
    id: 900012, name: "NASCAR Cup Series", acronym: "CUP", vehicle: "Stock car", power: "Combustão", body: "NASCAR",
    tires: "Goodyear", engine: "V8 358 pol³ (5,86 L)", drivers: referenceDrivers.nascar,
    coverage: "Classificação do relatório NASCAR Statistics de Homestead, de 8 nov 2026.",
    rounds: [{ name: "Final em Homestead", date: "2026-11-08", status: "FINISHED" }],
    sources: [
      { label: "Classificação NASCAR", href: "https://www.nascar.com/standings/nascar-cup-series/" },
      { label: "Ficha técnica do Next Gen", href: "https://media.ndms.nascar.com/nascar/2021/NextGen/NextGen-SpecSheet.pdf" },
      { label: "Números dos inscritos", href: "https://www.nascar.com/news-media/2026/05/04/2026-nascar-cup-series-entry-list-for-watkins-glen-international/" },
      { label: "Relatório de pontos", href: "https://nbcsports.brightspotcdn.com/68/dd/f6d2f9e94f09b05aa2badafb0dcc/2026-homestead-12636-unoffdrivpts.pdf" },
      { label: "Final em Homestead", href: "https://www.nascar.com/live-results/nascar-cup-series/2026-nascar-cup-series-championship-race/?section=results" },
    ],
  },
];

const categories: Category[] = [];
const seasons: Season[] = [];
const pilots: Pilot[] = [];
const races: Race[] = [];
const results: RaceResult[] = [];
const standings = new Map<number, ChampionshipStanding[]>();

for (const entry of series) {
  const seasonId = 902025 + (entry.id - 900000);
  categories.push({
    id: entry.id, name: entry.name, acronym: entry.acronym,
    propulsionType: entry.power, vehicleType: entry.vehicle,
    tireSupplier: entry.tires ?? "Não informado", governingBody: entry.body,
    horsePower: entry.horsePower ?? null, engineDescription: entry.engine,
    foundingYear: entry.foundingYear ?? null, licensePattern: null,
  });

  const field = entry.drivers.map(([name, points, position, pilotNumber, starts], index) => {
    const id = entry.acronym === "F1" && pilotNumber !== null
      ? 901000 + pilotNumber : entry.id * 1_000 + index + 1;
    const pilot: Pilot = {
      id, name, pilotNumber, age: null, categoryId: entry.id, licenseId: null, seasonIds: [seasonId],
    };
    return { pilot, points, position, starts: starts ?? null };
  });
  standings.set(seasonId, field);
  pilots.push(...field.map((row) => row.pilot));
  seasons.push({
    id: seasonId, name: entry.name, year: 2026, categoryId: entry.id,
    winnerPilotId: null, pilotIds: field.map((row) => row.pilot.id),
  });

  const pilotByName = new Map(field.map(({ pilot }) => [pilot.name, pilot]));
  entry.rounds.forEach((round, index) => {
    const raceId = entry.id * 100 + index + 1;
    races.push({
      id: raceId, name: round.name, realizationDate: round.date, startTime: round.time ?? null,
      laps: round.laps ?? null, circuitLength: round.length ?? null, raceStatus: round.status,
      fastLap: null, hasSafetyCar: null, safetyCarLaps: null, raceType: round.type ?? "STANDARD",
      seasonId, pilotFasterLapId: null,
    });
    round.finish?.forEach(([name, points], position) => {
      const pilot = pilotByName.get(name);
      if (!pilot) return;
      results.push({
        id: raceId * 100 + position, raceId, pilotId: pilot.id,
        position: position + 1, points, raceStatusPilot: "FINISHED",
        penalties: null, yellowFlags: null, redFlags: null, flagCount: null,
      });
    });
  });
}

appendArchive(categories, pilots, seasons, races, results, standings);

export const referenceCollections: Record<string, ReadonlyArray<Category | Pilot | Race | RaceResult | Season>> = {
  categories, seasons, pilots, races, results,
};

export function getReferenceStandings(seasonId: number) {
  return standings.get(seasonId);
}

export function getReferenceSources(categoryId: number) {
  return series.find((entry) => entry.id === categoryId)?.sources ?? [];
}

export function getReferenceCoverage(categoryId: number) {
  return series.find((entry) => entry.id === categoryId)?.coverage;
}
