import Link from "next/link";
import type {
  ApiStatus,
  Category,
  Pilot,
  Race,
  Season,
} from "@/lib/contracts";
import { formatDate, formatDecimal, labelRaceStatus, pilotRaceNumbers, raceSession, raceTitle, seasonPeriod } from "@/lib/format";
import { categoryHref, seasonHref } from "@/lib/category-scope";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  inverted?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel,
  inverted = false,
}: SectionHeadingProps) {
  return (
    <div className={"section-heading" + (inverted ? " section-heading--inverted" : "")}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <p className="section-copy">{description}</p> : null}
      </div>
      {href && linkLabel ? (
        <Link className="text-link" href={href}>
          {linkLabel} <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <header className="page-heading">
      {eyebrow && <p className="eyebrow"><span className="eyebrow__mark" />{eyebrow}</p>}
      <h1>{title}</h1>
      <p className="page-heading__copy">{description}</p>
    </header>
  );
}

export function DataFeedback({
  status,
  subject,
  inverted = false,
}: {
  status: ApiStatus;
  subject: string;
  inverted?: boolean;
}) {
  if (status === "ready") return null;

  const message =
    status === "not-configured"
      ? "Os dados de " + subject + " ainda não estão disponíveis no portal."
      : "Não foi possível carregar os dados de " + subject + " agora.";

  return (
    <p className={"data-feedback" + (inverted ? " data-feedback--inverted" : "")} role="status">
      <span>{message}</span>
    </p>
  );
}

export function EmptyState({
  title,
  detail,
  href,
  linkLabel,
  inverted = false,
}: {
  title: string;
  detail: string;
  href?: string;
  linkLabel?: string;
  inverted?: boolean;
}) {
  return (
    <div className={"empty-state" + (inverted ? " empty-state--inverted" : "")}>
      <span className="empty-state__marker" aria-hidden="true" />
      <div>
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
      {href && linkLabel ? <Link className="text-link" href={href}>{linkLabel} →</Link> : null}
    </div>
  );
}

export function StatBlock({
  label,
  count,
  href,
}: {
  label: string;
  count?: number;
  href: string;
}) {
  return (
    <Link className="stat-block" href={href}>
      <span className="stat-block__count mono">{count === undefined ? "—" : count}</span>
      <span className="stat-block__label">{label}</span>
      <span className="stat-block__arrow" aria-hidden="true">↗</span>
    </Link>
  );
}

export function Pagination({
  path,
  page,
  totalPages,
}: {
  path: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages < 2) return null;

  const pageHref = (target: number) => path + (path.includes("?") ? "&" : "?") + "page=" + target;
  return (
    <nav className="pagination" aria-label="Paginação">
      {page > 0 ? (
        <Link href={pageHref(page - 1)}>← Anterior</Link>
      ) : (
        <span aria-disabled="true">← Anterior</span>
      )}
      <span className="pagination__current mono">
        {page + 1} / {totalPages}
      </span>
      {page + 1 < totalPages ? (
        <Link href={pageHref(page + 1)}>Próxima →</Link>
      ) : (
        <span aria-disabled="true">Próxima →</span>
      )}
    </nav>
  );
}

export function CategoryCard({
  category,
  editorialIndex,
}: {
  category: Category;
  editorialIndex?: number;
}) {
  return (
    <Link
      className={"entity-card category-card" + (editorialIndex ? " category-card--editorial" : "")}
      href={"/categorias/" + category.id}
    >
      {editorialIndex ? <span className="category-card__index mono">{String(editorialIndex).padStart(2, "0")}</span> : null}
      <span className="entity-card__code mono">{category.acronym}</span>
      <h3>{category.name}</h3>
      <p>{category.vehicleType} <span aria-hidden="true">/</span> {category.propulsionType}</p>
      <span className="entity-card__arrow" aria-hidden="true">↗</span>
    </Link>
  );
}

export function SeasonCard({
  season,
  category,
  raceCount,
}: {
  season: Season;
  category?: Category;
  raceCount?: number;
}) {
  const period = seasonPeriod(season);
  return (
    <Link className="entity-card season-card" href={categoryHref("/temporadas/" + season.id, season.categoryId)}>
      <h3 className="mono">{period}</h3>
      <div className="season-card__meta">
        {season.name !== category?.name && !season.name.includes(period) && <span>{season.name}</span>}
        {raceCount !== undefined && <span>{raceCount} {raceCount === 1 ? "corrida" : "corridas"}</span>}
      </div>
      <span className="entity-card__arrow" aria-hidden="true">↗</span>
    </Link>
  );
}

export function PilotCard({
  pilot,
  seasonId,
}: {
  pilot: Pilot;
  seasonId?: number;
}) {
  const numbers = pilotRaceNumbers(pilot, seasonId);
  return (
    <Link className="entity-card pilot-card" href={seasonHref("/pilotos/" + pilot.id, pilot.categoryId, seasonId)}>
      {numbers.length > 0 && <span className="pilot-card__number mono">{numbers.map((number) => "#" + number).join(" · ")}</span>}
      <h3>{pilot.name}</h3>
      <span className="entity-card__arrow" aria-hidden="true">↗</span>
    </Link>
  );
}

export function RaceCard({
  race,
  season,
  category,
}: {
  race: Race;
  season?: Season;
  category?: Category;
}) {
  const session = raceSession(race);
  return (
    <Link className="race-card" href={categoryHref("/corridas/" + race.id, category?.id ?? season?.categoryId)}>
      <div className="race-card__meta">
        <time className="mono" dateTime={race.realizationDate}>{formatDate(race.realizationDate)}</time>
        <span className={"status-dot status-dot--" + race.raceStatus.toLowerCase()}>
          {labelRaceStatus(race.raceStatus)}
        </span>
      </div>
      <h3>{raceTitle(race)}</h3>
      <div className="race-card__foot">
        {session !== "Corrida" && <span>{session}</span>}
        <span className="race-card__arrow" aria-hidden="true">↗</span>
      </div>
    </Link>
  );
}

export function DetailMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="detail-metric">
      <span>{label}</span>
      <strong className="mono">{value}</strong>
    </div>
  );
}

export function CategoryFacts({ category }: { category: Category }) {
  const facts = [
    { label: "Tipo de veículo", value: category.vehicleType },
    { label: "Propulsão", value: category.propulsionType },
    { label: "Motor", value: category.engineDescription },
    { label: "Potência", value: category.horsePower ? formatDecimal(category.horsePower) + " hp" : null },
    { label: "Fornecedor de pneus", value: category.tireSupplier === "Não informado" ? null : category.tireSupplier },
    { label: "Entidade reguladora", value: category.governingBody },
    { label: "Ano de estreia", value: category.foundingYear },
    { label: "Formato de licença", value: category.licensePattern },
  ];
  return (
    <dl className="category-facts__grid">
      {facts.filter((fact) => fact.value).map(({ label, value }) => (
        <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
      ))}
    </dl>
  );
}
