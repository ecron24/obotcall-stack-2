'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ObotCall
          </span>
        </Link>

        {/* Desktop Navigation */}
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

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Button asChild>
            <Link href="/select-product">Choisir un produit</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-4 flex flex-col space-y-4">
            <Link
              href="/"
              className="text-lg font-medium transition-colors hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Accueil
            </Link>
            <Link
              href="/fonctionnalites"
              className="text-lg font-medium transition-colors hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Fonctionnalités
            </Link>
            <Link
              href="/produits"
              className="text-lg font-medium transition-colors hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Produits
            </Link>
            <Link
              href="/tarifs"
              className="text-lg font-medium transition-colors hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tarifs
            </Link>
            <Link
              href="/contact"
              className="text-lg font-medium transition-colors hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="pt-4 border-t">
              <Button asChild className="w-full">
                <Link href="/select-product" onClick={() => setMobileMenuOpen(false)}>
                  Choisir un produit
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
