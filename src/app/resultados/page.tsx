import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { CategoryPicker, SeasonPicker } from "@/components/category-picker";
import { DataFeedback, EmptyState, PageHeading, Pagination } from "@/components/data-ui";
import { ResultParticipants } from "@/components/detail-ui";
import { getAllPages } from "@/lib/api";
import { categoryHref, getCategorySelection, pageItems, seasonHref, seasonsForCategory } from "@/lib/category-scope";
import type { Pilot, Race, RaceResult, Season } from "@/lib/contracts";
import { formatDate, formatDecimal, formatPosition, labelPilotStatus, raceSession, raceTitle } from "@/lib/format";
import { compareRaceResults, groupRaceResults } from "@/lib/standings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Resultados" };

export default async function ResultsPage({ searchParams }: {
  searchParams: Promise<{ page?: string; categoria?: string; etapa?: string; temporada?: string }>;
}) {
  const query = await searchParams;
  const [{ categories, selected }, raceData, pilotData, seasonData, resultData] = await Promise.all([
    getCategorySelection(query.categoria), getAllPages<Race>("races"),
    getAllPages<Pilot>("pilots"), getAllPages<Season>("seasons"), getAllPages<RaceResult>("results"),
  ]);
  const seasons = seasonsForCategory(seasonData.items, selected?.id);
  const seasonIds = new Set(seasons.map((season) => season.id));
  const pilotsById = new Map(pilotData.items.filter((pilot) => pilot.categoryId === selected?.id).map((pilot) => [pilot.id, pilot]));
  const publishedRaceIds = new Set(resultData.items.map((result) => result.raceId));
  const requestedRace = raceData.items.find((race) => String(race.id) === query.etapa && seasonIds.has(race.seasonId));
  const season = seasons.find((item) => String(item.id) === query.temporada) ??
    seasons.find((item) => item.id === requestedRace?.seasonId) ?? seasons[0];
  const races = raceData.items.filter((race) => race.seasonId === season?.id &&
    (race.raceStatus === "FINISHED" || publishedRaceIds.has(race.id)))
    .sort((a, b) => b.realizationDate.localeCompare(a.realizationDate) || b.id - a.id);
  const race = races.find((item) => String(item.id) === query.etapa) ??
    races.find((item) => publishedRaceIds.has(item.id)) ?? races[0];
  const results = resultData.items.filter((row) => row.raceId === race?.id)
    .sort(compareRaceResults);
  const byCrew = results.some((result) => result.crew);
  const showPoints = results.some((result) => result.points !== null);
  const status = [resultData.status, seasonData.status, raceData.status, pilotData.status].find((item) => item !== "ready") ?? "ready";
  const groups = groupRaceResults(results);
  const page = pageItems(groups, query.page, 50);
  const href = (path: string) => categoryHref(path, selected?.id);

  return (
    <main id="main-content" className="dashboard-list-page results-page">
      <div className="container">
        <PageHeading eyebrow="Classificação" title="Resultados" description="Confira as posições e os pontos de cada etapa." />
        <section className="results-toolbar competition-surface" aria-label="Filtros de resultados">
          {selected && categories.length < 2 && <span className="results-toolbar__category">{selected.name}</span>}
          <CategoryPicker action="/resultados" categories={categories} selected={selected} />
          <SeasonPicker action="/resultados" categoryId={selected?.id} seasons={seasons} selected={season?.id} />
          {selected && race && races.length > 1 && (
            <Form className="category-picker results-stage-picker" action="/resultados">
              <input name="categoria" type="hidden" value={selected.id} />
              <input name="temporada" type="hidden" value={race.seasonId} />
              <label htmlFor="results-stage">Etapa</label>
              <select id="results-stage" key={race.id} name="etapa" defaultValue={String(race.id)}>
                {races.map((item) => {
                  const session = raceSession(item);
                  return <option key={item.id} value={item.id}>{raceTitle(item)}{session !== "Corrida" ? " · " + session : ""} · {formatDate(item.realizationDate, true)}</option>;
                })}
              </select>
              <button type="submit">Ver etapa</button>
            </Form>
          )}
        </section>
        {status !== "ready" ? <DataFeedback status={status} subject="resultados" /> : race ? (
          <section className="competition-surface results-panel" aria-labelledby="results-stage-title" key={`${race.id}-${page.page}`}>
            <header className="results-panel__head">
              <div>
                <p className="results-panel__meta mono">
                  <span>{raceSession(race)}</span>
                  <time dateTime={race.realizationDate}>{formatDate(race.realizationDate)}</time>
                  {groups.length > 0 && <span>
                    {groups.length} {byCrew ? (groups.length === 1 ? "tripulação" : "tripulações") : (groups.length === 1 ? "piloto" : "pilotos")}
                  </span>}
                </p>
                <h2 id="results-stage-title">{raceTitle(race)}</h2>
              </div>
              <Link className="competition-link" href={href(`/corridas/${race.id}`)}>Detalhes da etapa <span aria-hidden="true">↗</span></Link>
            </header>
            {groups.length > 0 ? <table className="results-table" aria-labelledby="results-stage-title">
              <thead><tr><th scope="col"><abbr title="Posição">Pos.</abbr></th><th scope="col">{byCrew ? "Tripulação" : "Piloto"}</th><th scope="col">Status</th>{showPoints && <th scope="col"><abbr title="Pontos">Pts</abbr></th>}</tr></thead>
              <tbody>
                {page.content.map((entries) => {
                  const result = entries[0];
                  return (
                    <tr key={result.id}>
                      <td><span className="results-position mono" data-leader={result.position === 1}>{formatPosition(result.position)}</span></td>
                      <th scope="row"><ResultParticipants entries={entries} pilotsById={pilotsById} seasonId={race.seasonId} /></th>
                      <td><span className="results-status" data-status={result.raceStatusPilot}>{labelPilotStatus(result.raceStatusPilot)}</span></td>
                      {showPoints && <td className="mono">{formatDecimal(result.points)}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table> : (
              <p className="results-panel__empty" role="status">A classificação desta etapa ainda não está disponível no portal.</p>
            )}
            <Pagination path={`${seasonHref("/resultados", selected?.id, race.seasonId)}&etapa=${race.id}`} page={page.page} totalPages={page.totalPages} />
            {race.resultSource && <div className="results-panel__source"><a href={race.resultSource}>Fonte da classificação ↗</a></div>}
          </section>
        ) : (
          <EmptyState title="Sem resultados de etapas" detail="A classificação do campeonato está na página da temporada." href={href(season ? `/temporadas/${season.id}` : "/temporadas")} linkLabel="Ver campeonato" />
        )}
      </div>
    </main>
  );
}
