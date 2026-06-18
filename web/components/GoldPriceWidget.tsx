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
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
            interval={Math.floor(data.length / 6)} />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false} axisLine={false}
            tickFormatter={fmtVND}
            domain={['auto', 'auto']}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
            formatter={(v) => v === 'actual' ? 'Giá SJC thực tế' : 'AI Dự báo (MA5)'}
          />
          <Line type="monotone" dataKey="actual" stroke="#d97706" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="predicted" stroke="#6366f1" strokeWidth={2}
            strokeDasharray="4 4" dot={false} activeDot={{ r: 4 }} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
