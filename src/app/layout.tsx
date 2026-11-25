import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageScrollbar } from "@/components/page-scrollbar";
import { SiteChrome } from "@/components/site-chrome";
import "./globals.css";
import "./motorsport.css";
import "./dashboard.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const socialImage = siteUrl ? ["/opengraph-image"] : undefined;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "Grid Manager — Automobilismo em dados",
    template: "%s | Grid Manager",
  },
  description:
    "Consulte categorias, temporadas, corridas, pilotos e resultados do Grid Manager.",
  openGraph: {
    title: "Grid Manager — Automobilismo em dados",
    description:
      "Categorias, temporadas, corridas, pilotos e resultados do Grid Manager.",
    type: "website",
    locale: "pt_BR",
    images: socialImage,
  },
  twitter: {
    card: "summary_large_image",
    title: "Grid Manager — Automobilismo em dados",
    description:
      "Categorias, temporadas, corridas, pilotos e resultados do Grid Manager.",
    images: socialImage,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body id="page-content">
        <a className="skip-link" href="#main-content">
          Ir para o conteúdo
        </a>
        <SiteChrome>{children}</SiteChrome>
        <PageScrollbar />
      </body>
    </html>
  );
}
