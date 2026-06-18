import Link from 'next/link'
import { supabase, type Article } from '@/lib/supabase'
import { TOPICS, categorizeArticle } from '@/lib/topics'

async function getTodayArticles(): Promise<Article[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .gte('collected_at', since)
    .order('published_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data ?? []
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Vừa xong'
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

function excerpt(text: string, max = 160) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : clean.slice(0, max).trimEnd() + '…'
}

export default async function HomePage() {
  let articles: Article[] = []
  let fetchError: string | null = null

  try {
    articles = await getTodayArticles()
  } catch (e) {
    fetchError = e instanceof Error ? e.message : 'Lỗi không xác định'
  }

  // Group articles by topic
  const grouped: Record<string, Article[]> = {
    ai: [], 'kinh-te': [], vang: [], 'cong-nghe': [],
  }
  for (const a of articles) {
    const slug = categorizeArticle(a.title, a.source)
    grouped[slug].push(a)
  }

  return (
    <div>
      {/* Header stats */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tin tức hôm nay</h1>
        <p className="text-gray-500 text-sm mt-1">
          {articles.length} bài từ {new Set(articles.map((a) => a.source)).size} nguồn •{' '}
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <Link href="/reports" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
          Xem báo cáo phân tích AI →
        </Link>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-6">
          Không thể tải dữ liệu: {fetchError}
        </div>
      )}

      {/* Topic sections */}
      <div className="space-y-10">
        {TOPICS.map((topic) => {
          const topicArticles = grouped[topic.slug] ?? []
          const preview = topicArticles.slice(0, 4)

          return (
            <section key={topic.slug}>
              {/* Section header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{topic.emoji}</span>
                  <h2 className="text-lg font-bold text-gray-900">{topic.name}</h2>
                  <span className="text-xs text-gray-400 font-normal ml-1">
                    {topicArticles.length} bài
                  </span>
                </div>
                {topicArticles.length > 4 && (
                  <Link
                    href={`/topics/${topic.slug}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Xem tất cả {topicArticles.length} bài →
                  </Link>
                )}
              </div>

              {preview.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-2">Không có bài mới hôm nay.</p>
              ) : (
                <div className="grid gap-3">
                  {preview.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

function ArticleCard({ article: a }: { article: Article }) {
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition group"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
          {a.source}
        </span>
        <span className="text-xs text-gray-400">{timeAgo(a.published_at || a.collected_at)}</span>
      </div>
      <p className="font-semibold text-gray-900 group-hover:text-blue-700 leading-snug mb-1.5">
        {a.title}
      </p>
      {a.content && (
        <p className="text-sm text-gray-500 leading-relaxed">{excerpt(a.content)}</p>
      )}
    </a>
  )
}
