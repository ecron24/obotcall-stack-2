# 🏗️ Architecture Multi-Métiers - Inter-App

## Vue d'ensemble

**Inter-App** devient une plateforme SaaS B2B multi-tenant capable de supporter plusieurs types de métiers :
- 🏊 **Pisciniste** (maintenance, réparation, installation piscines)
- 🔧 **Plomberie** (dépannage, installation, rénovation)
- 🐀 **Dératisation** (extermination, prévention, suivi)
- 🚗 **Garagiste** (entretien, réparation, diagnostic véhicules)
- ⚡ **Électricien** (installation, dépannage, mise aux normes)
- 🌡️ **Chauffagiste/Climatisation** (entretien, réparation, installation)

---

## 🎯 Objectifs

1. **Flexibilité** : Chaque tenant choisit son métier lors de l'inscription
2. **Adaptabilité** : Types d'interventions et catalogues produits spécifiques à chaque métier
3. **Évolutivité** : Possibilité d'ajouter de nouveaux métiers facilement
4. **Personnalisation** : Interface et terminologie adaptées au métier choisi
5. **Réutilisabilité** : Modules communs (facturation, clients, calendrier)

---

## 📊 Architecture de données

### Inspiration de delmas-app

Nous nous inspirons de l'architecture éprouvée de **delmas-app** :

**Points clés réutilisés :**
- ✅ Structure interventions avec items détachés
- ✅ Types d'interventions configurables
- ✅ Système de facturation automatique (proforma → finale)
- ✅ Calcul totaux TTC avec TVA par ligne
- ✅ Gestion clients particuliers/professionnels
- ✅ Modules prospects, calendrier, factures
- ✅ Tables de support (technicians, pricing_config, settings)

**Améliorations pour multi-métiers :**
- ➕ Table `business_types` pour définir les métiers
- ➕ Types d'interventions liés aux métiers
- ➕ Catalogues produits par métier
- ➕ Configurations tarifaires par métier
- ➕ Terminologie adaptative selon le métier

---

## 🗄️ Schéma de base de données

### Nouvelles tables

#### 1. **business_types** (Types de métiers)

```sql
CREATE TABLE business_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- 'pool', 'plumbing', 'pest_control', 'garage', etc.
  name TEXT NOT NULL, -- 'Pisciniste', 'Plomberie', 'Dératisation', etc.
  description TEXT,
  emoji TEXT, -- '🏊', '🔧', '🐀', '🚗'
  color TEXT, -- Couleur principale du métier

  -- Terminologie personnalisée
  terminology JSONB DEFAULT '{
    "intervention": "Intervention",
    "client": "Client",
    "technician": "Technicien",
    "quote": "Devis",
    "invoice": "Facture"
  }'::jsonb,

  -- Configuration par défaut
  default_labor_rate DECIMAL(10,2), -- Taux horaire par défaut
  default_travel_fee DECIMAL(10,2), -- Frais déplacement par défaut
  default_tax_rate DECIMAL(5,2) DEFAULT 20.00, -- TVA par défaut

  -- Statut
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_business_types_code ON business_types(code);
CREATE INDEX idx_business_types_active ON business_types(is_active);
```

#### 2. **intervention_types** (Types d'interventions par métier)

```sql
CREATE TABLE intervention_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,

  code TEXT NOT NULL, -- 'maintenance', 'repair', 'installation', 'emergency', etc.
  name TEXT NOT NULL, -- 'Entretien', 'Réparation', 'Installation', 'Urgence'
  description TEXT,
  emoji TEXT, -- '🔧', '🛠️', '⚙️', '🚨'
  color TEXT, -- Couleur badge

  -- Configuration
  requires_quote BOOLEAN DEFAULT false, -- Nécessite un devis
  default_duration INTEGER, -- Durée estimée en minutes
  default_priority TEXT CHECK (default_priority IN ('low', 'medium', 'high', 'urgent')),

  -- Ordre d'affichage
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_type_id, code)
);

CREATE INDEX idx_intervention_types_business ON intervention_types(business_type_id);
CREATE INDEX idx_intervention_types_code ON intervention_types(code);
CREATE INDEX idx_intervention_types_active ON intervention_types(is_active);
```

