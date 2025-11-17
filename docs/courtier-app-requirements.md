# 📋 Analyse des Besoins - Application Courtier

> Analyse du questionnaire soumis le 2025-11-13 18:03:00
> Document de référence pour la conception de l'app courtier

---

## 🎯 Vue d'ensemble

Application CRM pour courtiers en assurance avec gestion complète du cycle de vie client : prospect → devis → contrat → suivi.

---

## 👥 1. GESTION DES CONTACTS

### 1.1 Fiche Prospect (champs minimums)
- ✅ Nom
- ✅ Prénom
- ✅ Téléphone
- ✅ Email
- ✅ Adresse postale
- 📝 **Important** : Tous les champs doivent être accessibles dès le stade prospect pour complétion progressive

### 1.2 Passage Prospect → Client (champs supplémentaires obligatoires)

**Informations personnelles :**
- Civilité
- Date de naissance
- Profession
- Profession précise (champ libre)
- Situation familiale (marié, pacsé, célibataire, divorcé, séparé)
- Régime matrimonial
- Enfants (présence, nombre, à charge ou non)

**Pour les professionnels :**
- SIRET
- Nom de l'entreprise
- Adresse de l'entreprise

**Informations financières :**
- Revenus (pour prévoyance et retraite)
- Placements existants (Livret A + montant, Assurance vie + montant, etc.)
- Champs ajoutables dynamiquement selon le besoin

### 1.3 Statuts et Workflow

**Transition automatique :**
- Passage automatique de "Prospect" à "Client" dès signature d'un contrat

**Statuts intermédiaires pour prospect :**
- ✅ Relance devis
- ✅ Attente paiement frais de courtage

### 1.4 Relations entre contacts
- Liens familiaux (ex: M. Dupont est le conjoint de Mme. Durand)
- Liens professionnels (ex: M. Martin est l'apporteur d'affaires)
- Notes libres

### 1.5 Critères de filtrage prioritaires
- Profession
- Code postal / Ville
- Âge
- Date d'effet / échéance des contrats
- Type de contrat

**Fonctionnalité requise :**
- ✅ Listes dynamiques basées sur filtres (notamment pour rappels échéances et anniversaires 50 et 69 ans)

---

## 💼 2. GESTION DES DEVIS

### 2.1 Processus de création
1. Interrogation des compagnies partenaires
2. Sélection de 3 solutions
3. Création d'un tableau comparatif

**Nombre de compagnies partenaires :** 6 à 8 par type de produit

**Mode de gestion :** Manuel (tarifs saisis dans l'application, pas d'interfaçage direct avec compagnies)

### 2.2 Présentation au client
- Tableau comparatif simple : garanties + prix

### 2.3 Documents envoyés avec le devis
**1 PDF protocole de courtage comprenant :**
- Protocole de courtage
- CGV
- Grille tarifaire
- Fiche cabinet

**1 PDF comparatif avec annexes :**
- Tableau comparatif
- Conditions générales (par compagnie)
- Fiche d'information et de conseil du produit
- Documents variables selon compagnies/contrats

---

## 📄 3. GESTION DES CONTRATS

### 3.1 Champs obligatoires
- Nom compagnie
- Type de garanties :
  - Santé
  - Prévoyance
  - Retraite (individuelle, TNS, collective)
  - IARD (auto, habitation, RC Pro)
- N° de police
- Date d'effet
- Emplacement pour document PDF consultable

### 3.2 Règles métier
- ✅ Contrat obligatoirement lié à un client
- ✅ Gestion des avenants (modifications)
- ✅ Alertes automatiques 6 mois avant échéance

### 3.3 Gestion des modifications

**Remplacement complet :**
- Ancien contrat → archive
- Nouveau contrat → actif avec mention "remplacement"

**Avenant :**
- Conservation historique
- Contrat actuel en premier avec caractéristiques mises à jour
- Champ "avenant" pour traçabilité

**Note :** Gestion des modifications se fait sur les sites des compagnies, l'app doit juste tracer l'historique

---

## 📧 4. GESTION DES EMAILS

### 4.1 Points d'envoi dans l'application
- Depuis fiche client
- Depuis contrat

### 4.2 Types d'emails
- Relance prospect
- Envoi de devis
- Message de bienvenue

### 4.3 Fonctionnalités requises
- ✅ Modèles d'emails pré-enregistrés
- ✅ Traçabilité dans historique client
- ✅ Email depuis l'app avec nom de domaine propre (pas d'intégration Gmail/Outlook)

---

## 📁 5. GESTION DOCUMENTAIRE

### 5.1 Types de documents

**Documents génériques :**
- CNI (avec alerte fin de validité)
- Justificatifs de domicile
- RIB
- Permis
- Cartes grises

**Documents professionnels :**
- KBIS
- Documents comptables (prévisionnel, liste salariés)

**Documents contractuels :**
- Devis signés
- Contrats et avenants
- Courriers de résiliation

### 5.2 Organisation
- Par client (documents génériques comme CNI, RIB)
- Par contrat (documents spécifiques au contrat)
- Recherche par nom + recherche manuelle

### 5.3 Génération de documents
- ⚠️ À préciser : génération de tableau comparatif avec données CRM
- Documents à inclure : fiche cabinet, CGV, pièces réglementaires

---

## 🔐 6. RGPD & CONFORMITÉ

### 6.1 Consentement
- Recueilli via fiche cabinet et CGV

### 6.2 Finalités de traitement
- ✅ Gestion différenciée : prospects non-clients, anciens clients, contrats résiliés

