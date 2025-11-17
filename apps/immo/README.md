# 🏠 Immo App - Générateur de Baux Immobiliers

Application de génération automatique de baux immobiliers pour 8 pays européens.

---

## 📋 Vue d'ensemble

**Type :** Générateur de documents légaux (baux de location)
**Schema DB :** `immo_app` (12 tables)
**Stack :** Next.js 14, TypeScript, Supabase, N8N, Pandoc
**Status :** 🚧 En développement

---

## 🎯 Fonctionnalités principales

### 1. Multi-pays (8 pays européens)
- 🇫🇷 France (Loi ALUR 2014)
- 🇧🇪 Belgique (Code Civil Belge)
- 🇨🇭 Suisse (Code des obligations)
- 🇩🇪 Allemagne (BGB)
- 🇪🇸 Espagne (LAU)
- 🇮🇹 Italie (Legge 431/98)
- 🇵🇹 Portugal (NRAU)
- 🇱🇺 Luxembourg (Code Civil)

### 2. Types de baux supportés
- ✅ Résidentiel (habitation)
- ✅ Commercial (boutique, bureau)
- ✅ Professionnel (activité libérale)
- ✅ Mixte (habitation + professionnel)
- ✅ Saisonnier (vacances)
- ✅ Parking / Garage
- ✅ Box de stockage

### 3. Système de crédits
- ✅ Achat de crédits par packages
- ✅ Crédits bonus promotionnels
- ✅ Suivi de la consommation
- ✅ Historique des transactions
- ✅ Validité des crédits (optionnelle)

### 4. Génération de documents
- ✅ Templates DOCX personnalisables
- ✅ Conversion PDF automatique (Pandoc)
- ✅ Champs dynamiques selon le type
- ✅ Validation légale par pays
- ✅ Numérotation automatique BAIL-YYYY-XXXXX

### 5. Gestion des parties
- ✅ Bailleurs (particuliers et professionnels)
- ✅ Locataires (particuliers et professionnels)
- ✅ Co-locataires multiples
- ✅ Représentants légaux (sociétés)
- ✅ Documents d'identité

### 6. Gestion des biens
- ✅ Base de données de propriétés
- ✅ Caractéristiques détaillées
- ✅ Performance énergétique (DPE)
- ✅ Photos et documents
- ✅ Réutilisation pour plusieurs baux

### 7. Intégrations
- ✅ N8N (workflows automatisés)
- ✅ Webhooks personnalisables
- ✅ Envoi d'emails (Resend/SendGrid)
- ✅ Stockage documents (Cloudinary/S3)

---

## 🗄️ Structure de la base de données

**Schema :** `immo_app`
**Migration :** `supabase/migrations/003_schema_immo_app.sql`

### Tables principales (12)

#### Pays & Configuration (1)
- `countries` - Pays supportés et règles légales

#### Système de crédits (3)
- `credit_packages` - Packages de crédits
- `credit_purchases` - Achats de crédits
- `credit_transactions` - Historique des transactions

#### Templates (2)
- `lease_templates` - Templates de baux
- `template_fields` - Champs personnalisables

#### Entités (2)
- `properties` - Biens immobiliers
- `lease_parties` - Bailleurs et locataires

#### Génération (1)
- `generated_leases` - Baux générés

#### Communication (1)
- `email_history` - Historique des emails

#### Automation (2)
- `webhooks` - Configurations webhooks N8N
- `webhook_logs` - Logs des appels webhooks

---

## 🔐 Sécurité

- **RLS (Row Level Security)** : Toutes les tables
- **Multi-tenant** : Isolation complète par tenant
- **Audit trail** : Toutes les actions tracées
- **Soft delete** : Suppression logique partout
- **Search path** : Protection SQL injection
- **Encryption** : Credentials webhooks chiffrés

---

## 🚀 Architecture

```
apps/immo/
├── src/                    # Frontend Next.js (à venir)
│   ├── app/               # App Router Next.js 14
│   ├── components/        # Composants React
│   │   ├── templates/    # Gestion templates
│   │   ├── leases/       # Génération baux
│   │   ├── parties/      # Bailleurs/locataires
│   │   ├── properties/   # Gestion biens
│   │   └── credits/      # Gestion crédits
│   ├── lib/               # Utilitaires
│   └── types/             # Types TypeScript
├── immo-api/              # Backend (à venir)
│   └── src/
│       ├── routes/        # Routes API
│       ├── services/      # Logique métier
│       │   ├── pdf-generator.ts
│       │   ├── template-processor.ts
│       │   ├── credit-manager.ts
│       │   └── webhook-caller.ts
│       └── utils/         # Utilitaires
└── docs/                  # Documentation
    ├── ARCHITECTURE.md    # Architecture détaillée
    └── SCHEMA.md          # Documentation schéma SQL
```

