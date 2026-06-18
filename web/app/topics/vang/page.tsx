import Link from 'next/link'
import { supabase, type Article } from '@/lib/supabase'
import { categorizeArticle } from '@/lib/topics'
import GoldPriceWidget, { type GoldDataPoint } from '@/components/GoldPriceWidget'

const LUONG_PER_OZ = 1.2057   // 1 lượng = 37.5g = 1.2057 troy oz
const SJC_PREMIUM = 10_000_000 // ~10 triệu phụ trội SJC so với quốc tế

// --- Data fetching ---

async function fetchRawGold(): Promise<{ timestamps: number[]; closes: number[] }> {
  const res = await fetch(
    'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=30d',
    { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 3600 } }
  )
  const json = await res.json()
  const r = json.chart.result[0]
  return { timestamps: r.timestamp, closes: r.indicators.quote[0].close }
}

async function fetchUSDVND(): Promise<number> {
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/USDVND=X?interval=1d&range=5d',
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 3600 } }
    )
    const json = await res.json()
    const closes: number[] = json.chart.result[0].indicators.quote[0].close
    const valid = closes.filter(Boolean)
    return valid[valid.length - 1] ?? 25500
  } catch { return 25500 }
}

function toSJC(xauUSD: number, usdVND: number): number {
  return Math.round(xauUSD * LUONG_PER_OZ * usdVND + SJC_PREMIUM)
}

// Linear regression slope & intercept
function linReg(y: number[]) {
  const n = y.length
  const xMean = (n - 1) / 2
  const yMean = y.reduce((a, b) => a + b, 0) / n
  const slope = y.reduce((s, yi, i) => s + (i - xMean) * (yi - yMean), 0) /
    y.reduce((s, _, i) => s + (i - xMean) ** 2, 0)
  return { slope, intercept: yMean - slope * xMean }
}

type ForecastDay = { label: string; price: number; change: number }

function buildForecast(prices: number[], usdVND: number, lastDate: Date): ForecastDay[] {
  const recent = prices.slice(-10)
  const { slope, intercept } = linReg(recent)
  const lastActual = prices[prices.length - 1]

  return Array.from({ length: 5 }, (_, i) => {
    const predictedXAU = intercept + slope * (recent.length + i)
    const sjcPrice = toSJC(predictedXAU, usdVND)
    const prev = i === 0 ? lastActual : toSJC(intercept + slope * (recent.length + i - 1), usdVND)
    const d = new Date(lastDate)
    d.setDate(d.getDate() + i + 1)
    // skip weekends
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
    return {
      label: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      price: sjcPrice,
      change: sjcPrice - prev,
    }
  })
}

async function buildGoldData(usdVND: number): Promise<{
  chartData: GoldDataPoint[]
  forecast: ForecastDay[]
  lastXAU: number
  slope: number
  lastDate: Date
}> {
  const { timestamps, closes } = await fetchRawGold()
  const valid = timestamps.map((ts, i) => ({ ts, xau: closes[i] })).filter(d => d.xau != null)
  const prices = valid.map(d => d.xau)
  const { slope } = linReg(prices.slice(-10))

  // predicted using MA5 + half-trend
  const predicted = prices.map((_, i) => {
    if (i < 4) return null
    const w = prices.slice(i - 4, i + 1)
    const avg = w.reduce((a, b) => a + b, 0) / 5
    const trend = (w[4] - w[0]) / 4
    return toSJC(avg + trend * 0.5, usdVND)
  })

  const chartData: GoldDataPoint[] = valid.map((d, i) => ({
    date: new Date(d.ts * 1000).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    actual: toSJC(d.xau, usdVND),
    predicted: predicted[i],
  }))

  const lastDate = new Date(valid[valid.length - 1].ts * 1000)
  const forecast = buildForecast(prices, usdVND, lastDate)

  return { chartData, forecast, lastXAU: prices[prices.length - 1], slope, lastDate }
}

