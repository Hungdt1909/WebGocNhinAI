import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vietnam Market Intelligence',
  description: 'Tin tức & phân tích thị trường Việt Nam hàng ngày',
}

const NAV = [
  { href: '/', label: 'Trang chủ' },
  { href: '/topics/kinh-te', label: 'Kinh tế' },
  { href: '/topics/ai', label: 'Trí tuệ nhân tạo' },
  { href: '/topics/vang', label: 'Vàng' },
  { href: '/topics/cong-nghe', label: 'Công nghệ' },
  { href: '/reports', label: 'Báo cáo AI' },
]

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
          <div className="border-b-2 border-gray-900 py-3">
            <div className="max-w-5xl mx-auto px-4">
              <a href="/" className="block text-center font-black text-2xl tracking-tight text-gray-900 uppercase">
                Vietnam Market Intelligence
              </a>
            </div>
          </div>

          {/* Nav */}
          <nav className="border-b border-gray-200 bg-white">
            <div className="max-w-5xl mx-auto px-4">
              <ul className="flex gap-0 text-sm">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="block px-4 py-2.5 font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-50 transition-colors"
                    >
                      {item.label}
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
