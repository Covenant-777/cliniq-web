import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ClinIQ - Doctor Dashboard',
  description: 'Chronic Disease Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900">{children}</body>
    </html>
  )
}