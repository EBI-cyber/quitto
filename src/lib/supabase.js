import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Solange der anon key fehlt, läuft die App rein lokal (local-first).
export const supabase = url && key ? createClient(url, key) : null
export const isCloudReady = Boolean(supabase)
