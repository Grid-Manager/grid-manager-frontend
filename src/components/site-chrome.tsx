"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Brand, SiteFooter, SiteHeader } from "@/components/site-shell";
import { MobileNavigation, publicNavigation } from "@/components/site-navigation";

const dashboardNavigation = [{ href: "/", label: "Visão geral" }, ...publicNavigation];

function SidebarLinks({ category }: { category?: string }) {
  const pathname = usePathname();
  return <nav aria-label="Painel esportivo">
    {dashboardNavigation.map(({ href, label }) => {
      const active = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
      const target = category && href !== "/categorias" ? { pathname: href, query: { categoria: category } } : href;
      return <Link key={href} href={target} aria-current={active ? "page" : undefined}>
        {label}<span aria-hidden="true">↗</span>
      </Link>;
    })}
  </nav>;
}

function ScopedNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const category = pathname.match(/^\/categorias\/(\d+)$/)?.[1] ?? search.get("categoria") ?? undefined;
  return mobile ? <MobileNavigation includeOverview category={category} /> : <SidebarLinks category={category} />;
}

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return <><SiteHeader /><div className="page-shell">{children}</div><SiteFooter /></>;
  }
  if (pathname.startsWith("/admin")) return <div className="page-shell">{children}</div>;

  return <div className="dashboard-shell page-shell">
    <aside className="dashboard-sidebar" aria-label="Grid Manager">
      <Brand />
      <Suspense fallback={<SidebarLinks />}><ScopedNavigation /></Suspense>
      <Link className="dashboard-sidebar__admin" href="/admin/login">Acessar gestão <span aria-hidden="true">↗</span></Link>
    </aside>
    <div className="dashboard-content">
      <div className="dashboard-mesh" aria-hidden="true" />
      <header className="dashboard-mobile site-header">
        <Brand />
        <Suspense fallback={<MobileNavigation includeOverview />}><ScopedNavigation mobile /></Suspense>
      </header>
      {children}
    </div>
  </div>;
}
