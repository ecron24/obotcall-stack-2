import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">ObotCall</h3>
            <p className="text-sm text-muted-foreground">
              Solutions digitales innovantes pour professionnels.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Produits</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/produits#inter" className="text-muted-foreground hover:text-foreground">
                  Inter - Gestion d'interventions
                </Link>
              </li>
              <li>
                <Link href="/produits#agent" className="text-muted-foreground hover:text-foreground">
                  Agent - CRM Courtier
                </Link>
              </li>
              <li>
                <Link href="/produits#immo" className="text-muted-foreground hover:text-foreground">
                  Immo - Gestion locative
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Entreprise</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/fonctionnalites" className="text-muted-foreground hover:text-foreground">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link href="/tarifs" className="text-muted-foreground hover:text-foreground">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/mentions-legales" className="text-muted-foreground hover:text-foreground">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="text-muted-foreground hover:text-foreground">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link href="/cgu" className="text-muted-foreground hover:text-foreground">
                  CGU
                </Link>
              </li>
              <li>
                <Link href="/cgv" className="text-muted-foreground hover:text-foreground">
                  CGV
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} ObotCall. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
