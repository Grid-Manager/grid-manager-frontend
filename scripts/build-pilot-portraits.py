"""Resolve openly licensed biographies' lead images from Wikimedia."""

import argparse
import concurrent.futures
import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


def name_key(name):
    return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", name).lower())


def query(titles):
    params = {
        "action": "query", "format": "json", "formatversion": "2", "redirects": "1",
        "prop": "pageimages|pageprops|pageterms", "wbptterms": "description", "pilicense": "free",
        "pithumbsize": "330", "titles": "|".join(titles),
    }
    request = Request("https://en.wikipedia.org/w/api.php?" + urlencode(params),
                      headers={"User-Agent": "GridManagerArchive/1.0 (open motorsport data archive)"})
    try:
        with urlopen(request, timeout=20) as response:
            result = json.load(response).get("query", {})
    except OSError as error:
        print(f"Skipped {len(titles)} titles: {error}", flush=True)
        return {}
    redirects = {p["from"]: p["to"] for p in result.get("normalized", []) + result.get("redirects", [])}
    photos = {}
    for page in result.get("pages", []):
        description = " ".join(page.get("terms", {}).get("description", []))
        if "thumbnail" in page and "disambiguation" not in page.get("pageprops", {}) and re.search(
            r"driver|rider|motorcycl|rac(?:e|ing|er)|motorsport|piloto|automobil", description, re.I
        ):
            photos[page["title"]] = [page["thumbnail"]["source"], page["pageimage"]]
    for title, target in redirects.items():
        target = redirects.get(target, target)
        if target in photos:
            photos[title] = photos[target]
    return photos


def main(archive_path, roster_path, output):
    archive = json.loads(archive_path.read_text(encoding="utf-8"))
    names = {}
    for seasons in archive.values():
        for season in seasons.values():
            for name, title, *_ in season["standings"]:
                names.setdefault(name, set()).add(title or name)
    active_names = re.findall(r'\["([^"]+)",\s*[\d.-]+,', roster_path.read_text(encoding="utf-8"))
    by_key = {name_key(name): articles for name, articles in names.items()}
    priority = []
    for name in active_names:
        titles = by_key.get(name_key(name), {name})
        priority.extend(sorted(titles))
        if name_key(name) not in by_key:
            names.setdefault(name, set()).add(name)
    portraits = json.loads(output.read_text(encoding="utf-8")) if output.exists() else {}
    titles = [title for title in dict.fromkeys(priority + sorted({title for articles in names.values() for title in articles}))
              if title not in portraits and name_key(title) not in portraits]
    pages = dict(portraits)
    with concurrent.futures.ThreadPoolExecutor(2) as pool:
        for result in pool.map(query, (titles[i:i + 45] for i in range(0, len(titles), 45))):
            pages.update(result)
    for name, articles in sorted(names.items()):
        for article in articles:
            if article in pages:
                portraits[article] = pages[article]
        unique = {tuple(pages[article]) for article in articles if article in pages}
        if len(unique) == 1:
            portraits[name_key(name)] = next(iter(unique))
    output.write_text(json.dumps(portraits, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{len({tuple(item) for item in portraits.values()})} distinct photos, {len(portraits)} keys")


if __name__ == "__main__":
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument("archive", type=Path)
    args.add_argument("roster", type=Path)
    args.add_argument("output", type=Path)
    paths = args.parse_args()
    main(paths.archive, paths.roster, paths.output)
