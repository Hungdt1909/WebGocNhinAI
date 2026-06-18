import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type TopEvent = {
  rank: number
  title: string
  summary: string
  sources: string[]
  why_matters?: string
  risks?: string[]
  opportunities?: string[]
  affected?: string[]
}

async function getEvent(date: string, rank: number): Promise<{ event: TopEvent; reportDate: string } | null> {
  const { data } = await supabase
    .from('reports')
    .select('report_date, top_events')
    .eq('report_date', date)
    .single()

  if (!data) return null

  const events: TopEvent[] = Array.isArray(data.top_events) ? data.top_events : []
  const event = events.find((e) => e.rank === rank)
  if (!event) return null

  return { event, reportDate: data.report_date }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ date: string; rank: string }>
}) {
  const { date, rank } = await params
  const rankNum = parseInt(rank, 10)
  if (isNaN(rankNum)) notFound()

  const result = await getEvent(date, rankNum)
  if (!result) notFound()

  const { event, reportDate } = result

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 mb-5 flex items-center gap-1.5">
        <Link href="/" className="hover:text-blue-700">Trang chủ</Link>
        <span>/</span>
        <Link href="/reports" className="hover:text-blue-700">Báo cáo AI</Link>
        <span>/</span>
        <Link href={`/reports/${date}`} className="hover:text-blue-700">{formatDate(reportDate)}</Link>
        <span>/</span>
        <span className="text-gray-600">Sự kiện {rankNum}</span>
      </div>

      {/* Header */}
      <div className="border-b-2 border-gray-900 pb-3 mb-6">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-wide block mb-2">
          Sự kiện {event.rank} — {formatDate(reportDate)}
        </span>
        <h1 className="text-2xl font-black text-gray-900 leading-snug">{event.title}</h1>
      </div>

      {/* Summary */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Tóm tắt</h2>
        <p className="text-gray-800 leading-relaxed">{event.summary}</p>
      </section>

      {/* Why it matters */}
      {event.why_matters && (
        <section className="mb-6 bg-blue-50 border-l-4 border-blue-600 px-4 py-3 rounded-r">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-2">Tại sao quan trọng</h2>
          <p className="text-gray-800 text-sm leading-relaxed">{event.why_matters}</p>
        </section>
      )}

      {/* Risks */}
      {event.risks && event.risks.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-red-600 mb-3">Rủi ro</h2>
          <ul className="space-y-2">
            {event.risks.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-red-500 mt-0.5 shrink-0">▸</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Opportunities */}
      {event.opportunities && event.opportunities.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-green-700 mb-3">Cơ hội</h2>
          <ul className="space-y-2">
            {event.opportunities.map((o, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-green-600 mt-0.5 shrink-0">▸</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Affected */}
      {event.affected && event.affected.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Đối tượng bị ảnh hưởng</h2>
          <div className="flex flex-wrap gap-2">
            {event.affected.map((a, i) => (
              <span key={i} className="text-xs border border-gray-300 px-2 py-1 text-gray-600">
                {a}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Sources */}
      {event.sources && event.sources.length > 0 && (
        <section className="mb-8 pt-4 border-t border-gray-200">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Nguồn</h2>
          <p className="text-sm text-gray-500">{event.sources.join(' · ')}</p>
        </section>
      )}

      {/* Nav between events */}
      <div className="flex justify-between pt-4 border-t border-gray-200 text-sm">
        {rankNum > 1 ? (
          <Link href={`/reports/${date}/events/${rankNum - 1}`} className="text-blue-700 hover:underline">
            ← Sự kiện {rankNum - 1}
          </Link>
        ) : <span />}
        <Link href={`/reports/${date}/events/${rankNum + 1}`} className="text-blue-700 hover:underline">
          Sự kiện {rankNum + 1} →
        </Link>
      </div>
    </div>
  )
}
