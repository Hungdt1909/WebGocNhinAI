import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'Vietnam Market Intelligence',
  description: 'Tin tức & phân tích thị trường Việt Nam hàng ngày',
  icons: { icon: '/favicon.svg' },
}

function BarChartIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect width="32" height="32" rx="6" fill="#003087"/>
      <rect x="4" y="18" width="5" height="10" rx="1" fill="white" opacity="0.9"/>
      <rect x="11" y="12" width="5" height="16" rx="1" fill="white"/>
      <rect x="18" y="8" width="5" height="20" rx="1" fill="#f59e0b"/>
      <rect x="25" y="4" width="5" height="24" rx="1" fill="#f59e0b" opacity="0.8"/>
    </svg>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric',
  })

  return (
    <html lang="vi">
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-white">
          <div className="bg-gray-900 text-gray-300 text-xs py-1.5">
            <div className="max-w-5xl mx-auto px-4">{today}</div>
          </div>

          <div className="border-b-2 border-gray-900 py-4">
            <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-3">
              <BarChartIcon />
              <a href="/" className="font-black text-3xl tracking-tight text-gray-900 uppercase leading-none">
                Vietnam Market Intelligence
              </a>
              <BarChartIcon />
            </div>
          </div>

          <NavBar />
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>

        <footer className="border-t border-gray-200 mt-12 py-6 text-center text-xs text-gray-400 bg-white">
          Vietnam Market Intelligence — Dữ liệu cập nhật tự động mỗi ngày
        </footer>
      </body>
    </html>
  )
}
