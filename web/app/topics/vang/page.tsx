import Link from 'next/link'
import { supabase, type Article } from '@/lib/supabase'
import { categorizeArticle } from '@/lib/topics'
import GoldPriceWidget, { type GoldDataPoint } from '@/components/GoldPriceWidget'

// Simple 5-day moving average prediction
function predictPrices(closes: number[]): (number | null)[] {
  return closes.map((_, i) => {
    if (i < 4) return null
    const window = closes.slice(i - 4, i + 1)
    const avg = window.reduce((a, b) => a + b, 0) / window.length
    const trend = (window[4] - window[0]) / 4
    return Math.round(avg + trend * 0.5)
  })
}

async function fetchGoldData(): Promise<GoldDataPoint[]> {
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=30d',
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const json = await res.json()
    const result = json.chart.result[0]
    const timestamps: number[] = result.timestamp
    const closes: number[] = result.indicators.quote[0].close

    const valid = timestamps
      .map((ts, i) => ({ ts, price: closes[i] }))
      .filter(d => d.price != null)

    const prices = valid.map(d => d.price)
    const predicted = predictPrices(prices)

    return valid.map((d, i) => ({
      date: new Date(d.ts * 1000).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      actual: Math.round(d.price),
      predicted: predicted[i],
    }))
  } catch {
    return []
  }
}

async function fetchGoldInsights() {
  const { data } = await supabase
    .from('reports')
    .select('report_date, watch_list, predictions')
    .order('report_date', { ascending: false })
    .limit(1)
    .single()
  if (!data) return null

  type WatchItem = { item: string; reason: string; trigger?: string }
  type Forecast = { sector: string; prediction: string; confidence: string }
  type Predictions = { forecasts: Forecast[]; macro_outlook?: string }

  const watchList: WatchItem[] = Array.isArray(data.watch_list) ? data.watch_list : []
  const preds: Predictions = data.predictions ?? { forecasts: [] }

  const goldKeywords = ['vàng', 'gold', 'xau', 'kim loại', 'fed', 'usd']
  const relevantWatch = watchList.filter(w =>
    goldKeywords.some(k => (w.item + w.reason).toLowerCase().includes(k))
  )
  const relevantForecasts = (preds.forecasts ?? []).filter(f =>
    goldKeywords.some(k => (f.sector + f.prediction).toLowerCase().includes(k))
  )

  return { date: data.report_date, relevantWatch, relevantForecasts, macroOutlook: preds.macro_outlook }
}

async function fetchGoldArticles(): Promise<Article[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('articles')
    .select('*')
    .gte('collected_at', since)
    .order('published_at', { ascending: false })
    .limit(200)

  return (data ?? []).filter(a => categorizeArticle(a.title, a.source) === 'vang')
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

export default async function VangPage() {
  const [goldData, insights, articles] = await Promise.all([
    fetchGoldData(),
    fetchGoldInsights(),
    fetchGoldArticles(),
  ])

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
        <Link href="/" className="hover:text-blue-700">Trang chủ</Link>
        <span>/</span>
        <span className="text-gray-600">Vàng</span>
      </div>

      {/* Price chart section */}
      <section className="mb-10">
        <div className="border-b-2 border-gray-900 pb-2 mb-6">
          <h1 className="font-black text-sm uppercase tracking-widest text-gray-900">Giá vàng thế giới</h1>
        </div>

        {goldData.length > 0 ? (
          <GoldPriceWidget data={goldData} />
        ) : (
          <p className="text-gray-400 text-sm py-4">Không thể tải dữ liệu giá vàng.</p>
        )}
      </section>

      {/* AI Gold Prediction section */}
      {insights && (insights.relevantWatch.length > 0 || insights.relevantForecasts.length > 0) && (
        <section className="mb-10">
          <div className="border-b-2 border-gray-900 pb-2 mb-5">
            <h2 className="font-black text-sm uppercase tracking-widest text-gray-900">
              AI Nhận định — {insights.date}
            </h2>
          </div>

          {insights.relevantWatch.map((w, i) => (
            <div key={i} className="bg-amber-50 border border-amber-200 rounded p-4 mb-4">
              <p className="font-bold text-gray-900 mb-1.5">{w.item}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{w.reason}</p>
              {w.trigger && (
                <p className="text-xs text-amber-700 mt-2">
                  <span className="font-semibold">Tín hiệu cần theo dõi:</span> {w.trigger}
                </p>
              )}
            </div>
          ))}

          {insights.relevantForecasts.map((f, i) => (
            <div key={i} className="border border-gray-200 rounded p-4 mb-4">
              <p className="font-bold text-gray-900 mb-1">{f.sector}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{f.prediction}</p>
            </div>
          ))}
        </section>
      )}

      {/* Gold articles */}
      <section>
        <div className="border-b-2 border-gray-900 pb-2 mb-5 flex items-baseline justify-between">
          <h2 className="font-black text-sm uppercase tracking-widest text-gray-900">Tin tức vàng hôm nay</h2>
          <span className="text-xs text-gray-400">{articles.length} bài</span>
        </div>

        {articles.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">Không có bài viết nào trong 24 giờ qua.</p>
        ) : (
          <div className="space-y-5">
            {articles.map(a => (
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
                <p className="font-bold text-gray-900 group-hover:text-blue-700 leading-snug">
                  {a.title}
                </p>
                {a.content && (
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{excerpt(a.content)}</p>
                )}
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
