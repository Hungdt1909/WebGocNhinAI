# Vietnam Market Intelligence

Hệ thống tự động thu thập tin tức kinh doanh Việt Nam, AI phân tích pattern/trend, gửi báo cáo qua email và hiển thị trên web — hoàn toàn miễn phí.

## Kiến trúc

```
GitHub Actions (7:00 AM ICT)
        ↓
RSS Feeds (13 nguồn VN) → collector.py
        ↓
Supabase PostgreSQL (articles)
        ↓
Gemini 1.5 Flash → analyzer.py
        ↓
Supabase PostgreSQL (reports)
        ↓
Resend Email + Vercel Web Dashboard
```

## Stack (All Free Tier)

| Layer | Tool |
|-------|------|
| Scheduler | GitHub Actions |
| News | RSS feedparser |
| AI | Google Gemini 1.5 Flash |
| Database | Supabase PostgreSQL |
| Web | Next.js on Vercel |
| Email | Resend |

## Setup

### 1. Đăng ký services (cần làm thủ công)

- **Supabase**: https://supabase.com → Tạo project → Lấy URL + service_role key
- **Gemini**: https://aistudio.google.com/app/apikey → Tạo API key
- **Resend**: https://resend.com → Đăng ký → Lấy API key

### 2. Cấu hình môi trường

```bash
cp .env.example .env
# Điền credentials vào .env
```

### 3. Tạo database schema

Vào Supabase Dashboard → SQL Editor → Chạy nội dung file `supabase/schema.sql`

### 4. Cài dependencies

```bash
pip install -r requirements.txt
```

### 5. Test kết nối

```bash
python scripts/test_connection.py
```

### 6. Deploy

```bash
# Push lên GitHub, cấu hình Secrets trong repo Settings
# GitHub Actions sẽ tự chạy lúc 7:00 AM mỗi ngày
```

## Cấu trúc thư mục

```
vietnam-market-intel/
├── .github/workflows/daily-analysis.yml   # Cron scheduler
├── pipeline/
│   ├── config.py       # Env vars loader
│   ├── storage.py      # Supabase client
│   ├── sources.py      # Danh sách RSS feeds
│   ├── collector.py    # Thu thập tin tức
│   ├── analyzer.py     # Gemini AI analysis
│   ├── emailer.py      # Gửi email
│   └── main.py         # Entrypoint pipeline
├── web/                # Next.js dashboard (Phase 05)
├── supabase/
│   └── schema.sql      # Database schema
├── scripts/
│   └── test_connection.py
├── requirements.txt
└── .env.example
```

## Kế hoạch phát triển

Xem `plans/260618-0933-vietnam-market-intelligence/plan.md`
