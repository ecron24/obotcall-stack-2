import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { TarifsClient } from './tarifs-client'

export default function TarifsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <TarifsClient />
      </main>

      <Footer />
    </div>
  )
}
