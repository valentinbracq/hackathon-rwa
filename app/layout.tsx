import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const _inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RWA Tokenization Admin",
  description: "Admin dashboard for institutional RWA tokenization",
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
      <body className={`font-sans antialiased bg-background text-foreground`}>
        <nav className="fixed top-0 left-0 right-0 z-50 py-4 backdrop-blur-md border-b border-white/5 bg-card border-l-0 px-10 rounded-2xl mx-24 my-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {
              }
              <img src="/tokena1.png" alt="Tokena" className="h-8 object-contain" />
            </div>

            {/* Center nav links */}
            <div className="flex items-center gap-8">
              <a
                href="/"
                className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200"
              >
                Dashboard
              </a>
              <a href="/mpt/create-issuance" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200">Create Issuance</a>
              <a href="/mpt/authorize" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200">Authorize</a>
              {/* Removed Send nav item */}
              <a href="/mpt/clawback" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200">Clawback</a>
              <a href="/mpt/balance" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200">Balance</a>
              <a href="/mpt/sales" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200">Sales</a>
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-accent/70 hover:shadow-lg hover:shadow-accent/20 transition-all duration-200 flex items-center justify-center text-primary-foreground font-semibold">
                A
              </div>
            </div>
          </div>
        </nav>

        {/* Main content with top padding for fixed navbar */}
        <main className="pt-20 min-h-screen bg-gradient-to-br from-background via-background to-card/20">
          {children}
          <Toaster />
        </main>
        <Analytics />
      </body>
    </html>
  )
}
