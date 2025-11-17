import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, CreditCard, TrendingDown, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function CreditsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const totalCredits = transactions?.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.amount, 0) || 0
  const usedCredits = transactions?.filter(t => t.type === 'usage').reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0
  const balance = totalCredits - usedCredits

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Crédits</h1>
          <p className="text-muted-foreground">
            Gérez vos crédits pour la génération de baux
          </p>
        </div>
        <Link href="/dashboard/credits/purchase">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Acheter des crédits
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Solde actuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{balance}</div>
            <p className="text-xs text-muted-foreground mt-1">crédits disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Total acheté
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCredits}</div>
            <p className="text-xs text-muted-foreground mt-1">crédits achetés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Total utilisé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{usedCredits}</div>
            <p className="text-xs text-muted-foreground mt-1">crédits consommés</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
          <CardDescription>
            {transactions?.length || 0} transaction(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Crédits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'purchase' ? 'success' : 'secondary'}>
                        {transaction.type === 'purchase' ? 'Achat' : 'Utilisation'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {transaction.description || '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={transaction.type === 'purchase' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'purchase' ? '+' : ''}{transaction.amount}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune transaction</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
