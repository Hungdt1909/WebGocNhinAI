import Link from 'next/link'
import { supabase, type Article, type Report } from '@/lib/supabase'
import { TOPICS, categorizeArticle } from '@/lib/topics'

type TopEvent = {
  rank: number
  title: string
  summary: string
  sources: string[]
  why_matters?: string
  risks?: string[]
  opportunities?: string[]
}

async function getTodayData(): Promise<{ report: Report | null; articles: Article[] }> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [reportRes, articleRes] = await Promise.all([
    supabase.from('reports').select('*').order('report_date', { ascending: false }).limit(1).single(),
    supabase.from('articles').select('*').gte('collected_at', since).order('published_at', { ascending: false }).limit(200),
  ])

  return {
    report: reportRes.data ?? null,
    articles: articleRes.data ?? [],
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Vừa xong'
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

function excerpt(text: string, max = 140) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : clean.slice(0, max).trimEnd() + '…'
}

export default async function HomePage() {
  const { report, articles } = await getTodayData()

  const topEvents: TopEvent[] = Array.isArray(report?.top_events) ? (report.top_events as TopEvent[]) : []

  const grouped: Record<string, Article[]> = { ai: [], 'kinh-te': [], vang: [], 'cong-nghe': [] }
  for (const a of articles) {
    grouped[categorizeArticle(a.title, a.source)].push(a)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main column */}
      <div className="lg:col-span-2 space-y-10">

        {/* AI Analysis — top events */}
        {topEvents.length > 0 && (
          <section>
            <SectionHeader title="Bản tin phân tích" date={report?.report_date} href="/reports" />
            <div className="space-y-5">
              {topEvents.slice(0, 5).map((ev) => (
                <div key={ev.rank} className="border-b border-gray-100 pb-5 last:border-0">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                    Sự kiện {ev.rank}
                  </span>
                  <h3 className="font-bold text-gray-900 mt-1 leading-snug text-base">
                    {ev.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{ev.summary}</p>
                  {ev.sources?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      Nguồn: {ev.sources.join(' · ')}
                    </p>
                  )}
                </div>
              ))}
              {topEvents.length > 5 && (
                <Link href="/reports" className="text-sm text-blue-700 hover:underline block pt-1">
                  Xem thêm {topEvents.length - 5} sự kiện trong báo cáo đầy đủ →
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Kinh tế VN — biggest topic */}
        <TopicSection
          slug="kinh-te"
          name="Kinh tế Việt Nam"
          articles={grouped['kinh-te']}
          limit={5}
        />
      </div>

      {/* Sidebar */}
      <aside className="space-y-8">
        {/* AI */}
        <TopicSection slug="ai" name="Trí tuệ nhân tạo" articles={grouped['ai']} limit={4} compact />
        {/* Vàng */}
        <TopicSection slug="vang" name="Vàng" articles={grouped['vang']} limit={4} compact />
        {/* Công nghệ */}
        <TopicSection slug="cong-nghe" name="Khoa học & Công nghệ" articles={grouped['cong-nghe']} limit={4} compact />
      </aside>
    </div>
  )
}

function SectionHeader({ title, date, href }: { title: string; date?: string; href?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b-2 border-gray-900 pb-2 mb-4">
      <h2 className="font-black text-sm uppercase tracking-widest text-gray-900">{title}</h2>
      <div className="flex items-center gap-3">
        {date && <span className="text-xs text-gray-400">{date}</span>}
        {href && (
          <Link href={href} className="text-xs text-blue-700 hover:underline">
            Xem tất cả
          </Link>
        )}
      </div>
    </div>
  )
}

function TopicSection({
  slug, name, articles, limit, compact = false,
}: {
  slug: string
  name: string
  articles: Article[]
  limit: number
  compact?: boolean
}) {
  const preview = articles.slice(0, limit)

  return (
    <section>
      <SectionHeader title={name} href={`/topics/${slug}`} />
      {preview.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Không có bài mới hôm nay.</p>
      ) : (
        <div className="space-y-4">
          {preview.map((a) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <p className="text-xs text-gray-400 mb-0.5">
                {a.source} · {timeAgo(a.published_at || a.collected_at)}
              </p>
              <p className={`font-semibold text-gray-900 group-hover:text-blue-700 leading-snug ${compact ? 'text-sm' : 'text-base'}`}>
                {a.title}
              </p>
              {!compact && a.content && (
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{excerpt(a.content)}</p>
              )}
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