---

## 📊 Workflows automatiques

### 1. Génération de bail

```
┌──────────────────────────────────────────────────┐
│ 1. Utilisateur remplit formulaire               │
│ 2. Validation des champs selon pays + type      │
│ 3. Vérification crédits disponibles             │
│ 4. Déduction crédits                            │
│ 5. Génération DOCX depuis template              │
│ 6. Conversion PDF (Pandoc)                      │
│ 7. Upload vers stockage (Cloudinary/S3)        │
│ 8. Trigger webhook N8N (si configuré)          │
│ 9. Envoi email (optionnel)                      │
└──────────────────────────────────────────────────┘
```

### 2. Auto-numérotation
- **Baux** : BAIL-2025-00001

### 3. Système de crédits
- Achat → Transaction "purchase" → Solde augmente
- Génération → Transaction "usage" → Solde diminue
- Expiration → Transaction "expiration" → Crédits expirés

### 4. Webhooks N8N
- Événement déclenché (ex: lease_generated)
- Vérification filtres conditionnels
- Appel HTTP POST vers N8N
- Log de l'appel (succès/échec)

---

## 🎨 Design & UX

### Principes
- Wizard multi-étapes pour génération
- Formulaires adaptatifs selon pays/type
- Prévisualisation avant génération
- Historique des baux générés
- Tableau de bord crédits

### Étapes de génération

1. **Choix du pays** → Affiche templates disponibles
2. **Choix du type de bail** → Résidentiel, commercial, etc.
3. **Sélection template** → Templates pré-configurés
4. **Informations bailleur** → Nouveau ou existant
5. **Informations locataire** → Nouveau ou existant
6. **Informations bien** → Nouveau ou existant
7. **Détails du bail** → Loyer, charges, durée, etc.
8. **Champs spécifiques** → Selon pays et type
9. **Révision** → Prévisualisation
10. **Génération** → DOCX + PDF créés

### Tableau de bord

- Solde de crédits
- Baux générés ce mois
- Derniers baux créés
- Packages de crédits disponibles
- Webhooks actifs

---

## 📝 Prochaines étapes

### Phase 1 : Setup (en cours)
- [x] Créer schéma SQL `immo_app`
- [x] Créer structure `apps/immo`
- [ ] Initialiser Next.js 14
- [ ] Configurer Supabase client
- [ ] Setup Tailwind CSS

### Phase 2 : MVP
- [ ] Module Crédits (achat, solde)
- [ ] Module Templates basique (France uniquement)
- [ ] Module Parties (bailleurs/locataires)
- [ ] Générateur basique (DOCX uniquement)
- [ ] Dashboard minimal

### Phase 3 : Génération avancée
- [ ] Support multi-pays (8 pays)
- [ ] Conversion PDF (Pandoc)
- [ ] Champs dynamiques conditionnels
- [ ] Validation légale par pays
- [ ] Templates personnalisés

### Phase 4 : Intégrations
- [ ] N8N webhooks
- [ ] Envoi emails
- [ ] Signature électronique (Yousign)
- [ ] API publique

---

## 🔗 Liens utiles

- **Schéma SQL** : `supabase/migrations/003_schema_immo_app.sql`
- **Documentation complète** : Fournie par l'utilisateur

---

## 🛠️ Technologies

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/ui
- React Hook Form + Zod
- TanStack Query

### Backend
- Supabase PostgreSQL
- Supabase Auth (MFA)
- Supabase Storage
- Hono API

### Document Generation
- Pandoc (DOCX → PDF)
- Mustache/Handlebars (template engine)
- PDFKit (alternative)

### Intégrations
- N8N (workflow automation)
- Resend/SendGrid (emails)
- Cloudinary/S3 (storage)
- Stripe/PayPal (paiements)
- Yousign (signature électronique)

---

## 📄 License

Propriétaire - © 2025
