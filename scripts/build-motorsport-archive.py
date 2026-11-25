"""Convert saved F1DB CSV and championship season pages into portal data."""

import argparse
import csv
import io
import json
import re
import zipfile
from calendar import month_name
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import unquote, urlsplit

from bs4 import BeautifulSoup


FIRST_YEAR = {
    "f2": 2010, "f3": 2019, "indy": 2010, "fe": 2014, "wec": 2021,
    "moto": 2010, "m2": 2010, "m3": 2012, "stock": 2010, "cup": 2010,
}
MONTHS = {month.lower(): index for index, month in enumerate(month_name) if month}
MONTH_PATTERN = "|".join(MONTHS)
F1_NAMES = {
    "70th-anniversary": "GP do 70º Aniversário", "abu-dhabi": "GP de Abu Dhabi",
    "australia": "GP da Austrália", "austria": "GP da Áustria", "azerbaijan": "GP do Azerbaijão",
    "bahrain": "GP do Bahrein", "barcelona-catalunya": "GP de Barcelona-Catalunha",
    "belgium": "GP da Bélgica", "brazil": "GP do Brasil", "canada": "GP do Canadá",
    "china": "GP da China", "eifel": "GP de Eifel", "emilia-romagna": "GP da Emília-Romanha",
    "europe": "GP da Europa", "france": "GP da França", "germany": "GP da Alemanha",
    "great-britain": "GP da Grã-Bretanha", "hungary": "GP da Hungria", "india": "GP da Índia",
    "italy": "GP da Itália", "japan": "GP do Japão", "korea": "GP da Coreia",
    "las-vegas": "GP de Las Vegas", "malaysia": "GP da Malásia", "mexico": "GP do México",
    "miami": "GP de Miami", "monaco": "GP de Mônaco", "netherlands": "GP dos Países Baixos",
    "portugal": "GP de Portugal", "qatar": "GP do Catar", "russia": "GP da Rússia",
    "sakhir": "GP de Sakhir", "sao-paulo": "GP de São Paulo", "saudi-arabia": "GP da Arábia Saudita",
    "singapore": "GP de Singapura", "spain": "GP da Espanha", "styria": "GP da Estíria",
    "turkey": "GP da Turquia", "tuscany": "GP da Toscana", "united-states": "GP dos Estados Unidos",
}
MOTO_NAMES = {
    "Algarve": "do Algarve", "Andalusian": "da Andaluzia", "Aragon": "de Aragão",
    "Argentine Republic": "da Argentina", "Argentine": "da Argentina", "Australian": "da Austrália",
    "Austrian": "da Áustria", "Brazilian": "do Brasil", "British": "da Grã-Bretanha",
    "Catalan": "da Catalunha", "Czech": "da Tchéquia", "Czech Republic": "da Tchéquia",
    "Doha": "de Doha", "Dutch TT": "dos Países Baixos",
    "Emilia Romagna and Rimini Riviera": "da Emília-Romanha", "Emilia Romagna": "da Emília-Romanha",
    "European": "da Europa", "French": "da França", "German": "da Alemanha",
    "Hungarian": "da Hungria", "Indian": "da Índia", "Indianapolis": "de Indianápolis",
    "Indonesian": "da Indonésia", "Italian": "da Itália", "Japanese": "do Japão",
    "Malaysian": "da Malásia", "Portuguese": "de Portugal", "Qatar": "do Catar",
    "San Marino and Rimini Riviera": "de San Marino", "Solidarity": "da Solidariedade",
    "Spanish": "da Espanha", "Styrian": "da Estíria", "Teruel": "de Teruel", "Thailand": "da Tailândia",
    "United States": "dos Estados Unidos", "Valencian Community": "de Valência", "Valencian": "de Valência",
    "Motorcycle Grand Prix of the Americas": "das Américas",
}
CONFIRMED_CANCELLATIONS = {
    # FIA F2 and FIA F3 cancelled Sunday's feature races in Melbourne in 2025.
    ("f2", 2025, "2025-03-16", "FEATURE"),
    ("f3", 2025, "2025-03-16", "FEATURE"),
    # FIA WEC replaced the Bahrain finale with Monza in 2026.
    ("wec", 2026, "2026-11-07", "ENDURANCE"),
}
DATE_PATTERN = re.compile(
    rf"(?:(?P<day1>\d{{1,2}})\s+(?P<month1>{MONTH_PATTERN})|"
    rf"(?P<month2>{MONTH_PATTERN})\s+(?P<day2>\d{{1,2}}))"
    r"(?:,?\s+(?P<year>20\d\d))?",
    re.I,
)


