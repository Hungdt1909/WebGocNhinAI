import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase, type Article } from '@/lib/supabase'
import { categorizeArticle, getTopicBySlug, type TopicSlug } from '@/lib/topics'

const HANOI_KEYWORDS = ['hà nội', 'hanoi', 'thủ đô', 'hanoï']

function isHanoi(a: Article) {
  const s = (a.title + ' ' + (a.content ?? '')).toLowerCase()
  return HANOI_KEYWORDS.some(k => s.includes(k))
}

// ── Data fetching ─────────────────────────────────────────────

async function getArticles(slug: TopicSlug): Promise<Article[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('articles').select('*')
    .gte('collected_at', since)
    .order('published_at', { ascending: false })
    .limit(300)
  const all = (data ?? []).filter(a => categorizeArticle(a.title, a.source) === slug)
  // BDS: only Hà Nội articles
  return slug === 'bat-dong-san' ? all.filter(isHanoi) : all
}

type TopEvent = {
  rank: number
  title: string
  summary: string
  why_matters?: string
  sources?: string[]
}

const TOPIC_KEYWORDS: Record<string, string[]> = {
  'bat-dong-san': ['bất động sản', 'nhà đất', 'căn hộ', 'chung cư', 'đất nền', 'dự án', 'hà nội', 'giá nhà', 'khu đô thị', 'quy hoạch'],
  'cong-nghe':    ['công nghệ', 'ai', 'trí tuệ nhân tạo', 'startup', 'tech', 'phần mềm', 'chip', 'bán dẫn', 'robot', 'khoa học', 'nghiên cứu'],
}

async function getTopEvents(slug: string): Promise<{ events: TopEvent[]; date: string } | null> {
  const { data } = await supabase
    .from('reports')
    .select('report_date, top_events')
    .order('report_date', { ascending: false })
    .limit(1)
    .single()
  if (!data?.top_events) return null

  const keywords = TOPIC_KEYWORDS[slug] ?? []
  if (keywords.length === 0) return null

  const filtered = (data.top_events as TopEvent[]).filter(ev => {
    const text = (ev.title + ' ' + (ev.summary ?? '') + ' ' + (ev.why_matters ?? '')).toLowerCase()
    return keywords.some(k => text.includes(k))
  })

  return { events: filtered.slice(0, 5), date: data.report_date }
}

// ── Helpers ───────────────────────────────────────────────────

function timeAgo(d: string) {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3_600_000)
  if (h < 1) return 'Vừa xong'
  if (h < 24) return `${h}h trước`
  return `${Math.floor(h / 24)}d trước`
}

// ── Sub-components ────────────────────────────────────────────

function EventHighlights({ events, date, reportDate }: {
  events: TopEvent[]
  date: string
  reportDate: string
}) {
  if (events.length === 0) return null
  return (
    <section className="mb-8">
      <div className="border-b-2 border-gray-900 pb-2 mb-4 flex items-baseline justify-between">
        <h2 className="font-black text-xs uppercase tracking-widest text-gray-900">
          AI Chọn lọc · {date}
        </h2>
        <Link href={`/reports/${reportDate}`} className="text-xs text-blue-600 hover:underline">
          Xem báo cáo đầy đủ →
        </Link>
      </div>
      <div className="space-y-3">
        {events.map((ev) => (
          <Link
            key={ev.rank}
            href={`/reports/${reportDate}/events/${ev.rank}`}
            className="block group bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded p-3.5 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-xs font-black text-gray-300 mt-0.5 w-4 shrink-0">{ev.rank}</span>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 group-hover:text-blue-700 leading-snug text-sm">
                  {ev.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                  {ev.summary}
                </p>
                {ev.sources && ev.sources.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">{ev.sources.slice(0, 3).join(' · ')}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function CompactArticleList({ articles, count }: { articles: Article[]; count: number }) {
  const top5 = articles.slice(0, 5)
  const rest  = articles.length - 5

  if (top5.length === 0) return (
    <p className="text-gray-400 text-sm py-4">Không có bài viết nào trong 24 giờ qua.</p>
  )

  return (
    <>
      <div className="divide-y divide-gray-100">
        {top5.map(a => (
          <a
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 py-3 group hover:bg-gray-50 -mx-2 px-2 rounded"
          >
            <span className="text-xs text-gray-300 font-black mt-0.5 w-4 shrink-0">▶</span>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 group-hover:text-blue-700 leading-snug text-sm">
                {a.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {a.source} · {timeAgo(a.published_at || a.collected_at)}
              </p>
            </div>
          </a>
        ))}
      </div>
      {rest > 0 && (
        <p className="text-xs text-gray-400 mt-3 pl-7">+{rest} bài khác không hiển thị</p>
      )}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const topic = getTopicBySlug(slug)
  if (!topic) notFound()

  const [articles, topEventsResult] = await Promise.all([
    getArticles(slug as TopicSlug),
    getTopEvents(slug),
  ])

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
        <Link href="/" className="hover:text-blue-700">Trang chủ</Link>
        <span>/</span>
        <span className="text-gray-600">{topic.name}</span>
      </div>

      {/* Header */}
      <div className="border-b-2 border-gray-900 pb-2 mb-6 flex items-baseline justify-between">
        <h1 className="font-black text-sm uppercase tracking-widest text-gray-900">{topic.name}</h1>
        <span className="text-xs text-gray-400">{articles.length} bài trong 24h</span>
      </div>

      {/* AI highlights */}
      {topEventsResult && topEventsResult.events.length > 0 && (
        <EventHighlights
          events={topEventsResult.events}
          date={topEventsResult.date}
          reportDate={topEventsResult.date}
        />
      )}

      {/* Latest articles */}
      <div className="border-b-2 border-gray-900 pb-2 mb-5">
        <h2 className="font-black text-xs uppercase tracking-widest text-gray-900">Tin mới nhất</h2>
      </div>
      <CompactArticleList articles={articles} count={articles.length} />
    </div>
  )
}
