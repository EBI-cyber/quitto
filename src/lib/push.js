import { supabase, isCloudReady } from './supabase'

// Öffentlicher VAPID-Schlüssel (darf im Client stehen)
const VAPID_PUBLIC = 'BLZRA9eraQx1sfvn-F16roWmBr_0xY-x2LKLHO5O2z8iR-0NmmnhNawDOKgHPSwasizHqlXWEQkx2tg7o5N5ges'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function pushStatus() {
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    return sub ? 'on' : 'off'
  } catch {
    return 'off'
  }
}

export async function enablePush(userEmail) {
  if (!pushSupported()) throw new Error('Dein Browser unterstützt keine Benachrichtigungen.')
  if (!isCloudReady) throw new Error('Keine Cloud-Verbindung.')
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Benachrichtigungen wurden nicht erlaubt.')
  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    })
  }
  const json = sub.toJSON()
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ endpoint: sub.endpoint, user_email: (userEmail || '').toLowerCase(), subscription: json }, { onConflict: 'endpoint' })
  if (error) throw error
  return true
}
