import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataFeedback, EmptyState, PilotCard, RaceCard } from "@/components/data-ui";
import { DetailSection } from "@/components/detail-ui";
import { getAllPages, getEntity, getPortalSource } from "@/lib/api";
import { getArchivedSeasonSource, uniqueRoster } from "@/lib/archive-data";
import { categoryHref, seasonHref } from "@/lib/category-scope";
import type { Category, Pilot, Race, RaceResult, Season } from "@/lib/contracts";
import { calculateStandings } from "@/lib/standings";
import { getReferenceCoverage, getReferenceStandings } from "@/lib/reference-data";
import { formatDecimal, pilotRaceNumbers, seasonPeriod } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Temporada" };

export default async function SeasonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId < 1) notFound();

  const seasonResult = await getEntity<Season>("seasons", numericId);
  if (seasonResult.status === "not-found") notFound();
  if (seasonResult.status !== "ready" || !seasonResult.data) {
    return <main id="main-content"><div className="container detail-page"><DataFeedback status={seasonResult.status} subject="temporada" /></div></main>;
  }

  const season = seasonResult.data;
  const [category, pilots, races, results, source] = await Promise.all([
    getEntity<Category>("categories", season.categoryId),
    getAllPages<Pilot>("pilots"),
    getAllPages<Race>("races"),
    getAllPages<RaceResult>("results"),
    getPortalSource(),
  ]);
  const seasonRaces = races.items
    .filter((race) => race.seasonId === season.id)
    .sort((a, b) => a.realizationDate.localeCompare(b.realizationDate));
  const referenceStandings = source.kind === "reference" ? getReferenceStandings(season.id) : undefined;
  const archiveSource = source.kind === "reference" ? getArchivedSeasonSource(season.id) : undefined;
  const standings = pilots.status === "ready" && races.status === "ready" && results.status === "ready"
    ? referenceStandings ?? calculateStandings(season.id, pilots.items, races.items, results.items)
    : [];
  const categoryReady = category.status === "ready" ? category.data : null;
  const participantIds = new Set(season.pilotIds);
  const participants = uniqueRoster(pilots.items.filter((pilot) => participantIds.has(pilot.id)));

  return (
    <main id="main-content" className="detail-page season-detail">
      <div className="container">
        <Link className="detail-page-back" href={categoryHref("/temporadas", season.categoryId)}>← Temporadas</Link>
        <header className="competition-surface competition-identity">
          <div className="competition-identity__title">
            <p className="eyebrow"><span className="eyebrow__mark" />Temporada {seasonPeriod(season)}</p>
            <h1>{season.name}</h1>
            {categoryReady && categoryReady.name !== season.name && <p>{categoryReady.name}</p>}
          </div>
        </header>

        <DetailSection eyebrow="Classificação" title="Pontos publicados">
          {pilots.status !== "ready" ? (
            <DataFeedback status={pilots.status} subject="pilotos" />
          ) : races.status !== "ready" ? (
            <DataFeedback status={races.status} subject="corridas" />
          ) : results.status !== "ready" ? (
            <DataFeedback status={results.status} subject="resultados" />
          ) : standings.length ? (
            <div className="detail-standings">
              {standings.map((row) => (
                <Link className="detail-standing-row" href={seasonHref(`/pilotos/${row.pilot.id}`, season.categoryId, season.id)} key={row.pilot.id}>
                  <span className="detail-standing-row__position mono">{String(row.position).padStart(2, "0")}</span>
                  <span className="detail-standing-row__number mono">{pilotRaceNumbers(row.pilot, season.id).join("/") || "—"}</span>
                  <span className="detail-standing-row__name">{row.pilot.name}</span>
                  <span className="detail-standing-row__starts mono">{row.starts == null ? "—" : `${row.starts} etapas`}</span>
                  <strong className="detail-standing-row__points mono">{formatDecimal(row.points)}<small>PTS</small></strong>
                </Link>
              ))}
              <p className="detail-data-note">{referenceStandings
                ? archiveSource && season.year < 2026 ? <a href={archiveSource}>Fonte da classificação da temporada ↗</a> :
                  getReferenceCoverage(season.categoryId) ?? "Classificação consultada em 25 nov 2026."
                : "Classificação parcial pela soma dos pontos registrados. Pilotos empatados em pontos permanecem empatados."}</p>
            </div>
          ) : (
            <EmptyState title="Sem resultados publicados" detail="A pontuação aparece aqui quando os resultados oficiais desta temporada forem registrados." />
          )}
        </DetailSection>

        <DetailSection eyebrow="Etapas" title="Calendário da temporada">
          {races.status !== "ready" ? (
            <DataFeedback status={races.status} subject="corridas" />
          ) : seasonRaces.length ? (
            <div className="detail-race-list">
              {seasonRaces.map((race) => <RaceCard category={categoryReady ?? undefined} key={race.id} race={race} season={season} />)}
            </div>
          ) : (
            <EmptyState title="Nenhuma etapa cadastrada" detail="As corridas publicadas para esta temporada serão listadas aqui." />
          )}
          {archiveSource && <a className="detail-related-link" href={archiveSource}>Fonte do calendário ↗</a>}
        </DetailSection>

        <DetailSection eyebrow="Grid" title="Pilotos inscritos">
          {pilots.status !== "ready" ? (
            <DataFeedback status={pilots.status} subject="pilotos" />
          ) : participants.length ? (
            <div className="detail-card-grid detail-card-grid--pilots">
              {participants.map((pilot) => <PilotCard key={pilot.id} pilot={pilot} seasonId={season.id} />)}
            </div>
          ) : (
            <EmptyState title="Inscrições ainda não publicadas" detail="O grid inscrito nesta temporada será exibido aqui." />
          )}
        </DetailSection>

        {category.status !== "ready" ? <DataFeedback status={category.status} subject="categoria desta temporada" /> : null}
      </div>
    </main>
  );
}
