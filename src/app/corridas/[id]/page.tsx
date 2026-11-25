import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataFeedback, EmptyState } from "@/components/data-ui";
import { DetailSection, ResultList } from "@/components/detail-ui";
import { getAllPages, getEntity, getPortalSource } from "@/lib/api";
import { getArchivedSeasonSource } from "@/lib/archive-data";
import { categoryHref, seasonHref } from "@/lib/category-scope";
import type { Category, Pilot, Race, RaceResult, Season } from "@/lib/contracts";
import { formatDate, formatDecimal, labelRaceStatus, raceSession, raceTitle, seasonPeriod } from "@/lib/format";
import { compareRaceResults } from "@/lib/standings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Corrida" };

export default async function RaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId < 1) notFound();

  const raceResult = await getEntity<Race>("races", numericId);
  if (raceResult.status === "not-found") notFound();
  if (raceResult.status !== "ready" || !raceResult.data) {
    return <main id="main-content"><div className="container detail-page"><DataFeedback status={raceResult.status} subject="corrida" /></div></main>;
  }

  const race = raceResult.data;
  const [season, pilots, results, source] = await Promise.all([
    getEntity<Season>("seasons", race.seasonId),
    getAllPages<Pilot>("pilots"),
    getAllPages<RaceResult>("results"),
    getPortalSource(),
  ]);
  const category = season.data
    ? await getEntity<Category>("categories", season.data.categoryId)
    : null;
  const raceResults = results.items
    .filter((result) => result.raceId === race.id)
    .sort(compareRaceResults);
  const pilotsById = new Map(pilots.items.map((pilot) => [pilot.id, pilot]));
  const description = [...new Set([category?.data?.name, season.data && seasonPeriod(season.data)])].filter(Boolean).join(" · ");
  const archiveSource = source.kind === "reference" ? getArchivedSeasonSource(race.seasonId) : undefined;
  const startTime = race.startTime?.split("T").at(-1)?.slice(0, 5);

  return (
    <main id="main-content" className="detail-page race-detail">
      <div className="container">
        <Link className="detail-page-back" href={seasonHref("/corridas", season.data?.categoryId, race.seasonId)}>← Calendário</Link>
        <header className="competition-surface competition-identity">
          <div className="competition-identity__title">
            <h1>{raceTitle(race)}</h1>
            {description && <p>{description}</p>}
          </div>
        </header>

        <section className="competition-surface race-info" aria-labelledby="race-info-title">
          <div className="race-info__head">
            <h2 id="race-info-title">Informações da corrida</h2>
            {season.data && <Link className="competition-link" href={categoryHref(`/temporadas/${season.data.id}`, season.data.categoryId)}>Ver temporada <span aria-hidden="true">↗</span></Link>}
          </div>
          <dl className="race-info__facts">
            <div><dt>Data</dt><dd><time dateTime={race.realizationDate}>{formatDate(race.realizationDate)}</time></dd></div>
            <div><dt>Status</dt><dd>{labelRaceStatus(race.raceStatus)}</dd></div>
            <div><dt>Formato</dt><dd>{raceSession(race)}</dd></div>
            {startTime && <div><dt>{source.kind === "reference" ? "Início (hora da pista)" : "Início"}</dt><dd className="mono">{startTime}</dd></div>}
            {race.laps != null && <div><dt>Voltas</dt><dd className="mono">{race.laps}</dd></div>}
            {race.circuitLength != null && <div><dt>Extensão</dt><dd className="mono">{formatDecimal(race.circuitLength)} km</dd></div>}
            {race.hasSafetyCar != null && <div><dt>Safety Car</dt><dd>{race.hasSafetyCar ? race.safetyCarLaps == null ? "Sim" : `Sim · ${race.safetyCarLaps} voltas` : "Não"}</dd></div>}
            {race.fastLap && <div><dt>Volta mais rápida</dt><dd className="mono">{race.fastLap}</dd></div>}
          </dl>
        </section>

        <DetailSection title="Resultado da etapa">
          {results.status !== "ready" ? (
            <DataFeedback status={results.status} subject="resultados" />
          ) : pilots.status !== "ready" ? (
            <DataFeedback status={pilots.status} subject="pilotos" />
          ) : raceResults.length ? (
            <ResultList pilotsById={pilotsById} results={raceResults} seasonId={race.seasonId} />
          ) : race.raceStatus === "SCHEDULED" ? (
            <EmptyState title="Corrida agendada" detail="A classificação será exibida quando estiver disponível." />
          ) : (
            <EmptyState title="Resultado indisponível no portal" detail={archiveSource ? "Consulte a fonte da temporada para mais detalhes da prova." : "A classificação aparece aqui após ser registrada pela organização."} />
          )}
          {race.resultSource
            ? <a className="detail-related-link" href={race.resultSource}>Fonte da classificação ↗</a>
            : archiveSource && <a className="detail-related-link" href={archiveSource}>Fonte da etapa ↗</a>}
        </DetailSection>

        {season.status !== "ready" ? <DataFeedback status={season.status} subject="temporada desta corrida" /> : null}
        {season.data && category?.status !== "ready" ? <DataFeedback status={category?.status ?? "unavailable"} subject="categoria desta temporada" /> : null}
      </div>
    </main>
  );
}
