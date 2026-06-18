"""
Pipeline entry point.
Runs: collect → store → analyze → store report → send email → purge old data
"""
import sys
import traceback
from datetime import date, datetime, timezone

from .collector import collect_all
from .storage import insert_articles, get_articles_today, insert_report, get_report_by_date, purge_old_articles
from .analyzer import analyze, generate_markdown_report
from .emailer import send_daily_report


def run() -> None:
    today = date.today().isoformat()
    started_at = datetime.now(timezone.utc)
    print(f"\n{'='*60}")
    print(f"Vietnam Market Intelligence Pipeline — {today}")
    print(f"Started: {started_at.strftime('%Y-%m-%d %H:%M UTC')}")
    print('='*60)

    # ── 1. Collect news ──────────────────────────────────────────
    print("\n[1/5] Collecting news from RSS feeds...")
    articles = collect_all()
    source_count = len({a["source"] for a in articles})
    print(f"      → {len(articles)} articles from {source_count} sources")

    if not articles:
        print("      ✗ No articles collected. Aborting.")
        sys.exit(1)

    # ── 2. Store articles ────────────────────────────────────────
    print("\n[2/5] Storing articles to Supabase...")
    inserted = insert_articles(articles)
    print(f"      → {inserted} new articles inserted (duplicates skipped)")

    # Fetch today's full set (includes any from earlier runs today)
    today_articles = get_articles_today()
    print(f"      → {len(today_articles)} total articles available for analysis")

    if not today_articles:
        today_articles = articles  # fallback to freshly collected

    # ── 3. Check if report already exists ───────────────────────
    print("\n[3/5] Analyzing with Gemini AI...")
    existing = get_report_by_date(today)
    if existing:
        print(f"      ⚠ Report for {today} already exists. Skipping analysis.")
        analysis = {
            "top_events": existing["top_events"],
            "emerging_trends": existing["emerging_trends"],
            "watch_list": existing["watch_list"],
            "predictions": existing["predictions"],
        }
        raw_markdown = existing["raw_markdown"]
    else:
        analysis = analyze(today_articles)
        event_count = len(analysis.get("top_events", []))
        trend_count = len(analysis.get("emerging_trends", []))
        print(f"      → {event_count} events, {trend_count} trends identified")

        # ── 4. Store report ──────────────────────────────────────
        print("\n[4/5] Storing report to Supabase...")
        raw_markdown = generate_markdown_report(
            analysis,
            report_date=today,
            article_count=len(today_articles),
            source_count=source_count,
        )
        insert_report(
            report_date=today,
            analysis=analysis,
            raw_markdown=raw_markdown,
            article_count=len(today_articles),
            source_count=source_count,
        )
        print(f"      → Report saved for {today}")

    # ── 5. Send email ────────────────────────────────────────────
    print("\n[5/5] Sending email report via Resend...")
    email_id = send_daily_report(
        markdown_content=raw_markdown,
        report_date=today,
        source_count=source_count,
        article_count=len(today_articles),
    )
    print(f"      → Email sent: id={email_id}")

    # ── Cleanup ──────────────────────────────────────────────────
    print("\n[+] Purging articles older than 90 days...")
    purge_old_articles()

    elapsed = (datetime.now(timezone.utc) - started_at).total_seconds()
    print(f"\n{'='*60}")
    print(f"Pipeline completed in {elapsed:.1f}s")
    print('='*60)


def main() -> None:
    try:
        run()
    except Exception:
        print("\n✗ Pipeline failed:")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    # Allow running as: python -m pipeline.main  OR  python pipeline/main.py
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    main()
