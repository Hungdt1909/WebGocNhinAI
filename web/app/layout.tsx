import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vietnam Market Intelligence',
  description: 'Tin tức & phân tích thị trường Việt Nam hàng ngày',
  icons: { icon: '/favicon.svg' },
}

const NAV = [
  { href: '/', label: null, color: 'hover:text-gray-900' },
  { href: '/topics/kinh-te', label: 'Kinh tế', color: 'hover:text-green-700 hover:border-b-2 hover:border-green-700' },
  { href: '/topics/ai', label: 'Trí tuệ nhân tạo', color: 'hover:text-violet-700 hover:border-b-2 hover:border-violet-700' },
  { href: '/topics/vang', label: 'Vàng', color: 'hover:text-amber-600 hover:border-b-2 hover:border-amber-600' },
  { href: '/topics/cong-nghe', label: 'Khoa học & Công nghệ', color: 'hover:text-cyan-700 hover:border-b-2 hover:border-cyan-700' },
  { href: '/reports', label: 'Báo cáo AI', color: 'hover:text-red-600 hover:border-b-2 hover:border-red-600' },
]

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 12L12 3L21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 10V20C5 20.55 5.45 21 6 21H10V15H14V21H18C18.55 21 19 20.55 19 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
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
          {/* Top date bar */}
          <div className="bg-gray-900 text-gray-300 text-xs py-1.5">
            <div className="max-w-5xl mx-auto px-4">{today}</div>
          </div>

          {/* Brand */}
          <div className="border-b-2 border-gray-900 py-4">
            <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-3">
              <BarChartIcon />
              <a href="/" className="font-black text-3xl tracking-tight text-gray-900 uppercase leading-none">
                Vietnam Market Intelligence
              </a>
              <BarChartIcon />
            </div>
          </div>

          {/* Nav */}
          <nav className="border-b border-gray-200 bg-white">
            <div className="max-w-5xl mx-auto px-4">
              <ul className="flex justify-center gap-0">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className={`flex items-center px-5 py-3 font-semibold text-lg text-gray-600 transition-colors ${item.color}`}
                    >
                      {item.label === null ? <HomeIcon /> : item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>

        <footer className="border-t border-gray-200 mt-12 py-6 text-center text-xs text-gray-400 bg-white">
          Vietnam Market Intelligence — Dữ liệu cập nhật tự động mỗi ngày
        </footer>
      </body>
    </html>
  )
}