async function fetchGoldInsights() {
  const { data } = await supabase
    .from('reports')
    .select('report_date, watch_list, predictions, top_events')
    .order('report_date', { ascending: false })
    .limit(1)
    .single()
  if (!data) return null

  type WatchItem = { item: string; reason: string; trigger?: string }
  type Forecast = { sector: string; prediction: string; confidence: string }
  type Event = { rank: number; title: string; summary: string }
  const watchList: WatchItem[] = data.watch_list ?? []
  const forecasts: Forecast[] = data.predictions?.forecasts ?? []
  const topEvents: Event[] = data.top_events ?? []

  const keywords = ['vàng', 'gold', 'xau', 'usd', 'fed', 'tỷ giá', 'kim loại', 'lạm phát']
  const isGoldRelated = (s: string) => keywords.some(k => s.toLowerCase().includes(k))

  return {
    date: data.report_date,
    watches: watchList.filter(w => isGoldRelated(w.item + w.reason)),
    forecasts: forecasts.filter(f => isGoldRelated(f.sector + f.prediction)),
    events: topEvents.filter(e => isGoldRelated(e.title + e.summary)).slice(0, 3),
  }
}

async function fetchGoldArticles(): Promise<Article[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('articles').select('*').gte('collected_at', since)
    .order('published_at', { ascending: false }).limit(200)
  return (data ?? []).filter(a => categorizeArticle(a.title, a.source) === 'vang')
}

function timeAgo(d: string) {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3_600_000)
  if (h < 1) return 'Vừa xong'; if (h < 24) return `${h}h trước`; return `${Math.floor(h / 24)}d trước`
}
function excerpt(t: string, max = 160) {
  const c = t.replace(/\s+/g, ' ').trim(); return c.length <= max ? c : c.slice(0, max) + '…'
}
function fmt(n: number) { return (n / 1_000_000).toFixed(2) + ' triệu ₫' }

// --- Page ---

