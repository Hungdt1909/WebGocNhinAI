import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase, type Article } from '@/lib/supabase'
import { TOPICS, categorizeArticle, getTopicBySlug } from '@/lib/topics'

async function getArticles(): Promise<Article[]> {
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

function excerpt(text: string, max = 200) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : clean.slice(0, max).trimEnd() + '…'
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const topic = getTopicBySlug(slug)
  if (!topic) notFound()

  const all = await getArticles()
  const articles = all.filter((a) => categorizeArticle(a.title, a.source) === slug)

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Trang chủ</Link>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-2xl">{topic.emoji}</span>
          <h1 className="text-2xl font-bold text-gray-900">{topic.name}</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          {articles.length} bài trong 24 giờ qua • {topic.description}
        </p>
      </div>

      {/* Topic tabs for quick navigation */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TOPICS.map((t) => (
          <Link
            key={t.slug}
            href={`/topics/${t.slug}`}
            className={`text-sm px-3 py-1.5 rounded-full border transition ${
              t.slug === slug
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {t.emoji} {t.name}
          </Link>
        ))}
      </div>

      {articles.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-400">
          Không có bài viết nào trong 24 giờ qua.
        </div>
      ) : (
        <div className="grid gap-3">
          {articles.map((a) => (
            <a
              key={a.id}
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
              <p className="text-xs text-blue-500 mt-2">Đọc bài gốc →</p>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
