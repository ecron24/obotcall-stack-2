import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Check, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { purchaseCredits } from '../actions'

export default function PurchaseCreditsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/credits">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Acheter des crédits</h1>
          <p className="text-muted-foreground">
            Choisissez votre pack de crédits
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Starter Pack */}
        <Card>
          <CardHeader>
            <CardTitle>Starter</CardTitle>
            <CardDescription>Pour démarrer</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">10€</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">10 crédits</Badge>
                <span className="text-sm text-muted-foreground">1€/crédit</span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>10 baux</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Tous les pays</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Templates de base</span>
                </li>
              </ul>
              <form action={purchaseCredits}>
                <input type="hidden" name="amount" value="10" />
                <input type="hidden" name="pack_type" value="starter" />
                <input type="hidden" name="price_paid" value="10" />
                <input type="hidden" name="description" value="Pack Starter - 10 crédits" />
                <Button type="submit" className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Acheter
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Pro Pack */}
        <Card className="border-primary shadow-lg relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge>Populaire</Badge>
          </div>
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>Le plus avantageux</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">50€</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">60 crédits</Badge>
                <span className="text-sm text-muted-foreground">0.83€/crédit</span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>60 baux</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Tous les pays</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Templates personnalisés</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>API & Webhooks</span>
                </li>
              </ul>
              <form action={purchaseCredits}>
                <input type="hidden" name="amount" value="60" />
                <input type="hidden" name="pack_type" value="pro" />
                <input type="hidden" name="price_paid" value="50" />
                <input type="hidden" name="description" value="Pack Pro - 60 crédits" />
                <Button type="submit" className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Acheter
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Enterprise Pack */}
        <Card>
          <CardHeader>
            <CardTitle>Enterprise</CardTitle>
            <CardDescription>Pour les professionnels</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">200€</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">300 crédits</Badge>
                <span className="text-sm text-muted-foreground">0.67€/crédit</span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>300 baux</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Tous les pays</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Templates illimités</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Support prioritaire</span>
                </li>
              </ul>
              <form action={purchaseCredits}>
                <input type="hidden" name="amount" value="300" />
                <input type="hidden" name="pack_type" value="enterprise" />
                <input type="hidden" name="price_paid" value="200" />
                <input type="hidden" name="description" value="Pack Enterprise - 300 crédits" />
                <Button type="submit" className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Acheter
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Pack */}
      <Card>
        <CardHeader>
          <CardTitle>Pack personnalisé</CardTitle>
          <CardDescription>
            Choisissez votre propre quantité de crédits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={purchaseCredits} className="space-y-4">
            <input type="hidden" name="pack_type" value="custom" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="amount">Nombre de crédits</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="1"
                  placeholder="Ex: 50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_paid">Prix (€)</Label>
                <Input
                  id="price_paid"
                  name="price_paid"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 40"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_method">Méthode</Label>
                <Input
                  id="payment_method"
                  name="payment_method"
                  placeholder="Ex: Carte bancaire"
                />
              </div>
            </div>
            <Button type="submit">
              <CreditCard className="mr-2 h-4 w-4" />
              Acheter le pack personnalisé
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