### 6.3 Droits des personnes
- Exercice par simple demande
- ⏳ Portail client à prévoir

### 6.4 Conservation des données

**Prospects non-clients :**
- 3 ans d'inactivité → suppression/anonymisation automatique (conformité CNIL)

**Documents contractuels :**
- 3 ans après fin de contrat (selon docs RGPD)
- Archivage géré par l'application

### 6.5 Sécurité

**Authentification :**
- ✅ MFA (authentification à deux facteurs)

**Chiffrement :**
- ✅ Au repos (serveurs)
- ✅ En transit (navigateur ↔ serveur)

**Audit :**
- Journal d'audit traçant les accès aux fiches clients

---

## ✅ 7. GESTION DES TÂCHES

### 7.1 Fonctionnalités
- ✅ To-do list intégrée
- ✅ Rappels programmables

### 7.2 Liaisons
Une tâche peut être liée à :
- Un client
- Un prospect
- Un contrat spécifique
- Toute action de suivi, rappel, changement

---

## 📅 8. CALENDRIER & NOTIFICATIONS

### 8.1 Calendrier
- ⏳ À prévoir
- Synchronisation avec Google Calendar

### 8.2 Types de notifications
- Échéances de contrat (6 mois avant)
- Contact client annuel (rappel basé sur dernier échange)
- Anniversaires clients (optionnel, à retravailler)
- 50ème et 69ème anniversaire (important pour retraite)

---

## 📊 9. TABLEAU DE BORD & RAPPORTS

### 9.1 Vue matinale (5 infos prioritaires)
1. Tâches du jour
2. Rendez-vous du jour (avec GPS lié à fiche client si possible)
3. Tâches en retard
4. Appels clients programmés
5. [5ème à définir]

### 9.2 Rapports sur les ventes
- Nombre de contrats
- Primes des contrats
- Commissions

### 9.3 Rapports sur les prospects
- Non spécifié

### 9.4 Rapports sur le portefeuille
- ✅ Répartition par type de contrat
- ✅ Répartition par compagnie
- ✅ Rapport nombre de contrats / commissions

### 9.5 Rapports sur les commissions
- ✅ Oui

### 9.6 Export
- ✅ Excel

---

## 🎨 10. DESIGN & UX

### 10.1 Principes
- Épuré
- Simple
- Facile à visualiser

### 10.2 Plateformes
**Priorité 1 :** Ordinateur
**Priorité 2 :** Smartphone/tablette (usage en déplacement)

---

## 🏢 11. ARCHITECTURE MULTI-TENANT

### 11.1 Isolation
- ✅ Impératif : chaque courtier (ou cabinet) a son espace isolé et sécurisé

### 11.2 Gestion des mandataires
- ⚠️ Important : si un courtier a des mandataires, il doit avoir vision sur leur activité et clients

### 11.3 Niveaux d'abonnement
- ✅ Différents niveaux selon fonctionnalités
- Variables selon activité :
  - Patrimonial ou non
  - Collectif ou non
  - Autres spécialités

### 11.4 Personnalisation
- ✅ Nécessaire pour futurs clients

---

## 🔄 12. SIGNATURE ÉLECTRONIQUE

- ⏳ À prévoir
- Devis et mandats

---

## 📋 RÉCAPITULATIF DES PRIORITÉS

### ✅ Fonctionnalités confirmées (P0)
1. Gestion contacts prospect/client avec champs dynamiques
2. Workflow automatique prospect → client à la signature
3. Gestion contrats avec alertes échéances
4. To-do list liée à clients/contrats
5. Gestion documentaire par client/contrat
6. Emails avec modèles et traçabilité
7. Tableau de bord avec tâches du jour
8. Rapports ventes/portefeuille/commissions
9. RGPD : suppression auto après 3 ans, audit trail
10. Sécurité : MFA + chiffrement
11. Multi-tenant avec isolation

### ⏳ À prévoir (P1)
1. Portail client
2. Signature électronique
3. Calendrier intégré
4. Intégration GPS pour rendez-vous

### ⚠️ À préciser
1. Génération automatique de tableaux comparatifs depuis données CRM
2. 5ème info prioritaire du dashboard
3. Alertes anniversaires (définir règles exactes)

---

## 📝 NOTES TECHNIQUES

### Schéma de données principal

```
Tenants (courtiers/cabinets)
├── Users (courtiers + mandataires)
├── Contacts
│   ├── Type: prospect | client
│   ├── Statut prospect: nouveau | relance_devis | attente_paiement
│   ├── Relations (conjoint, apporteur, etc.)
│   └── Documents
├── Contrats
│   ├── Compagnie
│   ├── Type garantie
│   ├── Statut: actif | archive | resilié
│   ├── Avenants (historique)
│   └── Documents
├── Devis
│   ├── Lignes comparatives (3 max)
│   └── Documents générés
├── Tâches
│   └── Liées à: contact | contrat
├── Emails
│   └── Historique par contact
└── Documents
    └── Organisation: par contact | par contrat
```

### Considérations de développement

**Base de données :**
- Déjà en place : `public` schema pour multi-tenant
- À créer : `courtier_app` schema

**Alertes automatiques :**
- Échéances contrats (6 mois avant)
- CNI expirée
- Contact client annuel
- Anniversaires 50/69 ans

**Workflow automatique :**
- Statut prospect → client sur signature contrat
- Suppression/anonymisation RGPD après 3 ans

**Intégrations futures :**
- Google Calendar
- Système de signature électronique
- GPS/cartographie

---

**Date d'analyse :** 2025-11-17
**Version :** 1.0
**Prochaines étapes :** Attente documents complémentaires
