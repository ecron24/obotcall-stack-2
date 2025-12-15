import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()

    // Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer le tenant_id de l'utilisateur
    const { data: userTenant } = await supabase
      .from('user_tenant_roles')
      .select('tenant_id')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single()

    if (!userTenant) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 403 })
    }

    const tenantId = userTenant.tenant_id

    // Récupérer le business_type_id du tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('business_type_id')
      .eq('id', tenantId)
      .single()

    if (!tenant?.business_type_id) {
      return NextResponse.json(
        { error: 'Business type non configuré pour ce tenant' },
        { status: 400 }
      )
    }

    const businessTypeId = tenant.business_type_id

    // Parser le form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const separator = formData.get('separator') as string || ';'

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    }

    // Lire et parser le CSV
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'Le fichier CSV doit contenir au moins une ligne de données' },
        { status: 400 }
      )
    }

    // Extraire headers et data
    const headers = lines[0].split(separator).map(h => h.trim())
    const dataLines = lines.slice(1)

    let successCount = 0
    const errors: string[] = []

    // Valider les headers requis
    const requiredHeaders = ['name']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Colonnes manquantes: ${missingHeaders.join(', ')}` },
        { status: 400 }
      )
    }

    // Traiter chaque ligne
    for (let i = 0; i < dataLines.length; i++) {
      const lineNumber = i + 2 // +2 car ligne 1 = headers
      const line = dataLines[i].trim()
      if (!line) continue

      try {
        const values = line.split(separator).map(v => v.trim())
        const row: Record<string, string> = {}

        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })

        // Valider les données requises
        if (!row.name) {
          errors.push(`Ligne ${lineNumber}: name requis`)
          continue
        }

        // Récupérer parent_id si fourni
        let parentId = null
        if (row.parent_id && row.parent_id.trim()) {
          parentId = row.parent_id
        }

        // Insérer la catégorie
        const { error: insertError } = await supabase
          .from('product_categories')
          .insert({
            business_type_id: businessTypeId,
            parent_id: parentId,
            name: row.name,
            description: row.description || null,
            display_order: i,
            is_active: true
          })

        if (insertError) {
          errors.push(`Ligne ${lineNumber}: ${insertError.message}`)
        } else {
          successCount++
        }
      } catch (error: any) {
        errors.push(`Ligne ${lineNumber}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: successCount,
      total: dataLines.length,
      errors
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
