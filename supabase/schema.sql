-- Vietnam Market Intelligence — Database Schema
-- Chạy file này trong Supabase Dashboard > SQL Editor

-- ============================================================
-- Bảng articles: lưu raw news articles thu thập từ RSS feeds
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source       VARCHAR(100) NOT NULL,
  category     VARCHAR(50),
  title        TEXT NOT NULL,
  url          TEXT UNIQUE NOT NULL,
  content      TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_collected ON articles(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);

-- ============================================================
-- Bảng reports: lưu báo cáo AI phân tích theo ngày
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date      DATE UNIQUE NOT NULL,
  top_events       JSONB NOT NULL DEFAULT '[]',
  emerging_trends  JSONB NOT NULL DEFAULT '[]',
  watch_list       JSONB NOT NULL DEFAULT '[]',
  predictions      JSONB NOT NULL DEFAULT '{}',
  raw_markdown     TEXT NOT NULL,
  article_count    INTEGER DEFAULT 0,
  source_count     INTEGER DEFAULT 0,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(report_date DESC);

-- ============================================================
-- Row Level Security (RLS): web frontend chỉ được đọc
-- ============================================================
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports  ENABLE ROW LEVEL SECURITY;

-- Anon key chỉ SELECT (web dashboard)
CREATE POLICY "Public read reports"
  ON reports FOR SELECT
  USING (true);

CREATE POLICY "anon can read articles"
  ON articles FOR SELECT TO anon
  USING (true);

-- Pipeline dùng service_role key (bypass RLS) để INSERT/DELETE
-- Không cần policy riêng cho service_role

-- ============================================================
-- Function tự xóa articles cũ > 90 ngày (gọi thủ công hoặc từ pipeline)
-- ============================================================
CREATE OR REPLACE FUNCTION purge_old_articles()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM articles
  WHERE collected_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
