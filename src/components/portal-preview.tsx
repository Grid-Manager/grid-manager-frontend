import Image from "next/image";
import Link from "next/link";

const destinations = [
  { title: "Categorias", detail: "Veículos e especificações de cada grid", href: "/categorias" },
  { title: "Temporadas", detail: "Etapas e classificação por campeonato", href: "/temporadas" },
  { title: "Pilotos", detail: "Números, categorias e participações", href: "/pilotos" },
] as const;

export function PortalPreview() {
  return (
    <>
      <section className="preview-story" aria-labelledby="preview-story-title">
        <div className="container preview-story__layout">
          <div className="preview-story__copy">
            <span className="preview-kicker mono"><i aria-hidden="true" /> CALENDÁRIO</span>
            <h2 id="preview-story-title">Tudo começa<br />na <em>largada.</em></h2>
            <p>Consulte as datas e acompanhe o andamento de cada etapa publicada pela organização.</p>
            <Link className="preview-story__link" href="/corridas">Ver calendário <span aria-hidden="true">↗</span></Link>
          </div>
          <figure className="preview-story__photo">
            <Image
              src="/kart-detail-editorial.webp"
              alt="Detalhe ilustrativo de um kart sendo preparado antes de uma corrida."
              fill
              sizes="(max-width: 800px) 100vw, 45vw"
            />
            <figcaption className="mono">IMAGEM EDITORIAL ILUSTRATIVA</figcaption>
          </figure>
        </div>
      </section>

      <section className="preview-grid" aria-labelledby="preview-grid-title">
        <div className="container preview-grid__layout">
          <div className="preview-grid__intro">
            <h2 id="preview-grid-title">Conheça <em>o grid.</em></h2>
            <p>Os registros oficiais aparecem nas respectivas páginas assim que estiverem disponíveis.</p>
          </div>
          <nav className="preview-grid__links" aria-label="Explorar o campeonato">
            {destinations.map((item) => (
              <Link href={item.href} key={item.href}>
                <span className="preview-grid__link-copy">
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                <span className="preview-grid__arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </>
  );
}
