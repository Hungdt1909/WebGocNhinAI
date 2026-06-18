import Link from 'next/link'
import { supabase } from '@/lib/supabase'

async function getReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('report_date, article_count, source_count')
    .order('report_date', { ascending: false })
    .limit(30)
  if (error) throw error
  return data ?? []
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default async function ReportsPage() {
  let reports: Awaited<ReturnType<typeof getReports>> = []
  let fetchError: string | null = null

  try {
    reports = await getReports()
  } catch (e) {
    fetchError = e instanceof Error ? e.message : 'Lỗi không xác định'
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Trang chủ</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Báo cáo phân tích AI</h1>
        <p className="text-gray-500 text-sm mt-1">Phân tích thị trường tổng hợp do AI tạo ra mỗi ngày</p>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-4">
          Không thể tải dữ liệu: {fetchError}
        </div>
      )}

      {reports.length === 0 && !fetchError && (
        <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
          Chưa có báo cáo nào. Pipeline sẽ tạo báo cáo vào mỗi sáng.
        </div>
      )}

      <div className="space-y-3">
        {reports.map((r) => (
          <Link
            key={r.report_date}
            href={`/reports/${r.report_date}`}
            className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold text-gray-900">{formatDate(r.report_date)}</div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {r.article_count ?? 0} bài viết · {r.source_count ?? 0} nguồn
                </div>
              </div>
              <span className="text-blue-600 text-sm shrink-0">Xem →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