#### 3. **product_categories** (Catégories de produits par métier)

```sql
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES product_categories(id) ON DELETE CASCADE, -- Hiérarchie

  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Icône ou emoji

  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_categories_business ON product_categories(business_type_id);
CREATE INDEX idx_product_categories_parent ON product_categories(parent_id);
CREATE INDEX idx_product_categories_active ON product_categories(is_active);
```

#### 4. **products** (Catalogue produits par métier)

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,

  -- Identification
  code TEXT NOT NULL, -- Code produit/service
  name TEXT NOT NULL,
  description TEXT,

  -- Type
  type TEXT NOT NULL CHECK (type IN ('product', 'service', 'labor')),
  unit TEXT NOT NULL DEFAULT 'unité', -- 'unité', 'heure', 'litre', 'kg', 'm²', etc.

  -- Prix
  unit_price_ht DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 20.00,

  -- Stock (optionnel pour services)
  has_stock BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  stock_alert_threshold INTEGER,

  -- Fournisseur
  supplier_name TEXT,
  supplier_reference TEXT,

  -- Statut
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_type_id, code)
);

CREATE INDEX idx_products_business ON products(business_type_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_active ON products(is_active);
```

#### 5. **intervention_items** (Produits/services utilisés dans interventions)

```sql
CREATE TABLE intervention_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- Détails
  description TEXT NOT NULL, -- Copie du nom produit ou description custom
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unité',

  -- Prix
  unit_price_ht DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,

  -- Totaux calculés
  total_ht DECIMAL(10,2) NOT NULL GENERATED ALWAYS AS (quantity * unit_price_ht) STORED,
  total_tax DECIMAL(10,2) NOT NULL GENERATED ALWAYS AS (quantity * unit_price_ht * tax_rate / 100) STORED,
  total_ttc DECIMAL(10,2) NOT NULL GENERATED ALWAYS AS (quantity * unit_price_ht * (1 + tax_rate / 100)) STORED,

  -- Ordre d'affichage
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_intervention_items_intervention ON intervention_items(intervention_id);
CREATE INDEX idx_intervention_items_product ON intervention_items(product_id);
```

#### 6. **intervention_type_assignments** (Liaison many-to-many)

```sql
CREATE TABLE intervention_type_assignments (
  intervention_id UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
  intervention_type_id UUID NOT NULL REFERENCES intervention_types(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (intervention_id, intervention_type_id)
);

CREATE INDEX idx_intervention_type_assignments_intervention ON intervention_type_assignments(intervention_id);
CREATE INDEX idx_intervention_type_assignments_type ON intervention_type_assignments(intervention_type_id);
```

#### 7. **technicians** (Techniciens/staff)

```sql
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Lien optionnel avec user

  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,

  -- Compétences (par métier)
  specialties TEXT[], -- ['pool_maintenance', 'pool_repair', 'spa_installation']
  certifications TEXT[], -- Certificats/qualifications

  -- Planning
  is_available BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2), -- Taux horaire spécifique

  -- Statut
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_technicians_tenant ON technicians(tenant_id);
CREATE INDEX idx_technicians_user ON technicians(user_id);
CREATE INDEX idx_technicians_active ON technicians(is_active);
```

#### 8. **pricing_configs** (Configuration tarifs par tenant)

```sql
CREATE TABLE pricing_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Tarifs par défaut
  labor_rate DECIMAL(10,2) NOT NULL, -- Taux horaire
  travel_fee DECIMAL(10,2) NOT NULL DEFAULT 0, -- Frais déplacement
  default_tax_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00, -- TVA

  -- Marges
  default_margin_rate DECIMAL(5,2) DEFAULT 30.00, -- Marge sur produits

  -- Pénalités
  late_payment_rate DECIMAL(5,2) DEFAULT 10.00, -- Taux pénalités retard
  recovery_fee DECIMAL(10,2) DEFAULT 40.00, -- Frais recouvrement

  -- Délais
  payment_delay_days INTEGER DEFAULT 30, -- Délai paiement
  quote_validity_days INTEGER DEFAULT 30, -- Validité devis

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),

  UNIQUE(tenant_id)
);

