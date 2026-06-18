import { notFound } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { supabase } from '@/lib/supabase'

async function getReport(date: string) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('report_date', date)
    .single()
  if (error) return null
  return data
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function ReportPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const report = await getReport(date)

  if (!report) notFound()

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Danh sách báo cáo</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{formatDate(report.report_date)}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {report.article_count} bài viết · {report.source_count} nguồn
        </p>
      </div>

      <article className="prose prose-sm max-w-none bg-white rounded-lg border border-gray-200 p-6">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {report.raw_markdown}
        </ReactMarkdown>
      </article>
    </div>
  )
}
