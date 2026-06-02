// Supabase Edge Function: sendet eine Web-Push-Nachricht an eine Putzkraft (per E-Mail)
// Secrets (in Supabase setzen): VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT
// SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY werden automatisch bereitgestellt.
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { payee_email, title, body, url } = await req.json()
    if (!payee_email) {
      return new Response(JSON.stringify({ error: 'payee_email fehlt' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    webpush.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@quitto.app',
      Deno.env.get('VAPID_PUBLIC')!,
      Deno.env.get('VAPID_PRIVATE')!,
    )

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, subscription')
      .eq('user_email', String(payee_email).toLowerCase())
    if (error) throw error

    const payload = JSON.stringify({ title: title || 'Quitto', body: body || '', url: url || '/quitto/' })

    let sent = 0
    await Promise.all((subs || []).map(async (s) => {
      try {
        await webpush.sendNotification(s.subscription, payload)
        sent++
      } catch (e) {
        // Abgelaufene/ungültige Abos entfernen
        const code = e && (e.statusCode || e.status)
        if (code === 404 || code === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
        }
      }
    }))

    return new Response(JSON.stringify({ sent }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
