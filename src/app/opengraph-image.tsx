import { ImageResponse } from "next/og";

export const alt = "Grid Manager — Automobilismo em dados";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "58px 68px",
          backgroundColor: "#F4F3EF",
          color: "#111315",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 24, fontWeight: 700 }}>
          <div
            style={{
              width: 32,
              height: 32,
              display: "flex",
              backgroundColor: "#111315",
              borderTop: "6px solid #E03A30",
            }}
          />
          GRID MANAGER
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ width: 70, height: 8, backgroundColor: "#E03A30" }} />
          <div style={{ maxWidth: 880, fontSize: 76, fontWeight: 700, lineHeight: 1.02, letterSpacing: -4 }}>
            Automobilismo em dados.
          </div>
          <div style={{ color: "#62676A", fontSize: 26 }}>
            Corridas · temporadas · pilotos · resultados
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 18,
            borderTop: "1px solid rgba(17,19,21,.2)",
            color: "#62676A",
            fontSize: 17,
          }}
        >
          <span>Grid Manager</span>
          <span>Portal público</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
