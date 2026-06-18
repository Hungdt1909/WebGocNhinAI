from datetime import date, datetime, timezone, timedelta
from supabase import create_client, Client
from .config import SUPABASE_URL, SUPABASE_SERVICE_KEY

_client: Client | None = None


def _get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client


def insert_articles(articles: list[dict]) -> int:
    """Upsert articles, skip duplicates by URL. Returns count inserted."""
    if not articles:
        return 0
    client = _get_client()
    result = (
        client.table("articles")
        .upsert(articles, on_conflict="url", ignore_duplicates=True)
        .execute()
    )
    return len(result.data) if result.data else 0


def get_articles_today() -> list[dict]:
    """Fetch articles published or collected in the last 24 hours."""
    client = _get_client()
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    result = (
        client.table("articles")
        .select("*")
        .gte("collected_at", cutoff)
        .order("collected_at", desc=True)
        .execute()
    )
    return result.data or []


def insert_report(report_date: str, analysis: dict, raw_markdown: str) -> None:
    """Insert a daily report. Raises if date already exists."""
    client = _get_client()
    client.table("reports").insert({
        "report_date": report_date,
        "top_events": analysis.get("top_events", []),
        "emerging_trends": analysis.get("emerging_trends", []),
        "watch_list": analysis.get("watch_list", []),
        "predictions": analysis.get("predictions", {}),
        "raw_markdown": raw_markdown,
    }).execute()


def get_report_by_date(report_date: str) -> dict | None:
    """Return report for a given date string (YYYY-MM-DD), or None."""
    client = _get_client()
    result = (
        client.table("reports")
        .select("*")
        .eq("report_date", report_date)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def purge_old_articles() -> None:
    """Delete articles older than 90 days to stay within free quota."""
    client = _get_client()
    cutoff = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
    client.table("articles").delete().lt("collected_at", cutoff).execute()
