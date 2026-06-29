"""Fetch 1000 real attributed quotes from public datasets."""
import json
import re
import urllib.request
from pathlib import Path

OUT = Path(__file__).parent.parent / "frontend" / "src" / "data" / "quotes.js"

KEYWORDS = re.compile(
    r"\b(success|persever|persist|effort|work hard|courage|dream|fail|"
    r"try again|never give|keep going|discipline|motivat|inspir|achiev|"
    r"goal|patience|determin|overcome|strength|hope|believe|learn|"
    r"grow|challenge|future|passion|focus|practice|talent|mindset|"
    r"hardship|struggle|victory|winner|leader|wisdom|life|change|"
    r"opportunity|education|knowledge|skill|progress|improve|commit|"
    r"endure|resilien|dedicat|ambition|purpose|journey|begin|start)\b",
    re.I,
)


def fetch_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "PhongVan/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip())


def format_quote(text: str, author: str, source: str | None = None) -> str:
    text = normalize(text)
    author = normalize(author)
    if not text or not author or author.lower() in ("unknown", "anonymous", ""):
        return ""
    if len(text) < 20 or len(text) > 280:
        return ""
    quote = f'"{text}" — {author}'
    if source and source.startswith("http"):
        quote += f" ({source})"
    return quote


def add_quote(quotes: dict, text: str, author: str, source: str | None = None):
    formatted = format_quote(text, author, source)
    if formatted:
        quotes[formatted] = True


def main():
    quotes: dict[str, bool] = {}

    print("Fetching DummyJSON...")
    try:
        data = fetch_json("https://dummyjson.com/quotes?limit=1454&skip=0")
        for item in data.get("quotes", []):
            add_quote(quotes, item.get("quote", ""), item.get("author", ""))
        print(f"  After DummyJSON: {len(quotes)}")
    except Exception as exc:
        print(f"  DummyJSON failed: {exc}")

    print("Fetching JamesFT Database...")
    try:
        data = fetch_json(
            "https://raw.githubusercontent.com/JamesFT/Database-Quotes-JSON/master/quotes.json"
        )
        for item in data:
            add_quote(quotes, item.get("quoteText", ""), item.get("quoteAuthor", ""))
        print(f"  After JamesFT: {len(quotes)}")
    except Exception as exc:
        print(f"  JamesFT failed: {exc}")

    print("Fetching dwyl/quotes...")
    try:
        data = fetch_json(
            "https://raw.githubusercontent.com/dwyl/quotes/master/quotes.json"
        )
        for item in data:
            add_quote(
                quotes,
                item.get("text", ""),
                item.get("author", ""),
                item.get("source"),
            )
        print(f"  After dwyl: {len(quotes)}")
    except Exception as exc:
        print(f"  dwyl failed: {exc}")

    all_quotes = list(quotes.keys())

    # Prefer motivation/perseverance themed quotes first
    themed = [q for q in all_quotes if KEYWORDS.search(q)]
    others = [q for q in all_quotes if q not in themed]
    ordered = themed + others

    if len(ordered) < 1000:
        print(f"Warning: only {len(ordered)} unique quotes available")
        final = ordered
    else:
        final = ordered[:1000]

    print(f"Writing {len(final)} quotes...")

    content = (
        "// 1000 câu quote trích từ nguồn công khai (DummyJSON, JamesFT, dwyl/quotes)\n"
        "// Mỗi câu có tác giả; một số có link nguồn tham khảo\n"
        "export const MOTIVATIONAL_QUOTES = "
        + json.dumps(final, ensure_ascii=False, indent=2)
        + ";\n\n"
        "export function pickRandomQuote() {\n"
        "  const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);\n"
        "  return MOTIVATIONAL_QUOTES[index];\n"
        "}\n"
    )
    OUT.write_text(content, encoding="utf-8")
    print(f"Done -> {OUT}")


if __name__ == "__main__":
    main()
