"""Build quotes.js: 600 VI + 200 EN + 200 ZH from real public sources."""
import json
import random
import re
import urllib.request
from pathlib import Path

OUT = Path(__file__).parent.parent / "frontend" / "src" / "data" / "quotes.js"

HEADERS = {"User-Agent": "PhongVan/1.0 (education project)"}

MOTIVATION_KEYWORDS = re.compile(
    r"(success|persever|persist|effort|courage|dream|fail|motivat|inspir|"
    r"achiev|goal|patience|determin|overcome|hope|believe|learn|grow|"
    r"challenge|future|passion|focus|practice|discipline|progress|"
    r"improve|commit|endure|resilien|dedicat|ambition|purpose|journey|"
    r"thành công|kiên trì|nỗ lực|đam mê|ước mơ|học|cuộc sống|"
    r"thất bại|hy vọng|tương lai|quyết tâm|cố gắng|kiên nhẫn|"
    r"thành công|努力|坚持|梦想|希望|学习|人生|失败|毅力|奋斗)",
    re.I,
)

VI_TOPICS = {
    "thành công",
    "cuộc sống",
    "giáo dục",
    "thời gian",
    "sự nghiệp",
    "đam mê",
    "hạnh phúc",
    "cố gắng",
    "kiên trì",
    "học tập",
    "tương lai",
    "thất bại",
    "hy vọng",
    "quyết tâm",
}


def fetch_json(url: str):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


LUNYU_URL = (
    "https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/master/"
    "%E8%AE%BA%E8%AF%AD/lunyu.json"
)
DAODE_URL = (
    "https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/master/"
    "%E9%81%93%E5%BE%B7%E7%BB%8F/daodejing.json"
)
TANG_URL = (
    "https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/master/"
    "json/poet.tang.0.json"
)
MENGZI_URL = (
    "https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/master/"
    "%E5%AD%9F%E5%AD%90/mengzi.json"
)


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def is_vietnamese(text: str) -> bool:
    return bool(
        re.search(
            r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]",
            text,
            re.I,
        )
    )


def is_chinese(text: str) -> bool:
    return bool(re.search(r"[\u4e00-\u9fff]", text))


def is_english(text: str) -> bool:
    if is_vietnamese(text) or is_chinese(text):
        return False
    return bool(re.search(r"[a-zA-Z]", text))


def is_valid_author(author: str) -> bool:
    author = normalize(author)
    if len(author) > 60:
        return False
    if any(x in author.lower() for x in ("http", "wiki", "against", "star fox", "episode")):
        return False
    return True


def format_quote(text: str, author: str, source: str | None = None) -> str:
    text = normalize(text)
    author = normalize(author) or "Không rõ"
    if not is_valid_author(author):
        return ""
    if len(text) < 12 or len(text) > 320:
        return ""
    if author.lower() in ("unknown", "anonymous", ""):
        author = "Không rõ"
    quote = f'"{text}" — {author}'
    if source and source.startswith("http"):
        quote += f" ({source})"
    return quote


def pick_unique(pool: list[str], count: int, used: set[str]) -> list[str]:
    random.shuffle(pool)
    picked = []
    for item in pool:
        if item in used:
            continue
        picked.append(item)
        used.add(item)
        if len(picked) >= count:
            break
    return picked


def load_vietnamese() -> list[str]:
    print("Loading Vietnamese from danh-ngon (Wikiquote, AZQuotes, ...)...")
    data = fetch_json(
        "https://raw.githubusercontent.com/trananhtung/danh-ngon/main/data/quotes.json"
    )
    themed = []
    general = []
    for item in data:
        vi = item.get("vi") or ""
        if not is_vietnamese(vi):
            continue
        author = item.get("author") or "Không rõ"
        topics = set(item.get("topics") or [])
        formatted = format_quote(vi, author, "https://github.com/trananhtung/danh-ngon")
        if not formatted:
            continue
        if topics & VI_TOPICS or MOTIVATION_KEYWORDS.search(vi):
            themed.append(formatted)
        else:
            general.append(formatted)
    pool = themed + general
    print(f"  Vietnamese pool: {len(pool)}")
    return pool


def load_english() -> list[str]:
    print("Loading English from DummyJSON + dwyl/quotes...")
    quotes = {}

    data = fetch_json("https://dummyjson.com/quotes?limit=1454&skip=0")
    for item in data.get("quotes", []):
        text = item.get("quote", "")
        if not is_english(text):
            continue
        q = format_quote(text, item.get("author", ""))
        if q:
            quotes[q] = True

    data = fetch_json(
        "https://raw.githubusercontent.com/dwyl/quotes/master/quotes.json"
    )
    for item in data:
        text = item.get("text", "")
        if not is_english(text):
            continue
        q = format_quote(
            text,
            item.get("author", ""),
            item.get("source"),
        )
        if q:
            quotes[q] = True

    pool = list(quotes.keys())
    themed = [q for q in pool if MOTIVATION_KEYWORDS.search(q)]
    others = [q for q in pool if q not in themed]
    result = themed + others
    print(f"  English pool: {len(result)}")
    return result