def value(cell):
    return " ".join(cell.stripped_strings) if cell else ""


def wiki_title(link):
    path = unquote(urlsplit(link.get("href", "")).path)
    if path.startswith("/wiki/"):
        return path.removeprefix("/wiki/").replace("_", " ")
    if path.startswith("./"):
        return path.removeprefix("./").replace("_", " ")
    return ""


def short_event_name(series, cell):
    if series in {"moto", "m2", "m3"}:
        for link in cell.select("a[href]"):
            title = re.sub(r"^20\d\d ", "", wiki_title(link)).removesuffix(" motorcycle Grand Prix")
            if title in MOTO_NAMES:
                return "GP " + MOTO_NAMES[title]
    if series in {"f2", "f3", "stock"}:
        name = value(cell)
        return name.split(",", 1)[0].strip() if ", " in name else None
    return None


def span(cell, attribute):
    match = re.match(r"^\d+", cell.get(attribute, ""))
    return max(1, int(match[0])) if match else 1


def rows(table):
    """Expand merged table cells so calendar columns keep their meaning."""
    active = {}
    for row in table.find_all("tr"):
        expanded = {}
        for column, (cell, remaining) in list(active.items()):
            expanded[column] = cell
            if remaining == 1:
                del active[column]
            else:
                active[column] = cell, remaining - 1
        column = 0
        for cell in row.find_all(["th", "td"], recursive=False):
            while column in expanded:
                column += 1
            rowspan = span(cell, "rowspan")
            for _ in range(span(cell, "colspan")):
                expanded[column] = cell
                if rowspan > 1:
                    active[column] = cell, rowspan - 1
                column += 1
        yield [expanded.get(i) for i in range(max(expanded, default=-1) + 1)]


def event_date(text, year, formula_e):
    matches = list(DATE_PATTERN.finditer(text))
    if not matches:
        return None
    match = matches[-1]
    month = MONTHS[(match["month1"] or match["month2"]).lower()]
    day = int(match["day1"] or match["day2"])
    # Month-first ranges use the last day for the main race.
    if match["month2"]:
        last_day = re.match(r"\s*[–-]\s*(\d{1,2})", text[match.end():])
        if last_day:
            day = int(last_day[1])
    race_year = int(match["year"]) if match["year"] else year + int(formula_e and month < 9)
    try:
        return date(race_year, month, day).isoformat()
    except ValueError:
        return None


