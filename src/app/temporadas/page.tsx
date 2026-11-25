import type { Metadata } from "next";
import { CategoryPicker } from "@/components/category-picker";
import { DataFeedback, EmptyState, PageHeading, Pagination, SeasonCard } from "@/components/data-ui";
import { getAllPages } from "@/lib/api";
import { categoryHref, countRacesBySeason, getCategorySelection, pageItems, seasonsForCategory } from "@/lib/category-scope";
import type { Race, Season } from "@/lib/contracts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Temporadas" };

export default async function SeasonsPage({ searchParams }: {
  searchParams: Promise<{ page?: string; categoria?: string }>;
}) {
  const query = await searchParams;
  const [{ categories, selected }, data, races] = await Promise.all([
    getCategorySelection(query.categoria), getAllPages<Season>("seasons"), getAllPages<Race>("races"),
  ]);
  const seasons = seasonsForCategory(data.items, selected?.id);
  const raceCounts = countRacesBySeason(races.items);
  const page = pageItems(seasons, query.page, 24);

  return (
    <main id="main-content" className="dashboard-list-page portal-catalog">
      <div className="container">
        <PageHeading title="Temporadas" description="Escolha um ano para ver o calendário e a classificação." />
        <section className="listing-section" aria-label="Temporadas por categoria">
          <div className="catalog-filters competition-surface">
            <CategoryPicker action="/temporadas" categories={categories} selected={selected} />
            <span className="catalog-count mono">{seasons.length} {seasons.length === 1 ? "temporada" : "temporadas"}</span>
          </div>
          {data.status !== "ready" ? <DataFeedback status={data.status} subject="temporadas" /> : page.content.length ? (
            <div className="season-grid season-grid--light">
              {page.content.map((season) => <SeasonCard category={selected} season={season} key={season.id} raceCount={races.status === "ready" ? raceCounts.get(season.id) ?? 0 : undefined} />)}
            </div>
          ) : <EmptyState title="Nenhuma temporada disponível" detail="As temporadas da categoria serão exibidas aqui." />}
          <Pagination path={categoryHref("/temporadas", selected?.id)} page={page.page} totalPages={page.totalPages} />
        </section>
      </div>
    </main>
  );
}
