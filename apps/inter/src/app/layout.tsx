import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Inter-App - Gestion d\'Interventions SaaS',
  description: 'Plateforme SaaS multi-tenant pour la gestion d\'interventions',
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function RootLayout({
  children,
}: {
  children: React.Node
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
