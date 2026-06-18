'use client'

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'

export type GoldDataPoint = {
  date: string
  actual: number        // VND/lượng
  predicted: number | null
}

function fmtVND(v: number) {
  return `${(v / 1_000_000).toFixed(1)} tr`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded p-3 text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'actual' ? 'Thực tế' : 'AI dự báo'}:{' '}
          <strong>{(p.value / 1_000_000).toFixed(2)} triệu ₫</strong>
        </p>
      ))}
    </div>
  )
}

export default function GoldPriceWidget({ data }: { data: GoldDataPoint[] }) {
  const latest = data[data.length - 1]
  const prev = data[data.length - 2]
  const change = latest && prev ? latest.actual - prev.actual : 0
  const changePct = prev ? ((change / prev.actual) * 100).toFixed(2) : '0'

  return (
    <div>
      {/* Current price */}
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-3xl font-black text-gray-900">
          {(latest?.actual / 1_000_000).toFixed(2)} triệu ₫
        </span>
        <span className="text-sm text-gray-400">SJC · mỗi lượng (37,5g)</span>
        <span className={`text-sm font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change / 1_000_000).toFixed(2)}tr ({change >= 0 ? '+' : ''}{changePct}%)
        </span>
      </div>

      {/* Chart */}
      <div className="h-56 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false} axisLine={false}
              tickFormatter={fmtVND}
              domain={['auto', 'auto']}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              formatter={(v) => v === 'actual' ? 'Giá SJC thực tế' : 'AI Dự báo'}
            />
            <Line type="monotone" dataKey="actual" stroke="#d97706" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="predicted" stroke="#6366f1" strokeWidth={2}
              strokeDasharray="4 4" dot={false} activeDot={{ r: 4 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-900">
              <th className="text-left py-2 text-xs font-black uppercase tracking-widest text-gray-500">Ngày</th>
              <th className="text-right py-2 text-xs font-black uppercase tracking-widest text-amber-600">Giá SJC (triệu ₫)</th>
              <th className="text-right py-2 text-xs font-black uppercase tracking-widest text-indigo-600">AI Dự báo</th>
              <th className="text-right py-2 text-xs font-black uppercase tracking-widest text-gray-400">Biến động</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().slice(0, 10).map((row, i, arr) => {
              const prevRow = arr[i + 1]
              const chg = prevRow ? (row.actual - prevRow.actual) / 1_000_000 : 0
              return (
                <tr key={row.date} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 text-gray-600">{row.date}</td>
                  <td className="py-2 text-right font-semibold text-gray-900">
                    {(row.actual / 1_000_000).toFixed(2)}
                  </td>
                  <td className="py-2 text-right text-indigo-600">
                    {row.predicted ? (row.predicted / 1_000_000).toFixed(2) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className={`py-2 text-right text-xs font-medium ${chg > 0 ? 'text-green-600' : chg < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {chg !== 0 ? `${chg > 0 ? '+' : ''}${chg.toFixed(2)}` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-2">
          Giá ước tính từ XAU/USD × tỷ giá USD/VND × 1.2057 lượng/oz + phụ trội SJC
        </p>
      </div>
    </div>
  )
}
