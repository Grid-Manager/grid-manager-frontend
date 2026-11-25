import Link from "next/link";
import Image from "next/image";
import type { ApiStatus, Race } from "@/lib/contracts";
import { formatDate } from "@/lib/format";

interface SiteHomeHeroProps {
  race?: Race;
  raceStatus: ApiStatus;
  seasonName?: string;
}

export function SiteHomeHero({ race, raceStatus, seasonName }: SiteHomeHeroProps) {
  return (
    <section className="hero-section" aria-labelledby="home-title">
      <div className="hero-copy">
        <p className="eyebrow hero-copy__eyebrow">
          <span className="eyebrow__mark" />Portal público / automobilismo
        </p>
        <h1 id="home-title">O grid tem<br /><em>história.</em></h1>
        <p className="hero-lead">
          Cada etapa tem um começo. Cada volta muda a disputa. Acompanhe o campeonato de perto.
        </p>
        <div className="hero-actions">
          <Link className="button button--red" href="/corridas">
            Explorar corridas <span aria-hidden="true">↗</span>
          </Link>
          <Link className="text-link hero-secondary-link" href="/resultados">
            Ver resultados <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="hero-topics" aria-label="Conteúdos do Grid Manager">
          <span>Calendário</span><span>Categorias</span><span>Pilotos</span><span>Resultados</span>
        </div>
      </div>
      <figure className="hero-photo">
        <Image
          alt="Piloto de kart contornando uma curva; imagem editorial ilustrativa."
          className="hero-photo__image"
          src="/hero-kart-editorial-v2.webp"
          fill
          priority
          quality={85}
          sizes="(max-width: 760px) 100vw, 56vw"
        />
        <span className="photo-label mono">IMAGEM EDITORIAL ILUSTRATIVA</span>
        <figcaption className="photo-caption">
          <span className="photo-caption__label mono">
            {race ? "PRÓXIMA ETAPA" : raceStatus === "ready" ? "GRID MANAGER / AUTOMOBILISMO" : "PORTAL EM PREPARAÇÃO"}
          </span>
          <strong>{race?.name ?? seasonName ?? "Acompanhe cada etapa."}</strong>
          {race ? <span className="photo-caption__date mono">{formatDate(race.realizationDate)}</span> : null}
        </figcaption>
      </figure>
    </section>
  );
}
