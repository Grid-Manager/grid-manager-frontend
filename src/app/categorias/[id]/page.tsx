import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryFacts, DataFeedback, EmptyState, PilotCard, SeasonCard } from "@/components/data-ui";
import { getAllPages, getEntity } from "@/lib/api";
import { uniqueRoster } from "@/lib/archive-data";
import { categoryHref, countRacesBySeason, seasonsForCategory } from "@/lib/category-scope";
import { getReferenceSources } from "@/lib/reference-data";
import type { Category, Pilot, Race, Season } from "@/lib/contracts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Categoria" };

export default async function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId < 1) notFound();

  const categoryResult = await getEntity<Category>("categories", numericId);
  if (categoryResult.status === "not-found") notFound();
  if (categoryResult.status !== "ready" || !categoryResult.data) {
    return <main id="main-content"><div className="container detail-page"><DataFeedback status={categoryResult.status} subject="categoria" /></div></main>;
  }

  const category = categoryResult.data;
  const [seasons, pilots, races] = await Promise.all([
    getAllPages<Season>("seasons"),
    getAllPages<Pilot>("pilots"),
    getAllPages<Race>("races"),
  ]);
  const categorySeasons = seasonsForCategory(seasons.items, category.id);
  const raceCounts = countRacesBySeason(races.items);
  const latestSeason = categorySeasons[0];
  const currentMembers = new Set(latestSeason?.pilotIds);
  const categoryPilots = uniqueRoster(pilots.items.filter((pilot) => pilot.categoryId === category.id &&
    (!latestSeason || currentMembers.has(pilot.id) || pilot.seasonIds.includes(latestSeason.id))));
  const sources = getReferenceSources(category.id);
  const href = (path: string) => categoryHref(path, category.id);

  return (
    <main id="main-content" className="detail-page category-detail">
      <div className="container">
        <Link className="detail-page-back" href="/categorias">← Categorias</Link>
        <header className="competition-surface competition-identity">
          <div className="competition-identity__title">
            <p className="eyebrow"><span className="eyebrow__mark" />{category.vehicleType === "Moto" ? "Motociclismo" : "Automobilismo"}</p>
            <h1>{category.name}</h1>
          </div>
          {category.acronym.toLowerCase() !== category.name.toLowerCase() && (
            <div className="category-identity__plate" aria-hidden="true"><span className="mono">{category.acronym}</span></div>
          )}
          <nav className="category-identity__nav" aria-label={`Navegação de ${category.name}`}>
            <Link className="competition-link competition-link--primary" href={href("/corridas")}>Calendário <span aria-hidden="true">↗</span></Link>
            <Link className="competition-link" href={href("/resultados")}>Resultados <span aria-hidden="true">↗</span></Link>
            <Link className="competition-link" href={href("/pilotos")}>Pilotos <span aria-hidden="true">↗</span></Link>
            <Link className="competition-link" href={href("/")}>Visão geral <span aria-hidden="true">↗</span></Link>
          </nav>
        </header>

        <div className="category-detail__overview">
          <section className="competition-surface category-facts" aria-labelledby="category-facts-title">
            <h2 id="category-facts-title">Ficha técnica</h2>
            <CategoryFacts category={category} />
          </section>

          <section className="category-detail__seasons" aria-labelledby="category-seasons-title">
            <div className="category-detail__section-head">
              <h2 id="category-seasons-title">Temporadas</h2>
              <Link className="competition-link" href={href("/temporadas")}>Ver todas <span aria-hidden="true">↗</span></Link>
            </div>
            {seasons.status !== "ready" ? (
              <DataFeedback status={seasons.status} subject="temporadas" />
            ) : categorySeasons.length ? (
              <div className="detail-card-grid">
                {categorySeasons.slice(0, 2).map((season) => <SeasonCard category={category} key={season.id} season={season} raceCount={races.status === "ready" ? raceCounts.get(season.id) ?? 0 : undefined} />)}
              </div>
            ) : (
              <EmptyState title="Nenhuma temporada publicada" detail="As temporadas vinculadas a esta categoria serão listadas aqui." />
            )}
          </section>
        </div>

        <section className="category-detail__roster" aria-labelledby="category-roster-title">
          <div className="category-detail__section-head">
            <h2 id="category-roster-title">Pilotos inscritos</h2>
            <Link className="competition-link" href={href("/pilotos")}>Ver todos <span aria-hidden="true">↗</span></Link>
          </div>
          {pilots.status !== "ready" ? (
            <DataFeedback status={pilots.status} subject="pilotos" />
          ) : categoryPilots.length ? (
            <div className="detail-card-grid detail-card-grid--pilots">
              {categoryPilots.slice(0, 6).map((pilot) => <PilotCard key={pilot.id} pilot={pilot} seasonId={latestSeason?.id} />)}
            </div>
          ) : (
            <EmptyState title="Nenhum piloto vinculado" detail="Os pilotos desta categoria serão exibidos quando forem inscritos." />
          )}
        </section>
        {sources.length > 0 && <footer className="dash-sources">
          <h2>Fontes oficiais</h2>
          <p>Temporada 2026 · Consulta em 25 nov 2026.</p>
          <ul>{sources.map(({ label, href }) => <li key={href}><a href={href}>{label} ↗</a></li>)}</ul>
        </footer>}
      </div>
    </main>
  );
}
