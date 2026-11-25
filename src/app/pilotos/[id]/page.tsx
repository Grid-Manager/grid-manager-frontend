import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataFeedback, EmptyState, Pagination } from "@/components/data-ui";
import { DetailSection, ResultList } from "@/components/detail-ui";
import { PilotPortrait } from "@/components/pilot-portrait";
import { getAllPages, getEntity, getPortalSource } from "@/lib/api";
import { getArchivedPilotProfile, pilotNameKey } from "@/lib/archive-data";
import { categoryHref, pageItems, seasonHref } from "@/lib/category-scope";
import type { Category, Pilot, Race, RaceResult, Season } from "@/lib/contracts";
import { formatDecimal, pilotRaceNumbers, seasonPeriod } from "@/lib/format";
import portraitsJson from "@/lib/pilot-portraits.json";
import { getReferenceStandings } from "@/lib/reference-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Piloto" };

const portraits: Record<string, string[]> = portraitsJson;

export default async function PilotDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; temporada?: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId < 1) notFound();

  const pilotResult = await getEntity<Pilot>("pilots", numericId);
  if (pilotResult.status === "not-found") notFound();
  if (pilotResult.status !== "ready" || !pilotResult.data) {
    return <main id="main-content"><div className="container detail-page"><DataFeedback status={pilotResult.status} subject="piloto" /></div></main>;
  }

  const pilot = pilotResult.data;
  const [categories, seasons, allRaces, allResults, profiles, source, query] = await Promise.all([
    getAllPages<Category>("categories"),
    getAllPages<Season>("seasons"),
    getAllPages<Race>("races"),
    getAllPages<RaceResult>("results"),
    getAllPages<Pilot>("pilots"),
    getPortalSource(),
    searchParams,
  ]);
  const categoryNames = new Map(categories.items.map((item) => [item.id, item.name]));
  const categoryName = categoryNames.get(pilot.categoryId);
  const reference = source.kind === "reference";
  const nameKey = pilotNameKey(pilot.name);
  const profile = reference ? getArchivedPilotProfile(pilot.id) : undefined;
  const photo = reference ? (profile ? portraits[profile] : undefined) ?? portraits[nameKey] : undefined;
  const matches = reference ? profiles.items.filter((item) => pilotNameKey(item.name) === nameKey) : [pilot];
  const articleTitles = new Set(matches.map((item) => getArchivedPilotProfile(item.id)).filter(Boolean));
  const career = matches.filter((item) => item.id === pilot.id || articleTitles.size < 2 ||
    (profile && getArchivedPilotProfile(item.id) === profile));
  const byCategory = new Map(career.map((item) => [item.categoryId, item]));
  const careerIds = new Set(career.map((item) => item.id));
  const careerSeasonIds = new Set(career.flatMap((item) => item.seasonIds));
  const racesById = new Map(allRaces.items.map((race) => [race.id, race]));
  const pilotSeasons = seasons.items.filter(
    (season) => byCategory.has(season.categoryId) && (
      careerSeasonIds.has(season.id) || season.pilotIds.some((id) => careerIds.has(id))
    ),
  ).sort((a, b) => b.year - a.year);
  const shownSeason = pilotSeasons.find((season) => season.categoryId === pilot.categoryId && String(season.id) === query.temporada);
  const numbers = pilotRaceNumbers(pilot, shownSeason?.id);
  const pilotResults = allResults.items
    .filter((result) => result.pilotId === pilot.id)
    .sort((a, b) => (racesById.get(b.raceId)?.realizationDate ?? "").localeCompare(racesById.get(a.raceId)?.realizationDate ?? ""));
  const pilotsById = new Map([[pilot.id, pilot]]);
  const resultPage = pageItems(pilotResults, query.page, 24);

  return (
    <main id="main-content" className="detail-page pilot-detail">
      <div className="container">
        <Link className="detail-page-back" href={seasonHref("/pilotos", pilot.categoryId, shownSeason?.id)}>← Pilotos</Link>
        <header className="competition-surface pilot-identity">
          <PilotPortrait key={pilot.id} name={pilot.name} photo={photo?.length === 2 ? [photo[0], photo[1]] : undefined} />
          <div className="pilot-identity__info">
            {numbers.length > 0 && <span className="pilot-identity__number mono">{numbers.map((number) => "#" + number).join(" · ")}{shownSeason && ` · ${seasonPeriod(shownSeason)}`}</span>}
            <h1>{pilot.name}</h1>
            {categoryName && <Link className="competition-link" href={`/categorias/${pilot.categoryId}`}>{categoryName} <span aria-hidden="true">↗</span></Link>}
          </div>
        </header>

        <DetailSection eyebrow="Histórico" title="Temporadas disputadas">
          {seasons.status !== "ready" ? (
            <DataFeedback status={seasons.status} subject="temporadas" />
          ) : pilotSeasons.length ? (
            <div className="pilot-season-list">
              {pilotSeasons.map((season) => {
                const member = byCategory.get(season.categoryId);
                const row = reference ? getReferenceStandings(season.id)?.find((item) => item.pilot.id === member?.id) : undefined;
                return (
                  <Link className="pilot-season-row" href={categoryHref(`/temporadas/${season.id}`, season.categoryId)} key={season.id}>
                    <span className="mono">{seasonPeriod(season)}</span>
                    <strong>{season.name}</strong>
                    <span className="pilot-season-stats mono">{row ? `${row.position}º · ${formatDecimal(row.points)} pts` : "—"}</span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Nenhuma temporada vinculada" detail="As inscrições publicadas para este piloto serão exibidas aqui." />
          )}
        </DetailSection>

        <DetailSection eyebrow={categoryName ?? "Resultados"} title="Histórico na pista">
          {allResults.status !== "ready" ? (
            <DataFeedback status={allResults.status} subject="resultados" />
          ) : allRaces.status !== "ready" ? (
            <DataFeedback status={allRaces.status} subject="corridas" />
          ) : pilotResults.length ? (
            <>
              <ResultList pilotsById={pilotsById} racesById={racesById} results={resultPage.content} />
              <Pagination path={seasonHref(`/pilotos/${pilot.id}`, pilot.categoryId, shownSeason?.id)} page={resultPage.page} totalPages={resultPage.totalPages} />
            </>
          ) : (
            <EmptyState title="Sem resultados publicados" detail="As classificações deste piloto aparecem quando forem registradas pela organização." />
          )}
        </DetailSection>

      </div>
    </main>
  );
}