CREATE INDEX idx_pricing_configs_tenant ON pricing_configs(tenant_id);
```

#### 9. **company_settings** (Paramètres entreprise)

```sql
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Informations légales
  company_name TEXT NOT NULL,
  legal_form TEXT, -- 'SARL', 'SAS', 'EURL', 'Auto-entrepreneur'
  siret TEXT,
  vat_number TEXT,
  rcs_number TEXT,
  capital DECIMAL(10,2),

  -- Contact
  email TEXT,
  phone TEXT,
  website TEXT,

  -- Adresse
  address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'FR',

  -- Facturation
  invoice_prefix TEXT DEFAULT 'FAC', -- Préfixe factures
  quote_prefix TEXT DEFAULT 'DEV', -- Préfixe devis

  -- CGV/Mentions
  invoice_footer_notes TEXT, -- Pied de facture
  legal_mentions TEXT, -- Mentions légales
  general_conditions TEXT, -- Conditions générales

  -- Branding (Starter+)
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),

  UNIQUE(tenant_id)
);

CREATE INDEX idx_company_settings_tenant ON company_settings(tenant_id);
```

### Tables modifiées

#### **tenants** - Ajout du type de métier

```sql
ALTER TABLE tenants
ADD COLUMN business_type_id UUID REFERENCES business_types(id) ON DELETE RESTRICT;

CREATE INDEX idx_tenants_business_type ON tenants(business_type_id);
```

#### **interventions** - Ajout champs facturation

```sql
ALTER TABLE interventions
ADD COLUMN reference TEXT UNIQUE, -- INT-YYYYMM-NNNN
ADD COLUMN labor_hours DECIMAL(10,2) DEFAULT 0,
ADD COLUMN labor_rate DECIMAL(10,2),
ADD COLUMN travel_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN subtotal_ht DECIMAL(10,2) DEFAULT 0,
ADD COLUMN total_tax DECIMAL(10,2) DEFAULT 0,
ADD COLUMN total_ttc DECIMAL(10,2) DEFAULT 0,
ADD COLUMN client_present BOOLEAN,
ADD COLUMN client_signed_at TIMESTAMPTZ,
ADD COLUMN started_at TIMESTAMPTZ;

