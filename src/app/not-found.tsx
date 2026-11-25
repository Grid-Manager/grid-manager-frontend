import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="not-found-page">
      <div className="container">
        <p className="eyebrow"><span className="eyebrow__mark" />Sinalização / 404</p>
        <h1>Essa etapa<br /><em>não está no mapa.</em></h1>
        <p>O endereço pode ter mudado ou o conteúdo não está disponível.</p>
        <Link className="button button--red" href="/corridas">Voltar ao calendário <span aria-hidden="true">↗</span></Link>
      </div>
    </main>
  );
}