def extract_events(tables, series, year):
    candidates = []
    for table in tables:
        grid = list(rows(table))
        if not grid:
            continue
        headers = [value(cell).lower() for cell in grid[0]]
        if not re.fullmatch(r"round|rnd\.?|rd\.?|no\.?|#|race\s*(?:no\.?)?", headers[0] if headers else ""):
            continue
        date_indexes = [
            index for index, header in enumerate(headers)
            if re.fullmatch(r"dates?|feature race(?:\(s\))?|sprint races?(?: [12])?|race [123]|races 1 & 2", header)
        ]
        name_indexes = [
            index for index, header in enumerate(headers)
            if re.fullmatch(r"grand prix|race(?: title| name)?|event|e-?prix|circuit(?: \(event\)|/location)?|track", header)
        ]
        if not date_indexes or not name_indexes:
            continue
        name_col = min(name_indexes, key=lambda index: ("circuit" in headers[index] or headers[index] == "track", index))
        events = []
        stock_races = {}
        for row in grid[1:]:
            round_number = re.match(r"^\d{1,2}\b", value(row[0])) if row else None
            if not round_number or name_col >= len(row):
                continue
            name_cell = row[name_col]
            name = value(name_cell)
            name = re.sub(r"\s+[\u2020\u2021*]+$", "", name)
            if not name or re.search(r"cancelled|canceled|prologue|pre-season test", name, re.I):
                continue
            second = value(row[1]) if name_col > 1 and len(row) > 1 else ""
            short_name = short_event_name(series, name_cell)

            def entry(label, day, kind):
                event = [f"{name} · {label}" if label else name, day, kind]
                return event + [None, None, short_name] if short_name else event

            for ordinal, column in enumerate(date_indexes):
                if column >= len(row):
                    continue
                cell = row[column]
                if cell and (cell.find(["s", "del", "strike"]) or re.search(r"cancelled|canceled", value(cell), re.I)):
                    continue
                if series in {"moto", "m2", "m3"} and year == 2026 and re.search(r"grand prix of australia", name, re.I):
                    if series == "moto":
                        events.append(entry("Sprint", "2026-10-24", "SPRINT"))
                    continue
                date_text = value(cell)
                day = event_date(date_text, year, series == "fe")
                if not day:
                    continue
                kind = "ENDURANCE" if series == "wec" else "STANDARD"
                label = ""
                header = headers[column]
                if header == "sprint races" or header == "races 1 & 2" or (series == "f2" and year == 2017 and header == "date"):
                    first = re.search(r"(\d{1,2})\s*[–-]\s*\d{1,2}\s+([a-z]+)", date_text, re.I)
                    first_day = event_date(" ".join(first.groups()), year, False) if first else day
                    if header == "sprint races":
                        events.extend([entry("Sprint 1", first_day, "SPRINT"), entry("Sprint 2", day, "SPRINT")])
                    elif header == "races 1 & 2":
                        events.extend([entry("Corrida 1", first_day, "STANDARD"), entry("Corrida 2", day, "STANDARD")])
                    else:
                        events.extend([entry("Corrida principal", first_day, "FEATURE"), entry("Sprint", day, "SPRINT")])
                    continue
                if header.startswith("feature race") or second in {"F", "FR", "Feature"}:
                    kind, label = "FEATURE", "Corrida principal"
                elif header.startswith("sprint race") or re.fullmatch(r"S|SR[12]?|Sprint", second):
                    kind, label = "SPRINT", "Sprint"
                    suffix = re.search(r"[12]$", header if header != "date" else second)
                    if suffix:
                        label += f" {suffix[0]}"
                elif header.startswith("race ") or re.fullmatch(r"R[12]", second):
                    label = f"Corrida {(header if header.startswith('race ') else second)[-1]}"
                elif series == "stock" and "winning driver" in headers:
                    winner_col = headers.index("winning driver")
                    if winner_col >= len(row) or not value(row[winner_col]) or "cancel" in value(row[winner_col]).lower():
                        continue
                    round_key = int(round_number[0]), name
                    race_number = stock_races.get(round_key, 0) + 1
                    stock_races[round_key] = race_number
                    label = f"Corrida {race_number}"
                if len(date_indexes) > 1 and not label:
                    label = f"Corrida {ordinal + 1}"
                event = entry(label, day, kind)
                if event not in events:
                    events.append(event)
                    if series == "moto" and year >= 2023 and not (year == 2023 and re.search(r"australia|phillip", name, re.I)):
                        race_day = date.fromisoformat(day)
                        events.append(entry("Sprint", (race_day - timedelta(days=1)).isoformat(), "SPRINT"))
        if events:
            candidates.append(events)
    return [
        event for event in max(candidates, key=len, default=[])
        if (series, year, event[1], event[2]) not in CONFIRMED_CANCELLATIONS
    ]


