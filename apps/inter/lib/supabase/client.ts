import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Helper pour requêtes sur le schéma inter_app_public (multi-métiers)
export function fromInterApp(table: string) {
  const client = createClient()
  return client.schema('inter_app_public').from(table)
}