CREATE INDEX idx_interventions_reference ON interventions(reference);
```

---

## 🏢 Métiers supportés

### 1. 🏊 Pisciniste

**Code** : `pool_maintenance`

**Types d'interventions :**
- 🔧 Entretien (maintenance)
- 🛠️ Réparation (repair)
- ⚙️ Installation (installation)
- 🚨 Urgence (emergency)
- 🔍 Diagnostic (diagnostic)
- 🧹 Nettoyage (cleaning)
- ❄️ Hivernage (winterization)
- 🌊 Remise en service (startup)

**Produits typiques :**
- Produits chimiques (chlore, pH, algicide)
- Filtres et pompes
- Robots nettoyeurs
- Équipements de sécurité
- Accessoires (épuisettes, brosses)

**Spécificités :**
- Gestion types de piscines (enterrée, hors-sol, spa)
- Suivi paramètres eau (pH, chlore, température)
- Planning saisonnier (hivernage/remise en service)

---

### 2. 🔧 Plomberie

**Code** : `plumbing`

**Types d'interventions :**
- 🚰 Dépannage (emergency)
- 🔧 Entretien (maintenance)
- ⚙️ Installation (installation)
- 🛠️ Rénovation (renovation)
- 🔍 Diagnostic (diagnostic)
- 🚿 Remplacement équipements (replacement)

**Produits typiques :**
- Robinetterie
- Tuyaux et raccords
- Chauffe-eau
- Éviers et lavabos
- Joints et colliers

**Spécificités :**
- Urgences 24/7
- Diagnostic fuites
- Conformité normes sanitaires

---

### 3. 🐀 Dératisation / Désinsectisation

**Code** : `pest_control`

**Types d'interventions :**
- 🐀 Dératisation (rodent_control)
- 🦟 Désinsectisation (insect_control)
- 🔍 Diagnostic (inspection)
- 🛡️ Prévention (prevention)
- 📊 Suivi (monitoring)
- 🧹 Nettoyage sanitaire (sanitation)

**Produits typiques :**
- Rodenticides
- Insecticides
- Pièges et appâts
- Équipements de protection
- Produits de nettoyage

**Spécificités :**
- Certificats Certibiocide
- Suivi récurrent (contrats maintenance)
- Rapports d'intervention obligatoires
- Respect normes HACCP (secteur alimentaire)

---

### 4. 🚗 Garagiste / Mécanique auto

**Code** : `auto_repair`

**Types d'interventions :**
- 🔧 Entretien (maintenance)
- 🛠️ Réparation (repair)
- 🔍 Diagnostic (diagnostic)
- ⚙️ Remplacement pièces (parts_replacement)
- 🛡️ Contrôle technique (inspection)
- 🎨 Carrosserie (bodywork)

**Produits typiques :**
- Huiles et filtres
- Pièces mécaniques
- Pneus
- Batteries
- Freins et plaquettes

**Spécificités :**
- Gestion véhicules clients (immatriculation, marque, modèle)
- Historique entretien par véhicule
- Suivi kilométrage
- Alertes révisions

---

### 5. ⚡ Électricien

**Code** : `electrical`

**Types d'interventions :**
- 🔌 Installation (installation)
- 🔧 Dépannage (emergency)
- ⚙️ Mise aux normes (compliance)
- 🛠️ Rénovation (renovation)
- 🔍 Diagnostic (diagnostic)
- 🏠 Domotique (home_automation)

**Produits typiques :**
- Câbles et fils
- Disjoncteurs et tableaux
- Prises et interrupteurs
- Luminaires
- Équipements domotique

**Spécificités :**
- Consuel (certificat conformité)
- Diagnostic électrique obligatoire
- Normes NF C 15-100

---

### 6. 🌡️ Chauffagiste / Climatisation

**Code** : `hvac`

**Types d'interventions :**
- 🔥 Entretien chaudière (boiler_maintenance)
- ❄️ Entretien climatisation (ac_maintenance)
- ⚙️ Installation (installation)
- 🛠️ Dépannage (emergency)
- 🔍 Ramonage (chimney_sweeping)
- 📊 Diagnostic énergétique (energy_audit)

**Produits typiques :**
- Chaudières
- Climatiseurs
- Radiateurs
- Thermostats
- Accessoires chauffage

**Spécificités :**
- Certificat Qualigaz, Qualifelec
- Entretien annuel obligatoire
- Attestation entretien

---

## 🔄 Flux métier

### 1. Inscription tenant

```
1. Client s'inscrit
   ├─ Choix du métier (business_type_id)
   ├─ Plan sélectionné (free, starter, pro)
   └─ Création tenant + user owner

2. Initialisation automatique
   ├─ Copie intervention_types du métier sélectionné
   ├─ Création pricing_config avec valeurs par défaut du métier
   ├─ Création company_settings vide
   └─ Import catalogue produits de base (optionnel)
```

### 2. Création intervention

```
1. Sélection client
2. Sélection type(s) d'intervention
   └─ Filtré par business_type_id du tenant
