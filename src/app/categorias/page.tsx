import type { Metadata } from "next";
import { CategoryCard, DataFeedback, EmptyState, PageHeading } from "@/components/data-ui";
import { getAllPages } from "@/lib/api";
import type { Category } from "@/lib/contracts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Categorias" };

export default async function CategoriesPage() {
  const result = await getAllPages<Category>("categories");
  const groups = [
    { label: "Automobilismo", items: result.items.filter((category) => category.vehicleType !== "Moto") },
    { label: "Motociclismo", items: result.items.filter((category) => category.vehicleType === "Moto") },
  ];

  return (
    <main id="main-content" className="dashboard-list-page">
      <div className="container">
        <PageHeading eyebrow="Competições" title="Categorias" description="Escolha uma categoria para consultar seu grid e suas temporadas." />
        <div className="listing-section">
          <DataFeedback status={result.status} subject="categorias" />
          {result.status === "ready" && !result.items.length && (
            <EmptyState title="Nenhuma categoria disponível" detail="As categorias publicadas pela organização aparecerão aqui." />
          )}
          {groups.filter((group) => group.items.length).map(({ label, items }) => (
            <section aria-label={label} className="catalog-group" key={label}>
              <div className="listing-meta"><h2>{label}</h2><span className="mono">{items.length} {items.length === 1 ? "categoria" : "categorias"}</span></div>
              <div className="category-grid">{items.map((category) => <CategoryCard category={category} key={category.id} />)}</div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
