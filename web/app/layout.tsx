import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'Góc Nhìn Thị Trường của AI',
  description: 'Tin tức & phân tích thị trường Việt Nam hàng ngày do AI tổng hợp',
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
              <a href="/" className="font-black text-3xl tracking-tight text-gray-900 leading-none">
                Góc Nhìn Thị Trường của AI
              </a>
              <BarChartIcon />
            </div>
          </div>

          <NavBar />
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>

        <footer className="border-t-2 border-gray-900 mt-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

              {/* Brand */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChartIcon />
                  <span className="font-black text-sm uppercase tracking-tight text-gray-900">
                    Góc Nhìn Thị Trường của AI
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Tin tức và phân tích thị trường Việt Nam tổng hợp tự động từ 13+ nguồn báo uy tín,
                  phân tích bằng AI Gemini mỗi ngày lúc 7:00 sáng.
                </p>
              </div>

              {/* Navigation */}
              <div>
                <p className="font-black text-xs uppercase tracking-widest text-gray-900 mb-3">Chuyên mục</p>
                <ul className="space-y-2 text-xs text-gray-500">
                  <li><a href="/topics/bat-dong-san" className="hover:text-gray-900">Bất động sản Hà Nội</a></li>
                  <li><a href="/topics/vang" className="hover:text-gray-900">Vàng SJC</a></li>
                  <li><a href="/topics/cong-nghe" className="hover:text-gray-900">Khoa học & Công nghệ</a></li>
                  <li><a href="/reports" className="hover:text-gray-900">Báo cáo AI hàng ngày</a></li>
                </ul>
              </div>

              {/* Data sources */}
              <div>
                <p className="font-black text-xs uppercase tracking-widest text-gray-900 mb-3">Nguồn dữ liệu</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-2">
                  VnEconomy · Tuổi Trẻ · Thanh Niên · VnExpress · CafeF · Nhịp cầu Đầu tư
                  · Dân Trí · Zing News · VietnamNet và các nguồn khác.
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Giá vàng: Yahoo Finance (GC=F, USDVND=X) · Phân tích: Google Gemini 2.5 Flash
                </p>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-gray-100 pt-5 flex flex-col md:flex-row items-center justify-between gap-2">
              <p className="text-xs text-gray-400">
                Dữ liệu tự động · Không phải khuyến nghị đầu tư
              </p>
              <p className="text-xs text-gray-400">
                Cập nhật mỗi ngày 7:00 AM ICT · {new Date().getFullYear()} Góc Nhìn Thị Trường của AI
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