3. Description et planning
4. Affectation technicien (optionnel)
5. Génération référence : INT-YYYYMM-NNNN
6. Statut : pending
```

### 3. Intervention en cours

```
1. Technicien démarre : started_at
2. Ajout produits/services utilisés (intervention_items)
3. Saisie heures travail (labor_hours)
4. Upload photos/documents
5. Notes techniques
```

### 4. Complétion intervention

```
1. Marquer complétée : completed_at
2. Client présent : client_present = true
3. Signature client : client_signed_at
4. TRIGGER : Calcul totaux automatique
   ├─ Produits/services : ∑ intervention_items
   ├─ Main d'œuvre : labor_hours × labor_rate
   ├─ Déplacement : travel_fee
   ├─ TVA : calculée par ligne
   └─ Total TTC

5. TRIGGER : Génération facture proforma automatique (Starter+)
```

### 5. Facturation

```
1. Facture proforma créée automatiquement
   ├─ Type : proforma
   ├─ Statut : draft
   ├─ Numéro : PRO-YYYY-NNNN
   └─ Items copiés depuis intervention

2. Validation et envoi client
   ├─ Génération PDF
   ├─ Envoi email
   └─ Statut : sent

3. Conversion en facture finale
   ├─ Nouveau numéro : FAC-YYYY-NNNN
   ├─ Type : final
   └─ Statut : sent

4. Suivi paiement
   └─ Statut : paid | partially_paid | overdue
```

---

## 🎨 Adaptation interface

### Terminologie adaptative

Chaque métier peut avoir sa propre terminologie :

**Exemples :**

| Terme générique | Pisciniste | Plombier | Dératiseur | Garagiste |
|----------------|------------|----------|------------|-----------|
| Intervention | Intervention | Dépannage | Traitement | Réparation |
| Client | Client | Client | Site | Propriétaire |
| Technicien | Pisciniste | Plombier | Technicien | Mécanicien |
| Produit | Produit | Fourniture | Produit | Pièce |

**Implémentation :**
```typescript
// Récupération depuis business_type.terminology
const t = tenant.business_type.terminology

console.log(t.intervention) // "Traitement" pour dératiseur
console.log(t.technician)   // "Mécanicien" pour garagiste
```

### Couleurs et branding

Chaque métier a sa palette par défaut :

- 🏊 Pisciniste : Bleu (#0EA5E9)
- 🔧 Plomberie : Bleu foncé (#1E40AF)
- 🐀 Dératisation : Vert (#10B981)
- 🚗 Garagiste : Rouge (#EF4444)
- ⚡ Électricien : Jaune (#F59E0B)
- 🌡️ Chauffagiste : Orange (#F97316)

**Personnalisable (Starter+) :**
```sql
UPDATE company_settings
SET primary_color = '#FF5733'
WHERE tenant_id = '...';
```

---

## 📱 Modules communs

### Modules identiques pour tous les métiers

1. **Clients** - Gestion contacts (particuliers/professionnels)
2. **Calendrier** - Planning interventions
3. **Factures** - Gestion facturation et paiements
4. **Devis** - Création et suivi devis (Starter+)
5. **Paramètres** - Configuration entreprise et tarifs
6. **Équipe** - Gestion utilisateurs et techniciens (Pro+)
7. **Statistiques** - Tableau de bord et KPI (Pro+)

### Modules adaptés par métier

1. **Interventions**
   - Types spécifiques au métier
   - Champs personnalisés (ex: paramètres eau pour piscines, km véhicule pour garage)
   - Checklist métier

2. **Catalogue produits**
   - Catégories métier
   - Produits pré-remplis selon métier
   - Gestion stock (optionnelle)

3. **Rapports**
   - Templates adaptés au métier
   - Conformité réglementaire (ex: certificat entretien chaudière)

---

## 🔒 Sécurité

### Row Level Security (RLS)

Toutes les tables ont des politiques RLS activées :

```sql
-- Exemple : isolation par tenant
CREATE POLICY tenant_isolation ON intervention_types
  FOR ALL
  USING (
    business_type_id IN (
      SELECT business_type_id
      FROM tenants t
      JOIN users u ON u.tenant_id = t.id
      WHERE u.id = auth.uid()
    )
  );
