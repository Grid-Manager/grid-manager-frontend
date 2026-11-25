import Link from "next/link";
import { FooterNavigation, MobileNavigation, PrimaryNavigation } from "@/components/site-navigation";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Grid Manager, página inicial">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="brand-name">GRID MANAGER</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Brand />
        <PrimaryNavigation />
        <Link className="site-header__admin" href="/admin/login">
          Acessar gestão <span aria-hidden="true">↗</span>
        </Link>
        <MobileNavigation />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__top">
        <Brand />
        <FooterNavigation />
      </div>
      <div className="container site-footer__bottom">
        <span>Grid Manager · {new Date().getFullYear()}</span>
        <span>Dados oficiais publicados pela organização.</span>
        <span>Imagem editorial ilustrativa.</span>
      </div>
    </footer>
  );
}
