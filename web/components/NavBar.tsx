'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    href: '/',
    label: 'Trang chủ',
    active: 'text-gray-900 border-b-2 border-gray-900',
    inactive: 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-900',
    exact: true,
  },
  {
    href: '/topics/bat-dong-san',
    label: 'Bất động sản',
    active: 'text-green-700 border-b-2 border-green-700',
    inactive: 'text-gray-600 hover:text-green-700 hover:border-b-2 hover:border-green-700',
    exact: false,
  },
  {
    href: '/topics/vang',
    label: 'Vàng',
    active: 'text-amber-600 border-b-2 border-amber-600',
    inactive: 'text-gray-600 hover:text-amber-600 hover:border-b-2 hover:border-amber-600',
    exact: false,
  },
  {
    href: '/topics/cong-nghe',
    label: 'Khoa học & Công nghệ',
    active: 'text-cyan-700 border-b-2 border-cyan-700',
    inactive: 'text-gray-600 hover:text-cyan-700 hover:border-b-2 hover:border-cyan-700',
    exact: false,
  },
  {
    href: '/reports',
    label: 'Báo cáo AI',
    active: 'text-red-600 border-b-2 border-red-600',
    inactive: 'text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-600',
    exact: false,
  },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <ul className="flex justify-center gap-0">
          {NAV.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-5 py-3 font-semibold text-xl transition-colors ${isActive ? item.active : item.inactive}`}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
