import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Globe } from 'lucide-react'
import Link from 'next/link'

export default async function TemplatesPage() {
  const supabase = await createClient()

  const templates = [
    { id: 1, name: 'Bail résidentiel France', country: 'FR', language: 'fr', type: 'residential' },
    { id: 2, name: 'Bail commercial France', country: 'FR', language: 'fr', type: 'commercial' },
    { id: 3, name: 'Contrat de location Belgique', country: 'BE', language: 'fr', type: 'residential' },
    { id: 4, name: 'Mietvertrag Deutschland', country: 'DE', language: 'de', type: 'residential' },
    { id: 5, name: 'Contratto di locazione Italia', country: 'IT', language: 'it', type: 'residential' },
    { id: 6, name: 'Bail Luxembourg', country: 'LU', language: 'fr', type: 'residential' },
    { id: 7, name: 'Mietvertrag Schweiz', country: 'CH', language: 'de', type: 'residential' },
    { id: 8, name: 'Contrato de arrendamiento España', country: 'ES', language: 'es', type: 'residential' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Modèles de baux pour 8 pays européens
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Créer un template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <Globe className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{template.country}</Badge>
                  <Badge variant="outline">{template.language.toUpperCase()}</Badge>
                  <Badge variant="secondary">{template.type}</Badge>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Prévisualiser
                </Button>
                <Button variant="default" size="sm" className="flex-1">
                  Utiliser
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
