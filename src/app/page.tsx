import Link from "next/link";
import { CategoryPicker } from "@/components/category-picker";
import { DashboardRaces } from "@/components/dashboard-races";
import { ResultParticipants } from "@/components/detail-ui";
import { getAllPages, getPortalSource } from "@/lib/api";
import { categoryHref, getCategorySelection } from "@/lib/category-scope";
import type { Pilot, Race, RaceResult, Season } from "@/lib/contracts";
import { formatDate, formatDecimal, formatPosition, labelPilotStatus, raceTitle, seasonPeriod } from "@/lib/format";
import { getReferenceCoverage, getReferenceSources, getReferenceStandings } from "@/lib/reference-data";
import { calculateStandings, compareRaceResults, groupRaceResults } from "@/lib/standings";

export const dynamic = "force-dynamic";

const todayInBrazil = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export default async function Home({ searchParams }: {
  searchParams: Promise<{ temporada?: string; categoria?: string }>;
}) {
  const query = await searchParams;
  const [source, { categories, selected }, allSeasons, allPilots, allRaces, allResults] = await Promise.all([
    getPortalSource(),
    getCategorySelection(query.categoria),
    getAllPages<Season>("seasons"),
    getAllPages<Pilot>("pilots"),
    getAllPages<Race>("races"),
    getAllPages<RaceResult>("results"),
  ]);

  const href = (path: string) => categoryHref(path, selected?.id);
  const seasons = { ...allSeasons, items: allSeasons.items.filter((item) => item.categoryId === selected?.id) };
  const seasonIds = new Set(seasons.items.map((item) => item.id));
  const pilots = { ...allPilots, items: allPilots.items.filter((item) => item.categoryId === selected?.id) };
  const races = { ...allRaces, items: allRaces.items.filter((item) => seasonIds.has(item.seasonId)) };
  const raceIds = new Set(races.items.map((item) => item.id));
  const results = { ...allResults, items: allResults.items.filter((item) => raceIds.has(item.raceId)) };
  const orderedSeasons = [...seasons.items].sort((a, b) => b.year - a.year || b.id - a.id);
  const season = orderedSeasons.find((item) => String(item.id) === query.temporada) ?? orderedSeasons[0];
  const today = todayInBrazil.format(new Date());
  const byDate = (a: Race, b: Race) =>
    a.realizationDate.localeCompare(b.realizationDate) || a.id - b.id;
  const groupedRaces = {
    next: races.items.filter((race) => race.raceStatus === "SCHEDULED" && race.realizationDate >= today).sort(byDate).slice(0, 5),
    ongoing: races.items.filter((race) => race.raceStatus === "IN_PROGRESS").sort(byDate).slice(0, 5),
    finished: races.items.filter((race) => race.raceStatus === "FINISHED").sort((a, b) => byDate(b, a)).slice(0, 5),
  };

  const ranksAvailable = [seasons.status, pilots.status, races.status, results.status].every((status) => status === "ready");
  const reference = source.kind === "reference";
  const standings = season && ranksAvailable
    ? reference ? getReferenceStandings(season.id)?.slice(0, 5) ?? []
      : calculateStandings(season.id, pilots.items, races.items, results.items, 5)
    : [];
  const maxPoints = Math.max(1, ...standings.map((row) => row.points));
  const resultsAvailable = races.status === "ready" && results.status === "ready";
  const racesWithResults = new Set(results.items.map((result) => result.raceId));
  const latestRace = resultsAvailable
    ? races.items.filter((race) => race.raceStatus === "FINISHED" && racesWithResults.has(race.id)).sort((a, b) => byDate(b, a))[0]
    : undefined;
  const latestResults = latestRace
    ? groupRaceResults(results.items.filter((result) => result.raceId === latestRace.id).sort(compareRaceResults)).slice(0, 5)
    : [];
  const latestByCrew = latestResults.some(([result]) => result.crew);
  const latestShowPoints = latestResults.some(([result]) => result.points !== null);
  const pilotById = new Map(pilots.items.map((pilot) => [pilot.id, pilot]));
  const metrics = [
    { label: "Temporadas", count: seasons.status === "ready" ? seasons.items.length : undefined, href: href("/temporadas") },
    { label: "Pilotos", count: pilots.status === "ready" ? pilots.items.length : undefined, href: href("/pilotos") },
    { label: "Corridas", count: races.status === "ready" && seasons.status === "ready" ? races.items.length : undefined, href: href("/corridas") },
    { label: "Etapas com resultado", count: resultsAvailable && seasons.status === "ready" ? racesWithResults.size : undefined, href: href("/resultados") },
  ];
  const readyCount = [seasons.status, pilots.status, races.status, results.status]
    .filter((status) => status === "ready").length;

  return (
    <main id="main-content" className="container dash-overview">
      <header className="dash-title">
        <div>
          <h1>Visão geral</h1>
          <p>Acompanhe o calendário, a classificação e os resultados do grid.</p>
        </div>
        <CategoryPicker action="/" categories={categories} selected={selected} />
      </header>

      <nav className="dash-metrics" aria-label={selected ? `Totais de ${selected.name}` : "Totais da categoria"}>
        {metrics.map(({ label, count, href }) => (
          <Link className="dash-metric" key={href} href={href}>
            <span>{label}</span>
            <strong className="mono">{count ?? <span aria-label="Indisponível">—</span>}</strong>
            <span className="dash-metric__arrow" aria-hidden="true">↗</span>
          </Link>
        ))}
      </nav>

      <div className="dash-panels">
        <DashboardRaces key={selected?.id} races={groupedRaces} available={races.status === "ready"} calendarHref={href("/corridas")} />
        <section className="dash-panel dash-standing" aria-labelledby="dash-standing-heading">
          <div className="dash-panel__head">
            <h2 id="dash-standing-heading">Classificação parcial</h2>
            <Link href={season ? href(`/temporadas/${season.id}`) : href("/temporadas")}>
              Ver temporada <span aria-hidden="true">↗</span>
            </Link>
          </div>
          {season && (
            <form className="dash-season" action="/">
              {selected && <input type="hidden" name="categoria" value={selected.id} />}
              <label htmlFor="dashboard-season">Temporada</label>
              <select id="dashboard-season" name="temporada" key={season.id} defaultValue={String(season.id)}>
                {orderedSeasons.map((item) => <option key={item.id} value={item.id}>{seasonPeriod(item)}</option>)}
              </select>
              <button type="submit">Aplicar</button>
            </form>
          )}
          {standings.length ? (
            <ol className="dash-rank">
              {standings.map((row) => (
                <li key={row.pilot.id}>
                  <span className="mono" aria-label={`Posição ${row.position}`}>{row.position.toString().padStart(2, "0")}</span>
                  <div>
                    <Link href={href(`/pilotos/${row.pilot.id}`)}>{row.pilot.name}</Link>
                    <div className="dash-rank__track" aria-hidden="true">
                      <i style={{ width: `${Math.max(0, row.points) / maxPoints * 100}%` }} />
                    </div>
                  </div>
                  <strong className="mono">{formatDecimal(row.points)} <small>pts</small></strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="dash-empty">{!ranksAvailable ? "Classificação indisponível." : season ? "Sem pontos publicados nesta temporada." : "Nenhuma temporada publicada."}</p>
          )}
        </section>

        <section className="dash-panel dash-results" aria-labelledby="dash-results-heading">
          <div className="dash-panel__head">
            <div>
              <h2 id="dash-results-heading">Último resultado</h2>
              {latestRace && <p><Link href={href(`/corridas/${latestRace.id}`)}>{raceTitle(latestRace)}</Link> · {formatDate(latestRace.realizationDate)}</p>}
            </div>
            <Link href={href("/resultados")}>Todos os resultados <span aria-hidden="true">↗</span></Link>
          </div>
          {latestRace ? (
            <div className="dash-table-scroll" tabIndex={0} role="region" aria-label="Último resultado">
              <table className="dash-table">
                <thead><tr><th scope="col">Pos.</th><th scope="col">{latestByCrew ? "Tripulação" : "Piloto"}</th><th scope="col">Status</th>{latestShowPoints && <th scope="col">Pontos</th>}</tr></thead>
                <tbody>
                  {latestResults.map((entries) => {
                    const result = entries[0];
                    return <tr key={result.id}>
                      <td className="mono">{formatPosition(result.position)}</td>
                      <th scope="row"><ResultParticipants entries={entries} pilotsById={pilotById} seasonId={latestRace.seasonId} /></th>
                      <td>{labelPilotStatus(result.raceStatusPilot)}</td>
                      {latestShowPoints && <td className="mono">{formatDecimal(result.points)}</td>}
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="dash-empty">{resultsAvailable ? "Nenhum resultado de corrida finalizada foi publicado." : "Resultados indisponíveis."}</p>
          )}
        </section>
      </div>
      {reference && selected && (
        <footer id="fontes" className="dash-sources">
          <h2>Fontes oficiais</h2>
          <p>{selected.name} · Temporada 2026 · {getReferenceCoverage(selected.id) ?? "Consulta em 25 nov 2026."} Calendário e resultados exibem as etapas importadas.</p>
          <ul>{getReferenceSources(selected.id).map(({ label, href }) => <li key={href}><a href={href}>{label} ↗</a></li>)}</ul>
        </footer>
      )}
      {!reference && readyCount < 4 && <p className="dash-sources">Parte dos dados da categoria está indisponível.</p>}
    </main>
  );
}
