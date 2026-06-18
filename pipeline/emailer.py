import os
import markdown as md
import resend

from .config import RESEND_API_KEY, EMAIL_FROM, EMAIL_TO

resend.api_key = RESEND_API_KEY

_TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "templates", "report_email.html")


def _load_template() -> str:
    with open(_TEMPLATE_PATH, encoding="utf-8") as f:
        return f.read()


def _markdown_to_html(markdown_text: str) -> str:
    return md.markdown(
        markdown_text,
        extensions=["extra", "sane_lists"],
    )


def send_daily_report(markdown_content: str, report_date: str, source_count: int, article_count: int) -> str:
    """Send daily report email. Returns Resend email ID."""
    content_html = _markdown_to_html(markdown_content)
    template = _load_template()
    html_body = (
        template
        .replace("{{CONTENT}}", content_html)
        .replace("{{DATE}}", report_date)
        .replace("{{SOURCE_COUNT}}", str(source_count))
        .replace("{{ARTICLE_COUNT}}", str(article_count))
    )

    recipients = [r.strip() for r in EMAIL_TO.split(",") if r.strip()]
    result = resend.Emails.send({
        "from": EMAIL_FROM,
        "to": recipients,
        "subject": f"📊 Báo cáo Thị trường VN — {report_date}",
        "html": html_body,
    })
    return result["id"]


if __name__ == "__main__":
    import sys
    sys.path.insert(0, __file__.rsplit("/pipeline", 1)[0])
    from pipeline.storage import get_report_by_date
    from datetime import date

    today = date.today().isoformat()
    report = get_report_by_date(today)
    if not report:
        print(f"No report found for {today}. Run pipeline first.")
        sys.exit(1)

    email_id = send_daily_report(
        report["raw_markdown"],
        today,
        report.get("source_count", 0),
        report.get("article_count", 0),
    )
    print(f"✅ Email sent: id={email_id}")
    print(f"   To: {EMAIL_TO}")
