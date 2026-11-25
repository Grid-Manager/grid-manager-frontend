"""Import 2026 Grand Prix classifications from saved race report pages."""

import argparse
import json
from itertools import groupby
from pathlib import Path
from urllib.parse import quote

from bs4 import BeautifulSoup


CATEGORIES = {"MotoGP": 900008, "Moto2": 900009, "Moto3": 900010}
STATUSES = {"Ret": "DNF", "NC": "NC", "DSQ": "DSQ", "EX": "DSQ", "DNS": "DNS", "WD": "DNS"}
SPANISH_REPORTS = {
    12: "Gran_Bretaña", 13: "Aragón", 14: "San_Marino", 15: "Austria", 17: "Indonesia",
    19: "Malasia", 20: "Catar", 21: "Portugal",
}
SPANISH_SECTIONS = {
    "Carrera al sprint": "MotoGP Sprint", "Carrera larga": "MotoGP", "Carrera": "MotoGP",
    "Resultados Moto2": "Moto2", "Resultados Moto3": "Moto3",
}
CORRECTIONS = {
    # https://www.motogp.com/en/news/2026/03/29/moto2-agius-sort-vainqueur-dune-course-mouvementee-a-austin/1013864
    ("2026_United_States_motorcycle_Grand_Prix", "Moto2", "Celestino Vietti"): {"position": 2},
    # https://es.wikipedia.org/wiki/Gran_Premio_de_Francia_de_Motociclismo_de_2026#Resultados_Moto2
    ("2026_French_motorcycle_Grand_Prix", "Moto2", "Joe Roberts"): {"number": "16"},
    # https://www.racesport.nl/wp-content/uploads/2026/05/07ITA26_MOTOGP_MOTO3_RACE.pdf
    ("2026_Italian_motorcycle_Grand_Prix", "Moto3", "Joel Kelso"): {"number": "66"},
    # https://asianmotorsport.com/bezzecchi-leads-historic-aprilia-sweep-in-indonesia-as-martin-retakes-motogp-lead/
    ("Gran_Premio_de_Indonesia_de_Motociclismo_de_2026", "Moto2", "Joe Roberts"): {"status": "DNS"},
}


def read_html(path):
    return BeautifulSoup(path.read_bytes(), "html.parser")


def cell_text(cell):
    for annotation in cell.select("sup.reference, sup[typeof='mw:Extension/ref']"):
        annotation.decompose()
    return cell.get_text(" ", strip=True)


def classifications(soup, url):
    for table in soup.select("table.wikitable"):
        columns = table.tr.find_all(["th", "td"], recursive=False)
        headers = [cell.get_text(" ", strip=True).lower() for cell in columns]
        if headers[:3] not in (["pos.", "no.", "rider"], ["pos.", "n.º", "piloto"]):
            continue
        if headers[-1] not in {"points", "puntos"}:
            continue
        heading = table.find_previous(["h2", "h3", "h4"])
        name = heading.get_text(" ", strip=True)
        session = SPANISH_SECTIONS.get(name, name)
        category = session.removesuffix(" Sprint")
        if category not in CATEGORIES:
            continue
        race_type = "SPRINT" if session == "MotoGP Sprint" else "STANDARD"
        entries = []
        for row in table.select("tr")[1:]:
            cells = row.find_all(["th", "td"], recursive=False)
            if len(cells) != len(headers):
                continue
            place, number, driver = map(cell_text, cells[:3])
            points = cell_text(cells[-1]).replace(",", ".")
            position = int(place) if place.isdigit() else None
            correction = CORRECTIONS.get((url.rsplit("/", 1)[-1], category, driver), {})
            entries.append({
                "position": position,
                "drivers": [driver],
                "status": "FINISHED" if position is not None else STATUSES[place],
                "points": float(points) if "." in points else int(points or "0"),
                "number": number,
                **correction,
            })
        positions = [entry["position"] for entry in entries if entry["position"] is not None]
        if len(entries) < 15 or positions != list(range(1, len(positions) + 1)):
            raise ValueError(f"Unexpected classification at {url} ({session}): {positions}")
        yield category, race_type, f"{url}#{quote(heading['id'])}", entries


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("cache", type=Path, help="Folder containing saved season and GP report HTML")
    parser.add_argument("--cutoff", default="2026-11-25")
    args = parser.parse_args()
    data_dir = Path(__file__).resolve().parents[1] / "src" / "lib"
    archive = json.loads((data_dir / "motorsport-archive.json").read_text(encoding="utf-8"))
    events = archive["moto"]["2026"]["events"]
    rounds = [list(group) for _, group in groupby(events, key=lambda event: event[0].removesuffix(" · Sprint"))]
    season = read_html(args.cache / "moto-2026.html")
    reports = next(
        table for table in season.select("table.wikitable")
        if "Winning rider" in table.tr.get_text(" ", strip=True)
    )
    urls = list(dict.fromkeys(
        link["href"] for link in reports.select('a[href*="/wiki/2026_"]')
    ))
    if len(urls) != len(rounds):
        raise ValueError("Mismatch between calendar rounds and race reports")

    output = []
    for index, (url, events) in enumerate(zip(urls, rounds), start=1):
        dates = {event[2]: event[1] for event in events if event[1] <= args.cutoff}
        if not dates:
            continue
        report = args.cache / f"moto-stage-2026-{index}.html"
        tables = {(category, kind): (source, entries)
                  for category, kind, source, entries in classifications(read_html(report), url)}
        if index in SPANISH_REPORTS:
            title = quote(f"Gran_Premio_de_{SPANISH_REPORTS[index]}_de_Motociclismo_de_2026")
            translated = args.cache / f"moto-stage-es-2026-{index}.html"
            for category, kind, source, entries in classifications(read_html(translated), f"https://es.wikipedia.org/wiki/{title}"):
                if index == 12 and category == "Moto2":
                    # The Spanish table matches the published championship totals after Silverstone.
                    tables[category, kind] = (source, entries)
                else:
                    tables.setdefault((category, kind), (source, entries))

        for category, category_id in CATEGORIES.items():
            for kind, race_date in dates.items():
                if kind == "SPRINT" and category != "MotoGP":
                    continue
                source, entries = tables[category, kind]
                output.append({
                    "categoryId": category_id, "date": race_date, "raceType": kind,
                    "source": source, "entries": entries,
                })

    normalized = sorted(output, key=lambda stage: (stage["categoryId"], stage["date"]))
    lines = [json.dumps(stage, ensure_ascii=False, separators=(",", ":")) for stage in normalized]
    (data_dir / "motorcycle-results.json").write_text("[\n  " + ",\n  ".join(lines) + "\n]\n", encoding="utf-8")


if __name__ == "__main__":
    main()
