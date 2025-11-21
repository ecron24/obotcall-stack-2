import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ObotCall - Solutions Digitales pour Professionnels',
  description: 'Plateforme complète de solutions digitales : standard téléphonique intelligent, CRM courtier et générateur de baux professionnels.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
