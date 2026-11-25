"use client";

import Link from "next/link";
import { useState } from "react";
import type { Race } from "@/lib/contracts";
import { formatDate, labelRaceStatus, raceTitle } from "@/lib/format";

const filters = [
  { key: "next", label: "Próximas", empty: "Nenhuma etapa futura agendada." },
  { key: "ongoing", label: "Em andamento", empty: "Nenhuma corrida em andamento." },
  { key: "finished", label: "Finalizadas", empty: "Nenhuma corrida finalizada." },
] as const;

type RaceFilter = (typeof filters)[number]["key"];

export function DashboardRaces({
  races, available, calendarHref,
}: {
  races: Record<RaceFilter, Race[]>;
  available: boolean;
  calendarHref: string;
}) {
  const [active, setActive] = useState<RaceFilter>("next");
  const selected = filters.find((filter) => filter.key === active)!;
  return (
    <section className="dash-panel dash-races" aria-labelledby="dash-races-heading">
      <div className="dash-panel__head">
        <h2 id="dash-races-heading">Calendário</h2>
        <Link href={calendarHref}>Ver calendário <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="dash-filters" role="group" aria-label="Filtrar corridas por status">
        {filters.map((filter) => (
          <button key={filter.key} type="button" aria-pressed={active === filter.key}
            aria-controls="dash-race-list" onClick={() => setActive(filter.key)}>
            {filter.label}
          </button>
        ))}
      </div>
      <div id="dash-race-list" aria-live="polite">
        <div className="dash-panel__change" key={active}>
          {available && races[active].length ? (
            <ul className="dash-race-list">
              {races[active].map((race) => (
                <li key={race.id}>
                  <Link href={`/corridas/${race.id}`}>
                    <time className="mono" dateTime={race.realizationDate}>{formatDate(race.realizationDate)}</time>
                    <strong>{raceTitle(race)}{race.raceType === "SPRINT" ? " · Sprint" : ""}</strong>
                    <span className={`dash-race-status dash-race-status--${race.raceStatus.toLowerCase()}`}>{labelRaceStatus(race.raceStatus)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dash-empty">{available ? selected.empty : "Calendário indisponível."}</p>
          )}
        </div>
      </div>
    </section>
  );
}