```

### Contrôle accès métier

```sql
-- Vérifie que l'utilisateur accède aux données de son métier
CREATE FUNCTION check_business_type_access(p_business_type_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users u
    JOIN tenants t ON t.id = u.tenant_id
    WHERE u.id = auth.uid()
    AND t.business_type_id = p_business_type_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📈 Migration depuis delmas-app

### Mapping des données

| delmas-app (piscine) | inter-app (multi-métiers) |
|----------------------|---------------------------|
| clients | clients |
| interventions | interventions |
| intervention_types_junction | intervention_type_assignments |
| intervention_items | intervention_items |
| invoices (piscine_delmas_compta) | factures |
| invoice_items | factures.items (JSONB) |
| company_settings | company_settings + pricing_configs |
| technicians | technicians |
| products | products |
| product_categories | product_categories |

### Script migration

```sql
-- 1. Créer type métier "Pisciniste"
INSERT INTO business_types (code, name, emoji, color)
VALUES ('pool_maintenance', 'Pisciniste', '🏊', '#0EA5E9');

-- 2. Importer types d'interventions de delmas-app
INSERT INTO intervention_types (business_type_id, code, name, emoji)
SELECT
  (SELECT id FROM business_types WHERE code = 'pool_maintenance'),
  'maintenance', 'Entretien', '🔧'
UNION ALL
SELECT id, 'repair', 'Réparation', '🛠️'
-- ... etc

-- 3. Migrer données existantes
-- (voir script complet dans migrations/)
```

---

## 🚀 Plan d'implémentation

### Phase 1 : Base de données (Priorité 1)
- [ ] Créer migration 002_multi_trade_schema.sql
- [ ] Créer tables business_types, intervention_types, products, etc.
- [ ] Modifier table tenants (ajout business_type_id)
- [ ] Modifier table interventions (ajout champs facturation)
- [ ] Seed data : 6 métiers pré-configurés

### Phase 2 : API Backend (Priorité 1)
- [ ] Route GET /business-types (liste métiers disponibles)
- [ ] Route GET /intervention-types?business_type_id=xxx
- [ ] Route GET /products?business_type_id=xxx
- [ ] Adapter routes interventions pour gérer intervention_items
- [ ] Adapter routes factures pour calcul automatique totaux

### Phase 3 : Frontend Core (Priorité 2)
- [ ] Page sélection métier lors inscription
- [ ] Dashboard adapté au métier du tenant
- [ ] Composant InterventionTypeSelector filtré par métier
- [ ] Composant ProductSelector filtré par métier
- [ ] Système de terminologie adaptative

### Phase 4 : Modules métier (Priorité 2)
- [ ] Module Interventions complet
- [ ] Module Clients avec historique
- [ ] Module Calendrier avec planning
- [ ] Module Factures avec génération PDF

### Phase 5 : Features avancées (Priorité 3)
- [ ] Statistiques par métier
- [ ] Rapports personnalisés
- [ ] Templates documents métier
- [ ] Notifications automatiques
- [ ] Export comptabilité (Pro+)

### Phase 6 : Tests & Optimisations (Priorité 3)
- [ ] Tests unitaires API
- [ ] Tests d'intégration
- [ ] Tests E2E par métier
- [ ] Optimisation performances
- [ ] Documentation complète

---

## 📚 Références

- **delmas-app** : `/tmp/delmas-app/` (architecture source)
- **inter-app actuel** : `apps/inter/` (base existante)
- **Documentation Supabase** : https://supabase.com/docs
- **Next.js 14** : https://nextjs.org/docs

---

## 🎯 Prochaines étapes

1. ✅ Analyse architecture delmas-app
2. ✅ Conception architecture multi-métiers
3. 🔄 Créer migration SQL complète
4. ⏳ Implémenter API backend
5. ⏳ Créer interfaces frontend
6. ⏳ Tests et déploiement

---

**Document créé le** : 2025-12-04
**Dernière mise à jour** : 2025-12-04
**Version** : 1.0
