# Composants Multi-Métiers - Documentation Frontend

## 📋 Vue d'ensemble

Ce dossier contient tous les composants React pour gérer le système multi-métiers dans inter-app. Les composants sont construits avec React/Next.js 14 et TypeScript.

## 🎯 Composants disponibles

### 1. BusinessTypeSelector

Sélecteur de type de métier (pisciniste, plombier, etc.)

**Usage :**
```tsx
import { BusinessTypeSelector } from '@/components/business'

function OnboardingPage() {
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessType | null>(null)

  return (
    <BusinessTypeSelector
      value={selectedBusiness?.id}
      onChange={(businessType) => setSelectedBusiness(businessType)}
    />
  )
}
```

**Props :**
- `value?: string` - ID du business type sélectionné
- `onChange: (businessType: BusinessType) => void` - Callback de sélection
- `disabled?: boolean` - Désactiver la sélection
- `className?: string` - Classes CSS personnalisées

**Caractéristiques :**
- Affichage sous forme de grille
- Emojis et couleurs par métier
- Affiche taux horaire et frais de déplacement
- État sélectionné visuellement marqué

---

### 2. InterventionTypeSelector

Sélecteur de type d'intervention (entretien, réparation, etc.)

**Usage :**
```tsx
import { InterventionTypeSelector } from '@/components/business'

function NewInterventionPage() {
  const { businessType } = useBusinessType(tenantBusinessTypeId)

  return (
    <InterventionTypeSelector
      businessTypeId={businessType.id}
      onChange={(type) => console.log('Selected:', type)}
    />
  )
}
```

**Props :**
- `businessTypeId?: string` - Filtre par business type
- `value?: string` - ID du type sélectionné
- `onChange: (interventionType: InterventionType) => void` - Callback
- `disabled?: boolean` - Désactiver
- `multiple?: boolean` - Sélection multiple (future)
- `className?: string` - Classes CSS

**Caractéristiques :**
- Filtrage automatique par business type
- Affichage emoji + nom + durée
- Couleurs dynamiques par type
- Grille responsive

---

### 3. ProductCatalog

Catalogue de produits/services avec recherche et filtres

**Usage :**
```tsx
import { ProductCatalog } from '@/components/business'

function ProductSelectionModal() {
  return (
    <ProductCatalog
      onSelectProduct={(product) => {
        console.log('Selected product:', product)
        // Ajouter le produit à l'intervention
      }}
      selectedProductIds={existingProductIds}
    />
  )
}
```

**Props :**
- `onSelectProduct: (product: Product) => void` - Callback de sélection
- `selectedProductIds?: string[]` - IDs déjà sélectionnés
- `className?: string` - Classes CSS

