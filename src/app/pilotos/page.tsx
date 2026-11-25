import type { Metadata } from "next";
import Form from "next/form";
import { CategoryPicker, SeasonPicker } from "@/components/category-picker";
import { DataFeedback, EmptyState, PageHeading, Pagination, PilotCard } from "@/components/data-ui";
import { getAllPages } from "@/lib/api";
import { entryNameKey, pilotNameKey, uniqueRoster } from "@/lib/archive-data";
import { getCategorySelection, pageItems, seasonHref, seasonsForCategory } from "@/lib/category-scope";
import type { Pilot, Season } from "@/lib/contracts";
import { pilotRaceNumbers } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pilotos" };

export default async function PilotsPage({ searchParams }: {
  searchParams: Promise<{ page?: string; categoria?: string; temporada?: string; q?: string }>;
}) {
  const query = await searchParams;
  const [{ categories, selected }, data, seasonData] = await Promise.all([
    getCategorySelection(query.categoria), getAllPages<Pilot>("pilots"), getAllPages<Season>("seasons"),
  ]);
  const seasons = seasonsForCategory(seasonData.items, selected?.id);
  const season = query.temporada === "todas" ? undefined : seasons.find((item) => String(item.id) === query.temporada) ?? seasons[0];
  const entered = new Set(season?.pilotIds);
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  const searchKey = entryNameKey(search);
  const pilots = uniqueRoster(data.items.filter((pilot) => pilot.categoryId === selected?.id &&
    (!season || entered.has(pilot.id) || pilot.seasonIds.includes(season.id)) &&
    (!searchKey || pilotNameKey(pilot.name).includes(searchKey) || entryNameKey(pilot.name).includes(searchKey) ||
      pilotRaceNumbers(pilot, season?.id).includes(searchKey))))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const page = pageItems(pilots, query.page, 60);
  const path = seasonHref("/pilotos", selected?.id, season?.id ?? "todas");

  return (
    <main id="main-content" className="dashboard-list-page portal-catalog">
      <div className="container">
        <PageHeading title="Pilotos" description="Encontre um piloto pelo nome ou pelo número." />
        <section className="listing-section" aria-label="Pilotos por categoria">
          <div className="catalog-filters competition-surface">
            <CategoryPicker action="/pilotos" categories={categories} selected={selected} />
            <SeasonPicker action="/pilotos" categoryId={selected?.id} seasons={seasons} selected={season?.id} includeAll />
            <Form className="category-picker pilot-search" action="/pilotos">
              {selected && <input type="hidden" name="categoria" value={selected.id} />}
              <input type="hidden" name="temporada" value={season?.id ?? "todas"} />
              <label htmlFor="pilot-search">Nome ou número</label>
              <input id="pilot-search" key={search} type="search" name="q" defaultValue={search} maxLength={100} />
              <button type="submit">Buscar</button>
            </Form>
            <span className="catalog-count mono">{pilots.length} {pilots.length === 1 ? "piloto" : "pilotos"}</span>
          </div>
          {data.status !== "ready" ? <DataFeedback status={data.status} subject="pilotos" /> : page.content.length ? (
            <div className="pilot-grid">
              {page.content.map((pilot) => <PilotCard key={pilot.id} pilot={pilot} seasonId={season?.id} />)}
            </div>
          ) : search ? <EmptyState title="Nenhum piloto encontrado" detail="Confira o nome ou selecione outra temporada." href={path} linkLabel="Limpar busca" />
            : <EmptyState title="Nenhum piloto disponível" detail="Os pilotos da categoria serão exibidos aqui." />}
          <Pagination path={search ? `${path}&q=${encodeURIComponent(search)}` : path} page={page.page} totalPages={page.totalPages} />
        </section>
      </div>
    </main>
  );
}
