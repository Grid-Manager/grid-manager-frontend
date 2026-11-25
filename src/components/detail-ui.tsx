import Link from "next/link";
import type { ReactNode } from "react";
import type { Pilot, Race, RaceResult } from "@/lib/contracts";
import { categoryHref, seasonHref } from "@/lib/category-scope";
import { formatDate, formatDecimal, formatPosition, labelPilotStatus, raceTitle } from "@/lib/format";
import { groupRaceResults } from "@/lib/standings";

export function DetailSection({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="detail-section">
      <div className="detail-section__heading">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ResultList({
  results,
  pilotsById,
  racesById,
  seasonId,
}: {
  results: RaceResult[];
  pilotsById: Map<number, Pilot>;
  racesById?: Map<number, Race>;
  seasonId?: number;
}) {
  return (
    <ol className="result-list">
      {groupRaceResults(results).map((entries) => {
        const result = entries[0];
        const race = racesById?.get(result.raceId);
        const pilot = pilotsById.get(result.pilotId);

        return (
          <li className="result-row" key={result.id}>
            <span className="result-row__position mono">{formatPosition(result.position)}</span>
            <div>
              <ResultParticipants entries={entries} pilotsById={pilotsById} seasonId={race?.seasonId ?? seasonId} />
              {racesById && <span className="result-row__race">
                {race ? (
                  <Link href={categoryHref("/corridas/" + race.id, pilot?.categoryId)}>{raceTitle(race)}{race.raceType === "SPRINT" ? " · Sprint" : ""} · {formatDate(race.realizationDate)}</Link>
                ) : "Corrida não disponível"}
              </span>}
            </div>
            <span className="result-row__points mono">
              {result.points !== null && <span>{formatDecimal(result.points)} pts</span>}
              <small className="results-status" data-status={result.raceStatusPilot}>{labelPilotStatus(result.raceStatusPilot)}</small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function ResultParticipants({ entries, pilotsById, seasonId }: {
  entries: RaceResult[];
  pilotsById: Map<number, Pilot>;
  seasonId?: number;
}) {
  const crew = entries[0]?.crew;
  return (
    <div className="result-participants">
      {crew && <span className="result-participants__crew">#{crew.number} · {crew.team}</span>}
      <span className="result-participants__drivers">
        {entries.map((entry, index) => {
          const pilot = pilotsById.get(entry.pilotId);
          return (
            <span key={entry.id}>
              {index > 0 && " · "}
              {pilot ? <Link href={seasonHref("/pilotos/" + pilot.id, pilot.categoryId, seasonId)}>{pilot.name}</Link> : "Piloto não disponível"}
            </span>
          );
        })}
      </span>
    </div>
  );
}
