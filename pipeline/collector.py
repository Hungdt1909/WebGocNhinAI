import re
import feedparser
from email.utils import parsedate_to_datetime

from .sources import NEWS_SOURCES

USER_AGENT = "Mozilla/5.0 (compatible; VietnamMarketBot/1.0)"
MAX_ARTICLES_PER_SOURCE = 20
MAX_CONTENT_CHARS = 2000


def _parse_date(value: str | None) -> str | None:
    if not value:
        return None
    try:
        return parsedate_to_datetime(value).isoformat()
    except Exception:
        return None


def _clean(text: str | None) -> str:
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def fetch_feed(source: dict) -> list[dict]:
    feed = feedparser.parse(source["url"], agent=USER_AGENT)
    articles = []
    for entry in feed.entries[:MAX_ARTICLES_PER_SOURCE]:
        url = entry.get("link", "").strip()
        title = _clean(entry.get("title", ""))
        if not url or not title:
            continue
        content = _clean(entry.get("summary", "") or entry.get("description", ""))
        articles.append({
            "source": source["name"],
            "category": source["category"],
            "title": title,
            "url": url,
            "content": content[:MAX_CONTENT_CHARS],
            "published_at": _parse_date(entry.get("published")),
        })
    return articles


def collect_all() -> list[dict]:
    all_articles: list[dict] = []
    stats: list[str] = []

    for source in NEWS_SOURCES:
        try:
            articles = fetch_feed(source)
            all_articles.extend(articles)
            stats.append(f"  ✓ {source['name']}: {len(articles)} articles")
        except Exception as e:
            stats.append(f"  ✗ {source['name']}: {e}")

    for line in stats:
        print(line)

    return all_articles


if __name__ == "__main__":
    import sys
    sys.path.insert(0, __file__.rsplit("/pipeline", 1)[0])
    print("Collecting news from all sources...")
    articles = collect_all()
    sources_hit = len({a["source"] for a in articles})
    print(f"\nTotal: {len(articles)} articles from {sources_hit} sources")
