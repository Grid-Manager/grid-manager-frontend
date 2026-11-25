"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

export interface NavigationItem {
  href: string;
  label: string;
}

export const publicNavigation: NavigationItem[] = [
  { href: "/corridas", label: "Calendário" },
  { href: "/temporadas", label: "Campeonatos" },
  { href: "/pilotos", label: "Pilotos" },
  { href: "/categorias", label: "Categorias" },
  { href: "/resultados", label: "Resultados" },
];

export const adminNavigation: NavigationItem = { href: "/admin/login", label: "Gestão" };

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/") ||
    (href === "/admin/login" && pathname.startsWith("/admin"));
}

function NavigationLink({
  item,
  onNavigate,
  category,
}: {
  item: NavigationItem;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
  category?: string;
}) {
  const pathname = usePathname();
  const current = isCurrentPath(pathname, item.href);

  return (
    <Link
      aria-current={current ? "page" : undefined}
      href={category && item.href !== "/categorias" && item.href !== "/admin/login"
        ? { pathname: item.href, query: { categoria: category } }
        : item.href}
      onClick={onNavigate}
    >
      {item.label}
      {onNavigate ? <span aria-hidden="true">↗</span> : null}
    </Link>
  );
}

export function PrimaryNavigation() {
  return (
    <nav className="desktop-nav" aria-label="Navegação principal">
      {publicNavigation.map((item) => <NavigationLink item={item} key={item.href} />)}
    </nav>
  );
}

export function FooterNavigation() {
  return (
    <nav className="footer-nav" aria-label="Navegação do rodapé">
      {[...publicNavigation, adminNavigation].map((item) => <NavigationLink item={item} key={item.href} />)}
    </nav>
  );
}

export function MobileNavigation({
  includeOverview = false, category,
}: { includeOverview?: boolean; category?: string }) {
  const items = includeOverview
    ? [{ href: "/", label: "Visão geral" }, ...publicNavigation, adminNavigation]
    : [...publicNavigation, adminNavigation];
  return (
    <details className="mobile-nav">
      <summary>
        <span>Menu</span>
        <span className="mobile-nav__icon" aria-hidden="true"><i /><i /></span>
      </summary>
      <nav className="mobile-nav__panel" aria-label="Navegação principal">
        {items.map((item) => (
          <NavigationLink
            item={item}
            key={item.href}
            category={category}
            onNavigate={(event) => {
              const summary = event.currentTarget.closest("details");
              summary?.removeAttribute("open");
            }}
          />
        ))}
      </nav>
    </details>
  );
}
