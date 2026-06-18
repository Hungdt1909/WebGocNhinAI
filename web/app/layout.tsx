import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vietnam Market Intelligence',
  description: 'Tin tức & phân tích thị trường Việt Nam hàng ngày',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-bold text-blue-800 text-lg hover:text-blue-600">
              <span>🇻🇳</span>
              <span>Vietnam Market Intel</span>
            </a>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/topics/ai" className="text-gray-600 hover:text-blue-700">🤖 AI</a>
              <a href="/topics/kinh-te" className="text-gray-600 hover:text-blue-700">📊 Kinh tế</a>
              <a href="/topics/vang" className="text-gray-600 hover:text-blue-700">🥇 Vàng</a>
              <a href="/topics/cong-nghe" className="text-gray-600 hover:text-blue-700">🔬 CN</a>
              <a href="/reports" className="text-gray-600 hover:text-blue-700">📋 Báo cáo</a>
            </nav>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
