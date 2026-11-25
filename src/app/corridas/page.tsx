import type { Metadata } from "next";
import { CategoryPicker, SeasonPicker } from "@/components/category-picker";
import { DataFeedback, EmptyState, PageHeading, Pagination, RaceCard } from "@/components/data-ui";
import { getAllPages } from "@/lib/api";
import { getCategorySelection, pageItems, seasonHref, seasonsForCategory } from "@/lib/category-scope";
import type { Race, Season } from "@/lib/contracts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Corridas" };

export default async function RacesPage({ searchParams }: {
  searchParams: Promise<{ page?: string; categoria?: string; temporada?: string }>;
}) {
  const query = await searchParams;
  const [{ categories, selected }, raceData, seasonData] = await Promise.all([
    getCategorySelection(query.categoria), getAllPages<Race>("races"), getAllPages<Season>("seasons"),
  ]);
  const seasons = seasonsForCategory(seasonData.items, selected?.id);
  const season = seasons.find((item) => String(item.id) === query.temporada) ?? seasons[0];
  const races = raceData.items.filter((race) => race.seasonId === season?.id);
  const upcoming = races.filter((race) => race.raceStatus !== "FINISHED")
    .sort((a, b) => a.realizationDate.localeCompare(b.realizationDate));
  const finished = races.filter((race) => race.raceStatus === "FINISHED")
    .sort((a, b) => b.realizationDate.localeCompare(a.realizationDate));
  const status = raceData.status === "ready" ? seasonData.status : raceData.status;
  const page = pageItems([...upcoming, ...finished], query.page, 24);
  const groups = [
    { label: "Próximas corridas", races: page.content.filter((race) => race.raceStatus !== "FINISHED") },
    { label: "Corridas realizadas", races: page.content.filter((race) => race.raceStatus === "FINISHED") },
  ];

  return (
    <main id="main-content" className="dashboard-list-page portal-catalog">
      <div className="container">
        <PageHeading title="Calendário" description="Encontre as próximas corridas e consulte as etapas já disputadas." />
        <section className="listing-section" aria-label="Corridas por categoria">
          <div className="catalog-filters competition-surface">
            <CategoryPicker action="/corridas" categories={categories} selected={selected} />
            <SeasonPicker action="/corridas" categoryId={selected?.id} seasons={seasons} selected={season?.id} />
            <span className="catalog-count mono">{races.length} {races.length === 1 ? "corrida" : "corridas"}</span>
          </div>
          {status !== "ready" ? <DataFeedback status={status} subject="corridas" /> : page.content.length ? (
            groups.filter((group) => group.races.length).map((group) => (
              <div className="calendar-group" key={group.label}>
                <h2>{group.label}</h2>
                <div className="race-grid">
                  {group.races.map((race) => <RaceCard category={selected} key={race.id} race={race} season={season} />)}
                </div>
              </div>
            ))
          ) : <EmptyState title="Nenhuma corrida disponível" detail="As etapas da categoria serão exibidas aqui." />}
          <Pagination path={seasonHref("/corridas", selected?.id, season?.id)} page={page.page} totalPages={page.totalPages} />
        </section>
      </div>
    </main>
  );
}
