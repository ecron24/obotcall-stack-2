# 🏦 Agent App - CRM Courtier en Assurance

Application de gestion de courtage en assurance (Insurance Broker CRM).

---

## 📋 Vue d'ensemble

**Type :** Application métier pour courtiers en assurance
**Schema DB :** `agent_app` (18 tables)
**Stack :** Next.js 14, TypeScript, Supabase, Hono
**Status :** 🚧 En développement

---

## 🎯 Fonctionnalités principales

### 1. Gestion des contacts
- ✅ Prospects et clients (individual/professional)
- ✅ Personnes à charge (famille)
- ✅ Informations entreprises (B2B)
- ✅ Auto-promotion prospect → client à la signature

### 2. Processus de vente
- ✅ Devis comparatifs (max 3 compagnies)
- ✅ Auto-numérotation DEV-YYYY-XXXXX
- ✅ Gestion des contrats d'assurance
- ✅ Historique des avenants

### 3. Facturation
- ✅ Honoraires de courtage
- ✅ Auto-numérotation FAC-YYYY-XXXXX
- ✅ Remises automatiques (5 types)
- ✅ Suivi des paiements

### 4. Conformité légale
- ✅ Réclamations (processus 3 niveaux)
- ✅ Auto-numérotation REC-YYYY-XXXXX
- ✅ RGPD (consentements, traçabilité)
- ✅ LCB-FT (anti-blanchiment)

### 5. Outils métier
- ✅ Gestion documentaire centralisée
- ✅ Formulaires dynamiques (JSONB)
- ✅ Tâches et rappels
- ✅ Historique emails

---

## 🗄️ Structure de la base de données

**Schema :** `agent_app`
**Migration :** `supabase/migrations/004_schema_agent_app.sql`

### Tables principales (18)

#### Gestion des contacts (4)
- `contacts` - Prospects & clients
- `dependents` - Personnes à charge
- `professional_info` - Infos entreprises
- `business_activities` - Répartition activités

#### Assurance & produits (6)
- `companies` - Compagnies d'assurance
- `products` - Produits d'assurance
- `quotes` - Devis
- `quote_items` - Tableau comparatif
- `contracts` - Contrats
- `contract_amendments` - Avenants

#### Opérations (4)
- `documents` - Gestion documentaire
- `invoices` - Facturation
- `claims` - Réclamations
- `claims_history` - Sinistres

#### Support (4)
- `form_submissions` - Formulaires dynamiques
- `consents` - Traçabilité RGPD
- `tasks` - Tâches et rappels
- `emails` - Historique communications

---

## 🔐 Sécurité

- **RLS (Row Level Security)** : Toutes les tables
- **Multi-tenant** : Isolation complète par tenant
- **Audit trail** : Toutes les actions tracées
- **Soft delete** : Suppression logique partout
- **Search path** : Protection SQL injection

---

## 🚀 Architecture

```
apps/agent/
├── src/                    # Frontend Next.js (à venir)
│   ├── app/               # App Router Next.js 14
│   ├── components/        # Composants React
│   ├── lib/               # Utilitaires
│   └── types/             # Types TypeScript
├── agent-api/             # Backend Hono (à venir)
│   └── src/
│       ├── routes/        # Routes API
│       ├── services/      # Logique métier
│       └── utils/         # Utilitaires
└── docs/                  # Documentation
    ├── ARCHITECTURE.md    # Architecture détaillée
    └── SCHEMA.md          # Documentation schéma SQL
```

---

## 📊 Workflows automatiques

### 1. Prospect → Client
```sql
-- Trigger sur INSERT de contract
→ UPDATE contact SET status = 'client'
```

### 2. Auto-numérotation
- **Devis** : DEV-2025-00001
- **Factures** : FAC-2025-00001
- **Réclamations** : REC-2025-00001

### 3. Réclamations
- Niveau 1 : Courtier (10 jours)
- Niveau 2 : Compagnie
- Niveau 3 : Médiation CCSF

### 4. RGPD
- Suppression auto après 3 ans d'inactivité
- Traçabilité des consentements
- Calcul automatique date de rétention

---

## 🎨 Design & UX (Besoins utilisateur)

### Principes
- Épuré
- Simple et facile à visualiser
- Desktop first, mobile secondary

### Tableau de bord matinal
1. Tâches du jour
2. Rendez-vous du jour
3. Tâches en retard
4. Appels programmés
5. Contrats à renouveler (30/60/90j)

### Rapports
- Prospects (taux conversion, source)
- Portefeuille (répartition, commissions)
- Facturation (CA, impayés)
- Conformité (documents, réclamations)

---

## 📝 Prochaines étapes

### Phase 1 : Setup (en cours)
- [x] Créer schéma SQL `agent_app`
- [x] Créer structure `apps/agent`
- [ ] Initialiser Next.js 14
- [ ] Configurer Supabase client
- [ ] Setup Tailwind CSS

### Phase 2 : MVP
- [ ] Module Contacts (individual)
- [ ] Module Devis basique
- [ ] Module Contrats basique
- [ ] Gestion documentaire
- [ ] Dashboard minimal

### Phase 3 : Fonctionnalités métier
- [ ] Formulaires dynamiques
- [ ] Facturation avec remises
- [ ] Réclamations
- [ ] Clients professionnels
- [ ] Emails avec templates

### Phase 4 : Conformité
- [ ] RGPD complet
- [ ] LCB-FT
- [ ] Audit trail
- [ ] Archivage automatique

---

## 🔗 Liens utiles

- **Schéma SQL** : `supabase/migrations/004_schema_agent_app.sql`
- **Analyse besoins** : `docs/courtier-app-detailed-analysis.md`
- **Questionnaire** : `docs/courtier-app-requirements.md`

---

## 📄 License

Propriétaire - © 2025
