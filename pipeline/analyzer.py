import json
from datetime import date as date_type
import google.generativeai as genai

from .config import GEMINI_API_KEY
from .prompts import ANALYSIS_PROMPT

MAX_ARTICLES = 80
MAX_CONTENT_PREVIEW = 300

genai.configure(api_key=GEMINI_API_KEY)
_model = genai.GenerativeModel("gemini-2.5-flash")


def prepare_articles_text(articles: list[dict]) -> str:
    lines = []
    for i, a in enumerate(articles[:MAX_ARTICLES], 1):
        preview = (a.get("content") or "")[:MAX_CONTENT_PREVIEW]
        lines.append(f"{i}. [{a['source']}] {a['title']}\n   {preview}")
    return "\n\n".join(lines)


def _call_gemini(prompt: str) -> dict:
    response = _model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)


def analyze(articles: list[dict]) -> dict:
    today = date_type.today().strftime("%d/%m/%Y")
    articles_text = prepare_articles_text(articles)
    prompt = ANALYSIS_PROMPT.format(
        article_count=len(articles[:MAX_ARTICLES]),
        date=today,
        articles_text=articles_text,
    )
    try:
        return _call_gemini(prompt)
    except (json.JSONDecodeError, Exception):
        # Retry once on parse error
        return _call_gemini(prompt)


def generate_markdown_report(analysis: dict, report_date: str, article_count: int, source_count: int) -> str:
    lines = [f"# Báo cáo Thị trường Việt Nam — {report_date}", ""]

    # Top 10 events
    lines += ["## 🔟 Top 10 Sự kiện Quan trọng", ""]
    for event in analysis.get("top_events", []):
        lines.append(f"### {event.get('rank', '')}. {event.get('title', '')}")
        lines.append(f"**Tóm tắt**: {event.get('summary', '')}")
        lines.append(f"**Tại sao quan trọng**: {event.get('why_matters', '')}")
        affected = ", ".join(event.get("affected", []))
        if affected:
            lines.append(f"**Ai bị ảnh hưởng**: {affected}")
        opps = event.get("opportunities", [])
        if opps:
            lines.append(f"**Cơ hội**: {'; '.join(opps)}")
        risks = event.get("risks", [])
        if risks:
            lines.append(f"**Rủi ro**: {'; '.join(risks)}")
        sources = ", ".join(event.get("sources", []))
        if sources:
            lines.append(f"*Nguồn: {sources}*")
        lines.append("")

    # Emerging trends
    lines += ["## 📈 Xu hướng Mới nổi", ""]
    for trend in analysis.get("emerging_trends", []):
        lines.append(f"### {trend.get('trend', '')}")
        lines.append(f"**Bằng chứng**: {trend.get('evidence', '')}")
        industries = ", ".join(trend.get("industries", []))
        if industries:
            lines.append(f"**Ngành liên quan**: {industries}")
        lines.append(f"**Ý nghĩa**: {trend.get('significance', '')}")
        lines.append("")

    # Watch list
    lines += ["## 👀 Cần Theo dõi", ""]
    for item in analysis.get("watch_list", []):
        lines.append(f"- **{item.get('item', '')}**")
        lines.append(f"  - *Lý do*: {item.get('reason', '')}")
        lines.append(f"  - *Dấu hiệu*: {item.get('trigger', '')}")
    lines.append("")

    # Predictions
    predictions = analysis.get("predictions", {})
    lines += ["## 🔮 Dự báo 30 Ngày Tới", ""]
    for fc in predictions.get("forecasts", []):
        confidence_map = {"cao": "🟢", "trung bình": "🟡", "thấp": "🔴"}
        icon = confidence_map.get(fc.get("confidence", "").lower(), "⚪")
        lines.append(f"{icon} **{fc.get('sector', '')}**: {fc.get('prediction', '')}")
        lines.append(f"  *Cơ sở: {fc.get('basis', '')}*")
    lines.append("")
    macro = predictions.get("macro_outlook", "")
    if macro:
        lines += ["**Nhận định vĩ mô**:", macro, ""]

    lines.append(f"---\n*Báo cáo tự động — {source_count} nguồn, {article_count} tin tức*")
    return "\n".join(lines)