**Caractéristiques :**
- Recherche full-text
- Filtres par type (produit/service/main d'œuvre)
- Filtres par catégorie
- Affichage stock si applicable
- Prix HT formatés
- Emojis par type
- Grille responsive

---

### 4. InterventionItems

Gestion complète des items d'une intervention avec calculs automatiques

**Usage :**
```tsx
import { InterventionItems } from '@/components/business'

function InterventionDetailPage({ interventionId }: { interventionId: string }) {
  return (
    <InterventionItems
      interventionId={interventionId}
      readonly={false}
    />
  )
}
```

**Props :**
- `interventionId: string` - ID de l'intervention
- `readonly?: boolean` - Mode lecture seule
- `className?: string` - Classes CSS

**Caractéristiques :**
- Ajout depuis catalogue produits (modal)
- Ajout manuel (saisie libre)
- Édition inline (clic sur cellule)
- Suppression avec confirmation
- Calculs automatiques :
  - Total HT par ligne
  - Sous-total HT
  - Total TVA
  - Total TTC
  - Nombre d'éléments
- Tableau responsive
- Formatage prix FR

---

## 🔧 Hooks personnalisés

### useBusinessTypes

Récupère la liste des types de métiers

```tsx
import { useBusinessTypes } from '@/hooks'

function MyComponent() {
  const { businessTypes, loading, error, refetch } = useBusinessTypes()

  if (loading) return <div>Chargement...</div>
  if (error) return <div>Erreur: {error}</div>

  return (
    <ul>
      {businessTypes.map(type => (
        <li key={type.id}>{type.emoji} {type.name}</li>
      ))}
    </ul>
  )
}
```

---

### useInterventionTypes

Récupère les types d'intervention (avec filtres)

```tsx
import { useInterventionTypes } from '@/hooks'

function MyComponent({ businessTypeId }: { businessTypeId: string }) {
  const { interventionTypes, loading, error } = useInterventionTypes({
    business_type_id: businessTypeId,
    is_active: true
  })

  return <div>{interventionTypes.length} types disponibles</div>
}
```

---

### useProducts

Récupère les produits (avec filtres)

```tsx
import { useProducts } from '@/hooks'

function MyComponent() {
  const { products, loading, error } = useProducts({
    type: 'product',
    search: 'chlore',
    is_active: true
  })

  return <div>{products.length} produits trouvés</div>
}
```

---

### useInterventionItems

Gère les items d'une intervention avec CRUD complet

```tsx
import { useInterventionItems } from '@/hooks'

function MyComponent({ interventionId }: { interventionId: string }) {
  const {
    items,
    totals,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    refetch
  } = useInterventionItems(interventionId)

  const handleAddItem = async () => {
    await addItem({
      description: 'Nouveau produit',
      quantity: 1,
      unit_price_ht: 50,
      tax_rate: 20
    })
  }

  return (
    <div>
      <button onClick={handleAddItem}>Ajouter</button>
      <div>Total TTC: {totals.total_ttc}€</div>
    </div>
  )
}
```

---

## 📦 Types TypeScript

Tous les types sont disponibles depuis `@/types` :

```tsx
import type {
  BusinessType,
  InterventionType,
  Product,
  ProductCategory,
  InterventionItem,
  InterventionTotals,
  CreateInterventionItemInput,
  UpdateInterventionItemInput,
  ProductFilters
} from '@/types'
```

---

## 🎨 Styling

Les composants utilisent des classes Tailwind CSS. Assurez-vous d'avoir :

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6', // Adapter à votre charte
      }
    }
  }
}
```

---

## 🔗 Configuration API

Par défaut, les composants se connectent à `http://localhost:3001`.

Pour changer l'URL de l'API :

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://votre-api.com
```

---

## 🧪 Exemple d'intégration complète

Voir le fichier `app/interventions/[id]/page.example.tsx` pour un exemple complet d'intégration de tous les composants dans une page d'intervention.

---

## ✅ Checklist d'intégration

- [ ] Importer les composants nécessaires
- [ ] Configurer NEXT_PUBLIC_API_URL
- [ ] Ajouter les routes API dans inter-api/src/index.ts
- [ ] Gérer l'authentification (headers Authorization)
- [ ] Adapter les couleurs au design system
- [ ] Tester sur mobile (responsive)
- [ ] Configurer RLS sur Supabase
- [ ] Tester les calculs de totaux
- [ ] Valider l'UX du catalogue produits

---

## 🚀 Prochaines étapes

### Fonctionnalités à ajouter :

1. **Signature client**
   - Canvas pour signature
   - Sauvegarde en base64
   - Affichage dans le PDF

2. **Photos**
   - Upload multiple
   - Galerie d'images
   - Compression automatique

3. **Export PDF**
   - Génération devis/facture
   - Template par métier
   - Envoi par email

4. **Offline mode**
   - Service Worker
   - Sync en arrière-plan
   - Cache des produits

5. **Notifications**
   - Toast messages
   - Confirmations actions
   - Erreurs réseau

---

## 🐛 Dépannage

### Les produits ne s'affichent pas
- Vérifier que le business_type_id du tenant est défini
- Vérifier les logs réseau (F12 > Network)
- Vérifier que l'API retourne des données

### Les totaux ne se calculent pas
- Vérifier que les colonnes GENERATED existent en base
- Vérifier que tax_rate est défini (défaut: 20)
- Rafraîchir avec refetch()

### Erreur CORS
- Configurer les CORS dans inter-api
- Vérifier NEXT_PUBLIC_API_URL

---

## 📚 Ressources

- [Documentation API](../../../inter-api/README.md)
- [Architecture multi-métiers](../../../docs/ARCHITECTURE_MULTI_TRADE.md)
- [Guide des migrations](../../../supabase/migrations/README_MIGRATIONS.md)

---

**Version:** 1.0.0
**Dernière mise à jour:** 2025-12-04
**Auteur:** Claude Code Assistant
