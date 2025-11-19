import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ObotCall
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Accueil
          </Link>
          <Link href="/fonctionnalites" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Fonctionnalités
          </Link>
          <Link href="/produits" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Produits
          </Link>
          <Link href="/tarifs" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Tarifs
          </Link>
          <Link href="/contact" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Contact
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/contact">Connexion</Link>
          </Button>
          <Button asChild>
            <Link href="/contact">Démarrer</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
