'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SubmitModal } from './SubmitModal'

const navItems = [
  { href: '/', label: 'Leaderboard' },
  { href: '/gpus', label: 'GPUs' },
  { href: '/models', label: 'Models' },
  { href: '/submissions', label: 'Submissions' },
  { href: '/compare', label: 'Compare' },
]

export function Navbar() {
  const pathname = usePathname()
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 bg-orange-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">IB</span>
                </div>
                <span className="font-semibold text-stone-900">InferBench</span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded transition-colors"
            >
              Submit Result
            </button>
          </div>
        </div>
      </nav>

      <SubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
      />
    </>
  )
}