def profile_title(cell):
    for link in cell.select("a[rel*='wiki/PageLink'], a[href^='/wiki/'], a[href^='./']"):
        path = link["href"].split("#", 1)[0]
        title = unquote(path.removeprefix("/wiki/").removeprefix("./")).replace("_", " ")
        if title and ":" not in title:
            return title
    return None


def extract_numbers(tables, alternate=None):
    candidates = []
    for table in tables:
        grid = list(rows(table))
        for offset, row in enumerate(grid[:3]):
            labels = [value(cell).lower().rstrip(".") for cell in row]
            number = next((i for i, label in enumerate(labels) if label in {"no", "car no", "#", "number"}), None)
            drivers = [i for i, label in enumerate(labels) if label in {
                "driver", "drivers", "driver(s)", "driver name", "race driver", "rider", "riders", "season driver", "co-driver name",
            }]
            if number is None or not drivers:
                continue
            field = {}
            for entry_row in grid[offset + 1:]:
                if len(entry_row) <= number:
                    continue
                car = value(entry_row[number])
                if not re.fullmatch(r"\d{1,3}", car):
                    continue
                for driver in drivers:
                    if driver >= len(entry_row) or not (person := entry_row[driver]):
                        continue
                    names = [value(link) for link in person.select("a[href]") if wiki_title(link)]
                    if not names:
                        names = [re.sub(r"\s+[RWI]$", "", value(person))]
                    for name in names:
                        if name and re.match(r"^[^\W\d_]", name):
                            field.setdefault(name, set()).add(car)
            if field:
                candidates.append(field)
            break
    if alternate is not None:
        candidates = candidates[alternate:alternate + 1]
    numbers = {}
    for field in candidates:
        for name, entries in field.items():
            numbers.setdefault(name, set()).update(entries)
    return {name: sorted(entries, key=lambda number: (int(number), number)) for name, entries in numbers.items()}


def extract_standings(tables, series, alternate=None):
    candidates = []
    for table in tables:
        grid = list(rows(table))
        if not grid:
            continue
        headers = [value(cell).lower() for cell in grid[0]]
        try:
            pos = next(i for i, h in enumerate(headers) if h.rstrip(".") in {"pos", "position"})
            who = next(i for i, h in enumerate(headers) if h in {"driver", "rider", "driver name"})
            pts = next(i for i, h in enumerate(headers) if h.rstrip(".") in {"points", "pts"})
        except StopIteration:
            continue
        field = []
        seen = set()
        for row in grid[1:]:
            if len(row) <= max(pos, who, pts) or not row[who] or row[who].name != "td":
                continue
            person = row[who]
            name = re.sub(r"\s+[\u2020\u2021*]+$", "", value(person))
            if not name or not re.match(r"^[^\W\d_]", name, re.UNICODE):
                continue
            rank = re.match(r"^(\d{1,3})\b", value(row[pos]))
            points = re.match(r"^(\d+(?:,\d{3})*(?:\.\d+)?)", value(row[pts]))
            if not rank and not points:
                continue
            title = profile_title(person)
            if name in seen:
                continue
            seen.add(name)
            field.append([name, title, int(rank[0]) if rank else None, float(points[0].replace(",", "")) if points else None])
        if len(field) >= 5:
            candidates.append(field)
    if alternate is not None:
        return candidates[alternate] if len(candidates) > alternate else []
    return max(candidates, key=len, default=[]) if series not in {"wec", "moto"} else next(iter(candidates), [])


def load_page(path):
    soup = BeautifulSoup(path.read_bytes(), "html.parser")
    for node in soup.select("sup, .sortkey, .flagicon, .mw-ref"):
        node.decompose()
    canonical = soup.select_one('link[rel="canonical"]')
    return soup.select("table.wikitable"), canonical["href"] if canonical else None


