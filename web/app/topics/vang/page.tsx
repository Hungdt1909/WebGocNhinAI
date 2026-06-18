import Link from 'next/link'
import { supabase, type Article } from '@/lib/supabase'
import { categorizeArticle } from '@/lib/topics'
import GoldPriceWidget, { type GoldDataPoint } from '@/components/GoldPriceWidget'

const LUONG_PER_OZ = 1.2057
const SJC_PREMIUM = 10_000_000

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
  history: { date: string; actual: number; predicted: number | null }[]
  forecast: ForecastDay[]
  lastXAU: number
  slope: number
}> {
  const { timestamps, closes } = await fetchRawGold()
  const valid = timestamps.map((ts, i) => ({ ts, xau: closes[i] })).filter(d => d.xau != null)
  const prices = valid.map(d => d.xau)
  const { slope } = linReg(prices.slice(-10))

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

  const history = [...chartData].reverse().slice(0, 10)
  const lastDate = new Date(valid[valid.length - 1].ts * 1000)
  const forecast = buildForecast(prices, usdVND, lastDate)

  return { chartData, history, forecast, lastXAU: prices[prices.length - 1], slope }
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
  const watchList: WatchItem[] = data.watch_list ?? []
  const forecasts: Forecast[] = data.predictions?.forecasts ?? []

  const keywords = ['vàng', 'gold', 'xau', 'usd', 'fed', 'tỷ giá', 'kim loại', 'lạm phát']
  const isGold = (s: string) => keywords.some(k => s.toLowerCase().includes(k))

  return {
    date: data.report_date,
    watches: watchList.filter(w => isGold(w.item + w.reason)),
    forecasts: forecasts.filter(f => isGold(f.sector + f.prediction)),
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
  if (h < 1) return 'Vừa xong'
  if (h < 24) return `${h}h trước`
  return `${Math.floor(h / 24)}d trước`
}
function excerpt(t: string, max = 140) {
  const c = t.replace(/\s+/g, ' ').trim()
  return c.length <= max ? c : c.slice(0, max) + '…'
}
function fmtM(n: number) { return (n / 1_000_000).toFixed(2) }

// --- Page ---

export default async function VangPage() {
  const [usdVND, insights, articles] = await Promise.all([
    fetchUSDVND(),
    fetchGoldInsights(),
    fetchGoldArticles(),
  ])
  const { chartData, history, forecast, lastXAU, slope } = await buildGoldData(usdVND)

  const latestSJC = chartData[chartData.length - 1]?.actual ?? 0
  const prevSJC   = chartData[chartData.length - 2]?.actual ?? latestSJC
  const change    = latestSJC - prevSJC
  const changePct = prevSJC ? ((change / prevSJC) * 100).toFixed(2) : '0'
  const trendDir  = slope > 5 ? 'tăng' : slope < -5 ? 'giảm' : 'đi ngang'
  const trendStrong = Math.abs(slope) > 15

  const insightFactors = [
    ...(insights?.watches ?? []).map(w => w.item),
    ...(insights?.forecasts ?? []).map(f => f.sector),
  ].slice(0, 3)

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 mb-5 flex items-center gap-1.5">
        <Link href="/" className="hover:text-blue-700">Trang chủ</Link>
        <span>/</span>
        <span className="text-gray-600">Vàng</span>
      </div>

      {/* ── Hero price header ── */}
      <div className="border-b-2 border-gray-900 pb-4 mb-6">
        <h1 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-2">
          Giá vàng SJC — Việt Nam
        </h1>
        <div className="flex flex-wrap items-baseline gap-4">
          <span className="text-4xl font-black text-gray-900">
            {fmtM(latestSJC)} triệu ₫
          </span>
          <span className={`text-base font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '▲' : '▼'} {Math.abs(change / 1_000_000).toFixed(2)} tr ({change >= 0 ? '+' : ''}{changePct}%)
          </span>
          <span className="text-sm text-gray-400">mỗi lượng (37,5g)</span>
        </div>
        <div className="flex gap-6 mt-3 text-xs text-gray-500">
          <span>XAU/USD <strong className="text-gray-800">${lastXAU.toFixed(0)}</strong></span>
          <span>USD/VND <strong className="text-gray-800">{usdVND.toLocaleString('vi-VN')}</strong></span>
          <span>Xu hướng <strong className={trendStrong ? (slope > 0 ? 'text-green-700' : 'text-red-700') : 'text-gray-700'}>
            {trendDir}{trendStrong ? ' mạnh' : ''}
          </strong></span>
        </div>
      </div>

      {/* ── 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* LEFT — chart + history + news */}
        <div className="lg:col-span-3 space-y-8">

          {/* Chart */}
          <section>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
              Biểu đồ 30 ngày
            </p>
            {chartData.length > 0
              ? <GoldPriceWidget data={chartData} />
              : <p className="text-gray-400 text-sm">Không thể tải dữ liệu biểu đồ.</p>
            }
            <p className="text-xs text-gray-400 mt-2">
              Nguồn: Yahoo Finance (GC=F, USDVND=X) · Cập nhật mỗi giờ
            </p>
          </section>

          {/* 10-day history */}
          <section>
            <div className="border-b-2 border-gray-900 pb-2 mb-4">
              <p className="font-black text-xs uppercase tracking-widest text-gray-900">Lịch sử 10 phiên gần nhất</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1.5 text-xs text-gray-400 font-semibold">Ngày</th>
                  <th className="text-right py-1.5 text-xs text-amber-600 font-semibold">Giá SJC (triệu ₫)</th>
                  <th className="text-right py-1.5 text-xs text-indigo-500 font-semibold">AI Dự báo</th>
                  <th className="text-right py-1.5 text-xs text-gray-400 font-semibold">±</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, i, arr) => {
                  const prev = arr[i + 1]
                  const chg = prev ? (row.actual - prev.actual) / 1_000_000 : 0
                  return (
                    <tr key={row.date} className={`border-b border-gray-50 ${i === 0 ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                      <td className={`py-2 text-xs ${i === 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                        {row.date}{i === 0 && <span className="ml-1.5 text-amber-600 text-[10px]">Mới nhất</span>}
                      </td>
                      <td className={`py-2 text-right font-semibold ${i === 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {fmtM(row.actual)}
                      </td>
                      <td className="py-2 text-right text-xs text-indigo-500">
                        {row.predicted ? fmtM(row.predicted) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className={`py-2 text-right text-xs font-medium ${chg > 0 ? 'text-green-600' : chg < 0 ? 'text-red-500' : 'text-gray-300'}`}>
                        {chg !== 0 ? `${chg > 0 ? '+' : ''}${chg.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>

          {/* News */}
          <section>
            <div className="border-b-2 border-gray-900 pb-2 mb-4 flex items-baseline justify-between">
              <p className="font-black text-xs uppercase tracking-widest text-gray-900">Tin tức vàng hôm nay</p>
              <span className="text-xs text-gray-400">{articles.length} bài</span>
            </div>
            {articles.length === 0 ? (
              <p className="text-gray-400 text-sm py-4">Không có bài viết nào trong 24 giờ qua.</p>
            ) : (
              <div className="space-y-4">
                {articles.map(a => (
                  <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                    className="block group border-b border-gray-100 pb-4 last:border-0">
                    <p className="text-xs text-gray-400 mb-1">{a.source} · {timeAgo(a.published_at || a.collected_at)}</p>
                    <p className="font-bold text-gray-900 group-hover:text-blue-700 leading-snug text-sm">{a.title}</p>
                    {a.content && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{excerpt(a.content)}</p>}
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT — forecast + reasoning + AI insights */}
        <div className="lg:col-span-2 space-y-7">

          {/* Forecast table */}
          <section>
            <div className="border-b-2 border-gray-900 pb-2 mb-4">
              <p className="font-black text-xs uppercase tracking-widest text-gray-900">Dự báo 5 ngày tới</p>
            </div>

            {/* Lead */}
            <div className="bg-indigo-50 border-l-4 border-indigo-500 px-3 py-2.5 rounded-r mb-4">
              <p className="text-xs text-gray-700 leading-relaxed">
                Mô hình hồi quy tuyến tính 10 phiên, xu hướng{' '}
                <strong>{trendDir}{trendStrong ? ' mạnh' : ''}</strong>.
                Tốc độ ~{Math.abs((slope * LUONG_PER_OZ * usdVND) / 1_000_000).toFixed(2)} triệu/phiên.
              </p>
            </div>

            <table className="w-full text-sm mb-2">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-left py-1.5 text-xs text-gray-400 font-semibold">Ngày</th>
                  <th className="text-right py-1.5 text-xs text-indigo-600 font-semibold">Dự báo SJC</th>
                  <th className="text-right py-1.5 text-xs text-gray-400 font-semibold">So hôm nay</th>
                  <th className="text-center py-1.5 text-xs text-gray-400 font-semibold">Hướng</th>
                </tr>
              </thead>
              <tbody>
                {forecast.map((f, i) => {
                  const vsToday = f.price - latestSJC
                  return (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 text-xs font-medium text-gray-700">{f.label}</td>
                      <td className="py-2 text-right font-bold text-gray-900 text-xs">{fmtM(f.price)} tr</td>
                      <td className={`py-2 text-right text-xs font-semibold ${vsToday >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {vsToday >= 0 ? '+' : ''}{(vsToday / 1_000_000).toFixed(2)}
                      </td>
                      <td className="py-2 text-center text-sm">
                        {f.change > 200_000 ? <span className="text-green-600">▲</span>
                          : f.change < -200_000 ? <span className="text-red-500">▼</span>
                          : <span className="text-gray-400">→</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 italic">Không phải khuyến nghị đầu tư.</p>
          </section>

          {/* Why section */}
          <section>
            <div className="border-b-2 border-gray-900 pb-2 mb-4">
              <p className="font-black text-xs uppercase tracking-widest text-gray-900">Tại sao dự báo vậy?</p>
            </div>

            <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
              <div className="border-b border-gray-100 pb-3">
                <span className="font-bold text-gray-900 block mb-0.5">Xu hướng kỹ thuật</span>
                Giá SJC đang <strong>{trendDir}</strong> ~{Math.abs((slope * LUONG_PER_OZ * usdVND) / 1_000_000).toFixed(2)} tr/phiên (hồi quy 10 ngày).
                Dự báo giả định xu hướng duy trì 50%.
              </div>

              <div className="border-b border-gray-100 pb-3">
                <span className="font-bold text-gray-900 block mb-0.5">Tỷ giá USD/VND</span>
                Hiện ~{usdVND.toLocaleString('vi-VN')} ₫.
                Mỗi ±100 ₫ = ±{(lastXAU * LUONG_PER_OZ * 100 / 1_000_000).toFixed(1)} triệu/lượng.
              </div>

              {insightFactors.length > 0 && (
                <div className="border-b border-gray-100 pb-3">
                  <span className="font-bold text-gray-900 block mb-0.5">Yếu tố vĩ mô (AI)</span>
                  <span className="italic">{insightFactors.join('; ')}</span>
                </div>
              )}

              <div>
                <span className="font-bold text-gray-900 block mb-0.5">Phụ trội SJC</span>
                Phụ trội thương hiệu ~10 triệu/lượng so với giá quốc tế quy đổi.
              </div>
            </div>
          </section>

          {/* AI watch */}
          {insights && insights.watches.length > 0 && (
            <section>
              <div className="border-b-2 border-gray-900 pb-2 mb-4">
                <p className="font-black text-xs uppercase tracking-widest text-gray-900">
                  AI Theo dõi · {insights.date}
                </p>
              </div>
              <div className="space-y-3">
                {insights.watches.map((w, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-200 rounded p-3">
                    <p className="font-bold text-gray-900 text-xs mb-1">{w.item}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{w.reason}</p>
                    {w.trigger && (
                      <p className="text-xs text-amber-700 mt-1.5">
                        <span className="font-semibold">Tín hiệu:</span> {w.trigger}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
