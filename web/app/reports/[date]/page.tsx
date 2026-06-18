import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type TopEvent = { rank: number; title: string; summary: string; sources: string[] }
type Trend = { trend: string; significance: string; industries: string[] }
type WatchItem = { item: string; reason: string; trigger: string }
type Forecast = { sector: string; prediction: string; confidence: string }
type Predictions = { forecasts: Forecast[]; timeframe: string; macro_outlook: string }

async function getReport(date: string) {
  const { data } = await supabase
    .from('reports')
    .select('*')
    .eq('report_date', date)
    .single()
  return data
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

const confidenceColor: Record<string, string> = {
  cao: 'bg-green-100 text-green-800',
  'trung bình': 'bg-yellow-100 text-yellow-800',
  thấp: 'bg-red-100 text-red-800',
}

export default async function ReportDetailPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const report = await getReport(date)
  if (!report) notFound()

  const topEvents: TopEvent[] = Array.isArray(report.top_events) ? report.top_events : []
  const trends: Trend[] = Array.isArray(report.emerging_trends) ? report.emerging_trends : []
  const watchList: WatchItem[] = Array.isArray(report.watch_list) ? report.watch_list : []
  const predictions: Predictions | null = report.predictions ?? null

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 mb-5 flex items-center gap-1.5">
        <Link href="/" className="hover:text-blue-700">Trang chủ</Link>
        <span>/</span>
        <Link href="/reports" className="hover:text-blue-700">Báo cáo AI</Link>
        <span>/</span>
        <span className="text-gray-600">{formatDate(report.report_date)}</span>
      </div>

      {/* Header */}
      <div className="border-b-2 border-gray-900 pb-3 mb-8 flex items-baseline justify-between">
        <h1 className="font-black text-sm uppercase tracking-widest text-gray-900">
          Báo cáo thị trường
        </h1>
        <span className="text-sm text-gray-500">
          {formatDate(report.report_date)} · {report.article_count} bài · {report.source_count} nguồn
        </span>
      </div>

      {/* Top Events */}
      <section className="mb-10">
        <h2 className="font-black text-xs uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-2 mb-5">
          10 Sự kiện nổi bật
        </h2>
        <div className="space-y-4">
          {topEvents.map((ev) => (
            <Link
              key={ev.rank}
              href={`/reports/${date}/events/${ev.rank}`}
              className="block group border border-gray-200 p-4 hover:border-blue-400 hover:shadow-sm transition-all rounded"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                    Sự kiện {ev.rank}
                  </span>
                  <p className="font-bold text-gray-900 group-hover:text-blue-700 mt-1 leading-snug">
                    {ev.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{ev.summary}</p>
                  {ev.sources?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">Nguồn: {ev.sources.join(' · ')}</p>
                  )}
                </div>
                <span className="text-xs text-blue-600 shrink-0 pt-6">Chi tiết →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Emerging Trends */}
      {trends.length > 0 && (
        <section className="mb-10">
          <h2 className="font-black text-xs uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-2 mb-5">
            Xu hướng nổi bật
          </h2>
          <div className="space-y-5">
            {trends.map((t, i) => (
              <div key={i} className="border-l-4 border-cyan-500 pl-4">
                <p className="font-bold text-gray-900">{t.trend}</p>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{t.significance}</p>
                {t.industries?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {t.industries.map((ind, j) => (
                      <span key={j} className="text-xs border border-gray-300 px-2 py-0.5 text-gray-500">
                        {ind}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Watch List */}
      {watchList.length > 0 && (
        <section className="mb-10">
          <h2 className="font-black text-xs uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-2 mb-5">
            Danh sách theo dõi
          </h2>
          <div className="space-y-4">
            {watchList.map((w, i) => (
              <div key={i} className="bg-amber-50 border border-amber-200 p-4 rounded">
                <p className="font-bold text-gray-900">{w.item}</p>
                <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{w.reason}</p>
                {w.trigger && (
                  <p className="text-xs text-amber-700 mt-2">
                    <span className="font-semibold">Tín hiệu cần chú ý:</span> {w.trigger}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Predictions */}
      {predictions && (
        <section className="mb-10">
          <h2 className="font-black text-xs uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-2 mb-5">
            Dự báo {predictions.timeframe}
          </h2>
          {predictions.macro_outlook && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded mb-5">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">Tổng quan vĩ mô</p>
              <p className="text-sm text-gray-700 leading-relaxed">{predictions.macro_outlook}</p>
            </div>
          )}
          <div className="space-y-4">
            {predictions.forecasts?.map((f, i) => (
              <div key={i} className="border border-gray-200 p-4 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-gray-900 text-sm">{f.sector}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${confidenceColor[f.confidence] ?? 'bg-gray-100 text-gray-600'}`}>
                    {f.confidence}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{f.prediction}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
