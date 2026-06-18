import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase, type Article } from '@/lib/supabase'
import { categorizeArticle, getTopicBySlug } from '@/lib/topics'

const HANOI_KEYWORDS = [
  'hà nội', 'hanoi', 'thủ đô', 'hanoï',
]

function isHanoi(article: Article) {
  const lower = (article.title + ' ' + (article.content ?? '')).toLowerCase()
  return HANOI_KEYWORDS.some((kw) => lower.includes(kw))
}

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

function ArticleList({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null
  return (
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
  )
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const topic = getTopicBySlug(slug)
  if (!topic) notFound()

  const all = await getArticles()
  const articles = all.filter((a) => categorizeArticle(a.title, a.source) === slug)

  const isKinhTe = slug === 'kinh-te'
  const hanoiArticles = isKinhTe ? articles.filter(isHanoi) : []
  const otherArticles = isKinhTe ? articles.filter((a) => !isHanoi(a)) : articles

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
        <Link href="/" className="hover:text-blue-700">Trang chủ</Link>
        <span>/</span>
        <span className="text-gray-600">{topic.name}</span>
      </div>

      {/* Section header */}
      <div className="border-b-2 border-gray-900 pb-2 mb-6 flex items-baseline justify-between">
        <h1 className="font-black text-sm uppercase tracking-widest text-gray-900">{topic.name}</h1>
        <span className="text-xs text-gray-400">{articles.length} bài trong 24 giờ qua</span>
      </div>

      {isKinhTe ? (
        <>
          {/* Hà Nội section */}
          {hanoiArticles.length > 0 && (
            <section className="mb-10">
              <div className="flex items-baseline justify-between border-b border-gray-200 pb-2 mb-5">
                <h2 className="font-black text-xs uppercase tracking-widest text-red-700">
                  Hà Nội
                </h2>
                <span className="text-xs text-gray-400">{hanoiArticles.length} bài</span>
              </div>
              <ArticleList articles={hanoiArticles} />
            </section>
          )}

          {/* Other kinh-te */}
          {otherArticles.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between border-b border-gray-200 pb-2 mb-5">
                <h2 className="font-black text-xs uppercase tracking-widest text-gray-500">
                  Toàn quốc
                </h2>
                <span className="text-xs text-gray-400">{otherArticles.length} bài</span>
              </div>
              <ArticleList articles={otherArticles} />
            </section>
          )}
        </>
      ) : (
        articles.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">Không có bài viết nào trong 24 giờ qua.</p>
        ) : (
          <ArticleList articles={articles} />
        )
      )}
    </div>
  )
}
