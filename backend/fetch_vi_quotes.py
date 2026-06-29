"""Build quotes.js — toàn bộ quote tiếng Việt từ nguồn công khai."""
import json
import random
import re
import urllib.request
from pathlib import Path

OUT = Path(__file__).parent.parent / "frontend" / "src" / "data" / "quotes.js"
SOURCE = "https://github.com/trananhtung/danh-ngon"
DATA_URL = (
    "https://raw.githubusercontent.com/trananhtung/danh-ngon/main/data/quotes.json"
)
QUOTE_LIMIT = 500

HEADERS = {"User-Agent": "PhongVan/1.0 (education project)"}

MOTIVATION_KEYWORDS = re.compile(
    r"(thành công|kiên trì|nỗ lực|đam mê|ước mơ|học|cuộc sống|"
    r"thất bại|hy vọng|tương lai|quyết tâm|cố gắng|kiên nhẫn|"
    r"success|persever|effort|courage|dream|motivat|hope|learn|"
    r"achiev|goal|patience|determin|believe|grow|challenge|future|"
    r"passion|discipline|progress|improve|commit|purpose|journey)",
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


def is_valid_author(author: str) -> bool:
    author = normalize(author)
    if not author or len(author) > 50:
        return False
    lower = author.lower()
    bad = (
        "http", "wiki", "against", "star fox", "episode", "violence",
        "robot", "shrews", "forged by", "teenage", "killer", "film",
        "movie", "series", "game", "tv ", "anime", "manga", "comic",
        "album", "song", "chapter", "season", "novel",
        "fictional", "character", "unknown",
        "capricorn", "venusian", "purple", "jackie chan adventures",
    )
    if any(x in lower for x in bad):
        return False
    # Loại tên quá ngắn hoặc giống tiêu đề sách/phim
    if len(author.split()) == 1 and author[0].isupper() and len(author) > 20:
        return False
    return True


def format_quote(text: str, author: str) -> str:
    text = normalize(text)
    author = normalize(author) or "Không rõ"
    if not is_vietnamese(text) or not is_valid_author(author):
        return ""
    # Bỏ câu lẫn quá nhiều tiếng Anh
    if len(re.findall(r"[a-zA-Z]{4,}", text)) > 6:
        return ""
    if len(text) < 20 or len(text) > 260:
        return ""
    return f'"{text}" — {author} ({SOURCE})'


def main():
    print("Loading danh-ngon (Wikiquote, AZQuotes, HuggingFace)...")
    req = urllib.request.Request(DATA_URL, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    themed: list[str] = []
    general: list[str] = []
    seen: set[str] = set()

    for item in data:
        vi = item.get("vi") or ""
        author = item.get("author") or "Không rõ"
        topics = set(item.get("topics") or [])
        quote = format_quote(vi, author)
        if not quote or quote in seen:
            continue
        seen.add(quote)
        if topics & VI_TOPICS or MOTIVATION_KEYWORDS.search(vi):
            themed.append(quote)
        else:
            general.append(quote)

    final = themed + general
    random.seed(42)
    random.shuffle(final)
    final = final[:QUOTE_LIMIT]

    meta = {
        "lang": "vi",
        "total": len(final),
        "limit": QUOTE_LIMIT,
        "themed": min(len(themed), QUOTE_LIMIT),
        "sources": [
            "https://github.com/trananhtung/danh-ngon",
            "Wikiquote (VI), AZQuotes",
        ],
    }

    print(f"Total Vietnamese quotes: {len(final)}")

    content = (
        "// 500 cau quote tieng Viet — nguon: danh-ngon (Wikiquote, AZQuotes)\n"
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
    print(f"Written -> {OUT}")


if __name__ == "__main__":
    main()
