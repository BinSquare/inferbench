import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'InferBench - AI Inference Leaderboard',
  description: 'Crowdsourced benchmarks for local AI inference hardware',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-stone-50 text-stone-900`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen pt-14">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
