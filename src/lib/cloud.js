import { supabase, isCloudReady } from './supabase'
import { pendingBelege, markSynced, upsertFromCloud } from './db'

function toRow(b) {
  return {
    number: b.number,
    token: b.token,
    direction: b.direction,
    beleg_date: b.date ? String(b.date).slice(0, 10) : null,
    items: b.items,
    total: b.total,
    customer: b.customer,
    signature_data_url: b.signatureDataUrl,
    signer_name: b.signerName,
    payment_method: b.paymentMethod,
    tax_mode: b.taxMode,
    vat_rate: b.vatRate,
    prev_hash: b.prevHash,
    hash: b.hash,
    payee_email: b.payeeEmail || null,
    status: b.status || 'signed',
    device: navigator.userAgent,
    created_at: b.createdAt,
  }
}

export function fromRow(r) {
  return {
    cloudId: r.id,
    number: r.number,
    token: r.token,
    direction: r.direction,
    date: r.beleg_date,
    items: r.items || [],
    total: Number(r.total) || 0,
    customer: r.customer,
    signatureDataUrl: r.signature_data_url,
    signerName: r.signer_name,
    paymentMethod: r.payment_method,
    taxMode: r.tax_mode,
    vatRate: r.vat_rate,
    prevHash: r.prev_hash,
    hash: r.hash,
    payeeEmail: r.payee_email,
    owner: r.owner,
    status: r.status,
    createdAt: r.created_at,
  }
}

// Remote-Unterschrift: Putzkraft trägt Signatur an ihrem Beleg ein (RLS erlaubt nur eigene, pending)
export async function signBelegRemote(token, signatureDataUrl, signerName) {
  if (!(await hasSession())) return { ok: false, reason: 'no-session' }
  const { error } = await supabase
    .from('belege')
    .update({ signature_data_url: signatureDataUrl, signer_name: signerName, status: 'signed' })
    .eq('token', token)
  return error ? { ok: false, error } : { ok: true }
}

async function hasSession() {
  if (!isCloudReady) return false
  const { data } = await supabase.auth.getSession()
  return Boolean(data.session)
}

export async function pushBeleg(b) {
  if (!(await hasSession())) return { ok: false, reason: 'offline-or-no-session' }
  const { error } = await supabase.from('belege').insert(toRow(b))
  return error ? { ok: false, error } : { ok: true }
}

export async function pullBelege() {
  if (!(await hasSession())) return []
  const { data, error } = await supabase.from('belege').select('*').order('created_at', { ascending: false })
  if (error) return []
  return data.map(fromRow)
}

// Offline-first Sync: erst lokale Pending hochschieben, dann Cloud-Stand mergen
export async function syncAll() {
  if (!(await hasSession())) return { ok: false }
  const pend = await pendingBelege()
  for (const b of pend) {
    const r = await pushBeleg(b)
    if (r.ok) await markSynced(b.id)
  }
  const cloud = await pullBelege()
  await upsertFromCloud(cloud)
  return { ok: true, pushed: pend.length, pulled: cloud.length }
}