export default async function VangPage() {
  const [usdVND, insights, articles] = await Promise.all([
    fetchUSDVND(),
    fetchGoldInsights(),
    fetchGoldArticles(),
  ])
  const { chartData, forecast, lastXAU, slope, lastDate } = await buildGoldData(usdVND)

  const latestSJC = chartData[chartData.length - 1]?.actual ?? 0
  const trendDir = slope > 5 ? 'tăng' : slope < -5 ? 'giảm' : 'đi ngang'
  const trendStrong = Math.abs(slope) > 15

  // Build prediction article content
  const insightFactors = [
    ...(insights?.watches ?? []).map(w => w.item),
    ...(insights?.forecasts ?? []).map(f => f.sector),
  ].slice(0, 4)

  return (
    <div>
      <div className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
        <Link href="/" className="hover:text-blue-700">Trang chủ</Link>
        <span>/</span>
        <span className="text-gray-600">Vàng</span>
      </div>

      {/* Chart & table */}
      <section className="mb-10">
        <div className="border-b-2 border-gray-900 pb-2 mb-6">
          <h1 className="font-black text-sm uppercase tracking-widest text-gray-900">Giá vàng SJC — Việt Nam</h1>
        </div>
        {chartData.length > 0
          ? <GoldPriceWidget data={chartData} />
          : <p className="text-gray-400 text-sm">Không thể tải dữ liệu.</p>
        }
      </section>

      {/* 5-day prediction article */}
      <section className="mb-10">
        <div className="border-b-2 border-gray-900 pb-2 mb-6">
          <h2 className="font-black text-sm uppercase tracking-widest text-gray-900">
            Dự báo giá vàng SJC 5 ngày tới
          </h2>
        </div>

        {/* Lead */}
        <div className="bg-indigo-50 border-l-4 border-indigo-600 px-4 py-3 rounded-r mb-6">
          <p className="text-gray-800 leading-relaxed text-sm">
            Dựa trên diễn biến giá vàng quốc tế (XAU/USD hiện tại ~${lastXAU.toFixed(0)}/oz),
            tỷ giá USD/VND (~{usdVND.toLocaleString('vi-VN')} đồng) và xu hướng{' '}
            <strong>{trendDir}{trendStrong ? ' mạnh' : ''}</strong> trong 10 phiên gần đây,
            mô hình dự báo giá vàng SJC cho 5 ngày tới như sau:
          </p>
        </div>

        {/* Forecast table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left py-2 text-xs font-black uppercase tracking-widest text-gray-500">Ngày</th>
                <th className="text-right py-2 text-xs font-black uppercase tracking-widest text-indigo-600">Giá dự báo (SJC)</th>
                <th className="text-right py-2 text-xs font-black uppercase tracking-widest text-gray-400">So hôm nay</th>
                <th className="text-right py-2 text-xs font-black uppercase tracking-widest text-gray-400">Xu hướng</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((f, i) => {
                const vsToday = f.price - latestSJC
                return (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2.5 font-medium text-gray-700">{f.label}</td>
                    <td className="py-2.5 text-right font-bold text-gray-900">{fmt(f.price)}</td>
                    <td className={`py-2.5 text-right text-xs font-semibold ${vsToday >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {vsToday >= 0 ? '+' : ''}{(vsToday / 1_000_000).toFixed(2)} tr
                    </td>
                    <td className="py-2.5 text-right text-lg">
                      {f.change > 200_000 ? '▲' : f.change < -200_000 ? '▼' : '→'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Why section */}
        <div>
          <h3 className="font-black text-xs uppercase tracking-widest text-gray-500 mb-4">
            Tại sao lại dự báo như vậy?
          </h3>

          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <div className="border-b border-gray-100 pb-4">
              <span className="font-bold text-gray-900 block mb-1">1. Xu hướng kỹ thuật ({trendDir})</span>
              Hồi quy tuyến tính 10 phiên gần nhất cho thấy giá SJC đang{' '}
              <strong>{trendDir}</strong> với tốc độ{' '}
              ~{Math.abs((slope * LUONG_PER_OZ * usdVND) / 1_000_000).toFixed(2)} triệu/phiên.
              Dự báo giả định xu hướng này duy trì ở mức 50%.
            </div>

            <div className="border-b border-gray-100 pb-4">
              <span className="font-bold text-gray-900 block mb-1">2. Tỷ giá USD/VND</span>
              USD/VND hiện ở mức ~{usdVND.toLocaleString('vi-VN')} đồng.
              Mỗi biến động 100 đồng sẽ tác động ~
              {(lastXAU * LUONG_PER_OZ * 100 / 1_000_000).toFixed(1)} triệu/lượng đến giá SJC.
            </div>

            {insightFactors.length > 0 && (
              <div className="border-b border-gray-100 pb-4">
                <span className="font-bold text-gray-900 block mb-1">3. Yếu tố vĩ mô (AI phân tích)</span>
                Báo cáo AI ngày {insights?.date} nhận định các yếu tố sau đang tác động:{' '}
                <span className="italic">{insightFactors.join('; ')}</span>.
              </div>
            )}

            <div>
              <span className="font-bold text-gray-900 block mb-1">4. Phụ trội SJC</span>
              Giá SJC Việt Nam thường cao hơn giá quốc tế quy đổi do phụ trội thương hiệu và
              chính sách quản lý. Mô hình ước tính phụ trội cố định ~10 triệu/lượng.
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4 italic">
            Lưu ý: Đây là dự báo kỹ thuật dựa trên xu hướng, không phải khuyến nghị đầu tư.
            Giá vàng chịu ảnh hưởng bởi nhiều yếu tố không thể dự báo hoàn toàn.
          </p>
        </div>
      </section>

      {/* AI watch insights */}
      {insights && insights.watches.length > 0 && (
        <section className="mb-10">
          <div className="border-b-2 border-gray-900 pb-2 mb-5">
            <h2 className="font-black text-sm uppercase tracking-widest text-gray-900">
              AI Theo dõi — {insights.date}
            </h2>
          </div>
          {insights.watches.map((w, i) => (
            <div key={i} className="bg-amber-50 border border-amber-200 rounded p-4 mb-4">
              <p className="font-bold text-gray-900 mb-1.5">{w.item}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{w.reason}</p>
              {w.trigger && (
                <p className="text-xs text-amber-700 mt-2">
                  <span className="font-semibold">Tín hiệu:</span> {w.trigger}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* News articles */}
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
              <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                className="block group border-b border-gray-100 pb-5 last:border-0">
                <p className="text-xs text-gray-400 mb-1">{a.source} · {timeAgo(a.published_at || a.collected_at)}</p>
                <p className="font-bold text-gray-900 group-hover:text-blue-700 leading-snug">{a.title}</p>
                {a.content && <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{excerpt(a.content)}</p>}
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