def f1_archive(path, last_year):
    with zipfile.ZipFile(path) as archive:
        def table(name):
            filename = next(x for x in archive.namelist() if x.endswith(f"-{name}.csv"))
            return list(csv.DictReader(io.TextIOWrapper(archive.open(filename), encoding="utf-8-sig")))

        profiles = {row["id"]: row["name"] for row in table("drivers")}
        grands_prix = {row["id"]: row["fullName"] for row in table("grands-prix")}
        seasons = {}
        for row in table("races"):
            year = int(row["year"])
            if not 2010 <= year <= last_year:
                continue
            season = seasons.setdefault(year, {"source": "https://github.com/f1db/f1db", "events": [], "standings": [], "results": [], "numbers": {}})
            grand_prix = row["grandPrixId"]
            name = F1_NAMES.get(grand_prix, grands_prix[grand_prix])
            if grand_prix == "bahrain" and row["circuitId"] == "sepang":
                name = "GP do Bahrein na Malásia"
            season["events"].append([row["officialName"], row["date"], "STANDARD", int(row["id"]), int(row["laps"]) if row["laps"] else None, name])
            if row["sprintRaceDate"]:
                season["events"].append([row["officialName"] + " · Sprint", row["sprintRaceDate"], "SPRINT", -int(row["id"]), int(row["sprintRaceLaps"]) if row["sprintRaceLaps"] else None, name])
        for row in table("seasons-driver-standings"):
            season = seasons.get(int(row["year"]))
            if season:
                season["standings"].append([profiles[row["driverId"]], None, int(row["positionNumber"]) if row["positionNumber"] else None, float(row["points"]) if row["points"] else None])
        for key, sign in [("races-race-results", 1), ("races-sprint-race-results", -1)]:
            for row in table(key):
                season = seasons.get(int(row["year"]))
                number = row["driverNumber"]
                if season and re.fullmatch(r"\d{1,3}", number):
                    numbers = season["numbers"].setdefault(profiles[row["driverId"]], [])
                    if number not in numbers:
                        numbers.append(number)
                if not season or not row["positionDisplayOrder"] or row["positionText"] in {"DNS", "DNQ", "DNPQ", "WD"}:
                    continue
                status = "DSQ" if row["positionText"] in {"DQ", "DSQ", "EX"} else "DNF" if row["reasonRetired"] or not row["positionNumber"] else "FINISHED"
                season["results"].append([
                    sign * int(row["raceId"]), profiles[row["driverId"]], int(row["positionDisplayOrder"]),
                    float(row["points"] or 0), status,
                ])
        return seasons


def build(cache, last_year):
    archive = {"f1": f1_archive(cache / "f1db.zip", last_year)}
    for series, first in FIRST_YEAR.items():
        archive[series] = {}
        for year in range(first, last_year + 1):
            page = cache / f"{series}-{year}.html"
            shared_moto = series in {"m2", "m3"} and not page.exists()
            if shared_moto:
                page = cache / f"moto-{year}.html"
            if not page.exists():
                print(f"Missing source: {series} {year}")
                continue
            tables, source = load_page(page)
            events = extract_events(tables, series, year)
            if not events:
                print(f"Missing calendar: {series} {year}")
                continue
            if shared_moto:
                standings = extract_standings(tables, series, 1 if series == "m2" else 2)
            else:
                standings = extract_standings(tables, series)
            number_table = 0 if series in {"wec", "moto"} else (1 if series == "m2" else 2) if shared_moto else None
            archive[series][year] = {
                "source": source, "events": events, "standings": standings, "numbers": extract_numbers(tables, number_table),
            }
            if series == "wec" and year >= 2024:
                archive.setdefault("lmgt3", {})[year] = {
                    "source": source, "events": events, "standings": extract_standings(tables, series, 1),
                    "numbers": extract_numbers(tables, 1),
                }
            print(f"{series} {year}: {len(events)} races, {len(standings)} drivers")
    return archive


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("cache", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--last-year", type=int, default=2025)
    args = parser.parse_args()
    data = build(args.cache, args.last_year)
    args.output.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
