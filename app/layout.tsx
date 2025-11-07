import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RWA Tokenization Admin",
  description: "Admin dashboard for Walled Garden RWA tokenization",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <div className="flex h-screen bg-background">
          <aside className="w-64 bg-gray-900 text-white flex flex-col">
            <div className="p-6 border-b border-gray-700">
              <h1 className="text-xl font-bold">RWA Admin</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <a href="/" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                <span className="text-xl">📊</span>
                <span>Dashboard</span>
              </a>
              <a
                href="/investors"
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition"
              >
                <span className="text-xl">👥</span>
                <span>Investors</span>
              </a>
            </nav>
          </aside>

          {/* Main content area */}
          <div className="flex-1 flex flex-col">
            <header className="border-b border-border bg-card p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Admin Dashboard</h2>
              <div className="flex items-center gap-4">
                <button className="w-10 h-10 rounded-full bg-gray-400 hover:bg-gray-500 flex items-center justify-center text-white font-bold">
                  A
                </button>
              </div>
            </header>

            {/* Page content */}
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
