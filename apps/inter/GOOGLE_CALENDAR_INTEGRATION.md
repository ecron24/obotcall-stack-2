# Intégration Google Calendar

## Vue d'ensemble

Cette application permet de synchroniser les interventions avec Google Calendar de manière bidirectionnelle :
- Créer des événements Google Calendar depuis l'interface
- Importer automatiquement les événements Google Calendar comme interventions

## Configuration requise

### 1. Créer un projet Google Cloud

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet ou sélectionner un projet existant
3. Activer l'API Google Calendar

### 2. Configurer OAuth 2.0

1. Dans Google Cloud Console, aller à **APIs & Services > Credentials**
2. Créer des identifiants OAuth 2.0 :
   - Type d'application : Application Web
   - Origines JavaScript autorisées : `http://localhost:3000`, `https://votre-domaine.com`
   - URI de redirection : `http://localhost:3000/api/auth/google/callback`

3. Récupérer :
   - Client ID
   - Client Secret

### 3. Variables d'environnement

Ajouter dans `.env.local` :

```env
# Google Calendar
GOOGLE_CLIENT_ID=votre-client-id
GOOGLE_CLIENT_SECRET=votre-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

## Architecture

### Frontend (Next.js)

- Page calendrier : `/apps/inter/src/app/dashboard/calendrier/page.tsx`
- Vues : Mensuelle (grille) et Hebdomadaire (liste)
- Modal de création de RDV avec formulaire complet

### Backend API (à implémenter)

#### Endpoints nécessaires

##### 1. Authentification Google

```typescript
// POST /api/auth/google/connect
// Démarre le flux OAuth et redirige vers Google
{
  redirect_url: string
}

// GET /api/auth/google/callback
// Callback après autorisation Google
// Sauvegarde le refresh_token en BDD

// GET /api/auth/google/status
// Vérifie si l'utilisateur a connecté son Google Calendar
{
  connected: boolean,
  email?: string
}

// DELETE /api/auth/google/disconnect
// Déconnecte Google Calendar
```

##### 2. Événements Calendar

```typescript
// POST /api/calendar/events
// Crée un événement Google Calendar et une intervention en BDD
{
  summary: string,          // Nom du client
  description: string,      // Type d'intervention, notes
  location: string,         // Adresse
  start: {
    dateTime: string,       // ISO 8601
    timeZone: string        // "Europe/Paris"
  },
  end: {
    dateTime: string,
    timeZone: string
  },
  attendees: [
    { email: string }
  ]
}

// GET /api/calendar/events/sync
// Synchronise les événements Google Calendar avec la BDD
// - Récupère les événements depuis Google
// - Crée/met à jour les interventions en BDD
// - Marque source = 'google'

// GET /api/calendar/events?start_date=...&end_date=...
// Liste les événements (existant déjà)
```

### Base de données

Modifications nécessaires :

```sql
-- Table pour stocker les tokens Google OAuth par utilisateur
CREATE TABLE google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Ajouter colonne source dans interventions
ALTER TABLE interventions
ADD COLUMN source VARCHAR(50) DEFAULT 'local',
ADD COLUMN google_event_id TEXT,
ADD COLUMN google_calendar_id TEXT;

CREATE INDEX idx_interventions_google_event ON interventions(google_event_id);
```

## Flux de synchronisation

### Création de RDV depuis l'interface

1. Utilisateur clique sur "Créer RDV"
2. Remplit le formulaire (date, heure, client, type, etc.)
3. Frontend appelle `POST /api/calendar/events`
4. Backend :
   - Vérifie le token Google (refresh si expiré)
   - Crée l'événement dans Google Calendar
   - Crée l'intervention en BDD avec `source='local'` et `google_event_id`
5. Frontend rafraîchit le calendrier

### Import depuis Google Calendar

1. Cron job ou webhook appelle `GET /api/calendar/events/sync` régulièrement
2. Backend :
   - Récupère les événements Google depuis la dernière sync
   - Pour chaque événement :
     - Si `google_event_id` existe en BDD : mettre à jour
     - Sinon : créer nouvelle intervention avec `source='google'`
3. Les événements apparaissent dans le calendrier avec badge "Depuis Google"

### Statistiques

Dans la page calendrier, on affiche :
- **Total** : Nombre total d'interventions du mois
- **Créées ici** : Interventions avec `source='local'`
- **Depuis Google** : Interventions avec `source='google'`

## Bibliothèques recommandées

### Backend (Node.js)

```bash
npm install googleapis
```

```typescript
import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

// Utiliser le refresh_token stocké en BDD
oauth2Client.setCredentials({
  refresh_token: userRefreshToken
})

const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

// Créer un événement
const event = await calendar.events.insert({
  calendarId: 'primary',
  requestBody: {
    summary: 'Intervention piscine - M. Dupont',
    location: '10 Rue de la Piscine, 13001 Marseille',
    description: 'Type: Entretien\nNotes: Vérifier le pH',
    start: {
      dateTime: '2025-12-10T09:00:00+01:00',
      timeZone: 'Europe/Paris',
    },
    end: {
      dateTime: '2025-12-10T10:00:00+01:00',
      timeZone: 'Europe/Paris',
    },
  },
})

// Lister les événements
const events = await calendar.events.list({
  calendarId: 'primary',
  timeMin: new Date().toISOString(),
  maxResults: 100,
  singleEvents: true,
  orderBy: 'startTime',
})
```

## Webhooks (optionnel)

Pour une synchronisation en temps réel, utiliser les webhooks Google Calendar :

```typescript
// Créer un watch
await calendar.events.watch({
  calendarId: 'primary',
  requestBody: {
    id: 'unique-channel-id',
    type: 'web_hook',
    address: 'https://votre-domaine.com/api/calendar/webhook'
  }
})

// Endpoint webhook
// POST /api/calendar/webhook
// Reçoit les notifications de changements et déclenche une sync
```

## Sécurité

1. **Tokens** : Stocker les refresh_tokens chiffrés en BDD
2. **Scopes** : Demander uniquement `https://www.googleapis.com/auth/calendar.events`
3. **Validation** : Valider tous les champs avant création d'événement
4. **Rate limiting** : Limiter les appels API Google (10 req/s max)

## Testing

1. Créer un calendrier de test Google Calendar
2. Tester création d'événements
3. Tester import d'événements existants
4. Tester synchronisation bidirectionnelle
5. Tester cas d'erreur (token expiré, API indisponible)

## Étapes suivantes

1. ✅ Frontend calendrier avec vues mensuelle/hebdomadaire
2. ✅ Modal de création de RDV
3. ⏳ Créer endpoints backend API
4. ⏳ Implémenter authentification OAuth Google
5. ⏳ Implémenter création d'événements
6. ⏳ Implémenter synchronisation bidirectionnelle
7. ⏳ Ajouter migrations BDD pour tokens et source
8. ⏳ Tester en production

## Documentation

- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [googleapis npm package](https://www.npmjs.com/package/googleapis)
