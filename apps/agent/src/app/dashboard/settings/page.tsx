import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Settings, Building2, Bell, Shield, Percent } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch user's tenant information
  const { data: userTenants } = await supabase
    .from('user_tenant_roles')
    .select(`
      role,
      tenant:tenants(*)
    `)
    .eq('user_id', user.id)
    .single()

  // Fetch commission settings
  const { data: commissionSettings } = await supabase
    .from('agent_commission_settings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  const tenant = userTenants?.tenant as any

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez les paramètres de votre compte et de votre agence
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* User Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Profil utilisateur
            </CardTitle>
            <CardDescription>
              Informations de votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Input
                  id="role"
                  value={userTenants?.role || '-'}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" disabled>
                Modifier le profil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tenant/Company Settings */}
        {tenant && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations de l'agence
              </CardTitle>
              <CardDescription>
                Configuration de votre cabinet de courtage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tenant-name">Nom de l'agence</Label>
                  <Input
                    id="tenant-name"
                    value={tenant.name || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-type">Type</Label>
                  <Input
                    id="tenant-type"
                    value={tenant.tenant_type || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orias">N° ORIAS</Label>
                  <Input
                    id="orias"
                    value={tenant.orias_number || '-'}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siret">SIRET</Label>
                  <Input
                    id="siret"
                    value={tenant.siret || '-'}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={tenant.phone || '-'}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={tenant.email || '-'}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={
                      tenant.address
                        ? `${tenant.address}, ${tenant.postal_code} ${tenant.city}`
                        : '-'
                    }
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" disabled>
                  Modifier les informations
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Commission Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Barèmes de commission
            </CardTitle>
            <CardDescription>
              Configuration des taux de commission par compagnie et produit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {commissionSettings && commissionSettings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Compagnie</TableHead>
                    <TableHead>Catégorie produit</TableHead>
                    <TableHead>Type produit</TableHead>
                    <TableHead>Taux</TableHead>
                    <TableHead>Min</TableHead>
                    <TableHead>Max</TableHead>
                    <TableHead>Période</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionSettings.map((setting: any) => (
                    <TableRow key={setting.id}>
                      <TableCell className="font-medium">
                        {setting.company_name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {setting.product_category}
                        </Badge>
                      </TableCell>
                      <TableCell>{setting.product_type || 'Tous'}</TableCell>
                      <TableCell className="font-medium">
                        {setting.commission_rate}%
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {setting.min_commission
                          ? `${setting.min_commission}€`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {setting.max_commission
                          ? `${setting.max_commission}€`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            Du{' '}
                            {new Date(setting.effective_from).toLocaleDateString(
                              'fr-FR'
                            )}
                          </div>
                          {setting.effective_to && (
                            <div className="text-muted-foreground">
                              Au{' '}
                              {new Date(setting.effective_to).toLocaleDateString(
                                'fr-FR'
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Percent className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Aucun barème de commission configuré
                </p>
                <Button className="mt-4" variant="outline" disabled>
                  Ajouter un barème
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configurez vos préférences de notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications par email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir les alertes importantes par email
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Activer
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rappels d'échéances</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications pour les contrats à renouveler
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Activer
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Réclamations urgentes</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertes pour les réclamations proches de l'échéance
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Activer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