def load_chinese() -> list[str]:
    print("Loading Chinese from chinese-poetry + danh-ngon bilingual...")
    pool = []

    # Confucius / classical — chinese-poetry (论语)
    lunyu = fetch_json(LUNYU_URL)
    for chapter in lunyu:
        chapter_name = chapter.get("chapter", "论语")
        for para in chapter.get("paragraphs", []):
            if not is_chinese(para):
                continue
            q = format_quote(para, "孔子", "https://github.com/chinese-poetry/chinese-poetry")
            if q:
                pool.append(q)

    try:
        mengzi = fetch_json(MENGZI_URL)
        for chapter in mengzi:
            for para in chapter.get("paragraphs", []):
                if not is_chinese(para):
                    continue
                q = format_quote(para, "孟子", "https://github.com/chinese-poetry/chinese-poetry")
                if q:
                    pool.append(q)
    except Exception as exc:
        print(f"  Mengzi skip: {exc}")

    # Dao De Jing excerpts
    try:
        daode = fetch_json(DAODE_URL)
        for item in daode:
            content = item.get("content") or item.get("paragraphs") or ""
            if isinstance(content, list):
                for line in content:
                    q = format_quote(line, "老子", "https://github.com/chinese-poetry/chinese-poetry")
                    if q:
                        pool.append(q)
            elif isinstance(content, str):
                q = format_quote(content, "老子", "https://github.com/chinese-poetry/chinese-poetry")
                if q:
                    pool.append(q)
    except Exception as exc:
        print(f"  Daodejing skip: {exc}")

    # Tang poems — short lines as wisdom (author from poem)
    try:
        tang = fetch_json(TANG_URL)
        for poem in tang[:800]:
            author = poem.get("author", "唐诗")
            for line in poem.get("paragraphs", []):
                if 8 <= len(line) <= 40:
                    q = format_quote(line, author, "https://github.com/chinese-poetry/chinese-poetry")
                    if q:
                        pool.append(q)
    except Exception as exc:
        print(f"  Tang poetry skip: {exc}")

    # Bilingual entries where vi exists but use en field if contains Chinese chars - skip
    # Add zh-only from danh-ngon if any - actually danh-ngon is vi/en only

    # Deduplicate
    seen = set()
    unique = []
    for q in pool:
        if q not in seen:
            seen.add(q)
            unique.append(q)

    print(f"  Chinese pool: {len(unique)}")
    return unique


def main():
    random.seed(42)
    used: set[str] = set()

    vi_pool = load_vietnamese()
    en_pool = load_english()
    zh_pool = load_chinese()

    vi = pick_unique(vi_pool, 600, used)
    en = pick_unique(en_pool, 200, used)
    zh = pick_unique(zh_pool, 200, used)

    print(f"Picked VI={len(vi)}, EN={len(en)}, ZH={len(zh)}")

    if len(vi) < 600:
        print(f"WARNING: only {len(vi)} Vietnamese quotes")
    if len(en) < 200:
        print(f"WARNING: only {len(en)} English quotes")
    if len(zh) < 200:
        print(f"WARNING: only {len(zh)} Chinese quotes — filling from remaining VI/EN if needed")
        while len(zh) < 200 and zh_pool:
            extra = pick_unique(zh_pool, 200 - len(zh), used)
            zh.extend(extra)
            if not extra:
                break

    final = vi[:600] + en[:200] + zh[:200]
    random.shuffle(final)

    meta = {
        "vi": len(vi[:600]),
        "en": len(en[:200]),
        "zh": len(zh[:200]),
        "total": len(final),
        "sources": [
            "https://github.com/trananhtung/danh-ngon (Wikiquote, AZQuotes, HuggingFace)",
            "https://dummyjson.com/quotes",
            "https://github.com/dwyl/quotes",
            "https://github.com/chinese-poetry/chinese-poetry (论语, 道德经, 唐诗)",
        ],
    }

    content = (
        "// Kho quote: 600 tiếng Việt + 200 tiếng Anh + 200 tiếng Trung\n"
        f"// Meta: {json.dumps(meta, ensure_ascii=False)}\n"
        "export const QUOTE_META = "
        + json.dumps(meta, ensure_ascii=False, indent=2)
        + ";\n\n"
        "export const MOTIVATIONAL_QUOTES = "
        + json.dumps(final, ensure_ascii=False, indent=2)
        + ";\n\n"
        "export function pickRandomQuote() {\n"
        "  const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);\n"
        "  return MOTIVATIONAL_QUOTES[index];\n"
        "}\n"
    )
    OUT.write_text(content, encoding="utf-8")
    print(f"Written {len(final)} quotes -> {OUT}")


if __name__ == "__main__":
    main()
