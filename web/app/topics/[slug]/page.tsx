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

function excerpt(text: string, max = 180) {
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
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 mb-4">
        <Link href="/" className="hover:text-blue-700">Trang chủ</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">{topic.name}</span>
      </div>

      {/* Section header */}
      <div className="border-b-2 border-gray-900 pb-2 mb-6 flex items-baseline justify-between">
        <h1 className="font-black text-sm uppercase tracking-widest text-gray-900">{topic.name}</h1>
        <span className="text-xs text-gray-400">{articles.length} bài trong 24 giờ qua</span>
      </div>

      {/* Topic pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TOPICS.map((t) => (
          <Link
            key={t.slug}
            href={`/topics/${t.slug}`}
            className={`text-xs px-3 py-1 border transition-colors ${
              t.slug === slug
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-600 hover:text-gray-900'
            }`}
          >
            {t.name}
          </Link>
        ))}
      </div>

      {articles.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">Không có bài viết nào trong 24 giờ qua.</p>
      ) : (
        <div className="space-y-5">
          {articles.map((a) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group border-b border-gray-100 pb-5 last:border-0"
            >
              <p className="text-xs text-gray-400 mb-1">
                {a.source} · {timeAgo(a.published_at || a.collected_at)}
              </p>
              <p className="font-bold text-gray-900 group-hover:text-blue-700 leading-snug text-base">
                {a.title}
              </p>
              {a.content && (
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{excerpt(a.content)}</p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
