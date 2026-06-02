import Dexie from 'dexie'
import { sha256, randomToken } from './hash'

export const db = new Dexie('quitto')
db.version(1).stores({
  belege: '++id, number, token, direction, createdAt, hash',
})

export async function nextNumber(prefix, direction) {
  const year = new Date().getFullYear()
  const count = await db.belege.where('direction').equals(direction).count()
  const seq = String(count + 1).padStart(4, '0')
  return `${prefix}-${year}-${seq}`
}

async function lastHash() {
  const last = await db.belege.orderBy('id').last()
  return last?.hash || 'GENESIS'
}

// Nur die unveränderlichen Finanzdaten fließen in die Hash-Kette.
// Signatur & Status können später (Remote-Unterschrift) ergänzt werden,
// ohne die Manipulationssicherheit der Kette zu brechen.
function hashPayload(b, prevHash) {
  return JSON.stringify({
    number: b.number,
    token: b.token,
    direction: b.direction,
    date: b.date,
    items: b.items,
    total: b.total,
    customer: b.customer,
    payeeEmail: b.payeeEmail ?? null,
    createdAt: b.createdAt,
    prevHash,
  })
}

export async function addBeleg(beleg) {
  const prevHash = await lastHash()
  const token = randomToken()
  const createdAt = new Date().toISOString()
  const core = { ...beleg, token, createdAt, prevHash, status: beleg.status || 'signed' }
  const hash = await sha256(hashPayload(core, prevHash))
  const id = await db.belege.add({ ...core, hash, synced: 0 })
  return { id, ...core, hash }
}

export async function allBelege() {
  return db.belege.orderBy('id').reverse().toArray()
}

// --- Cloud-Sync-Helfer ---
export async function pendingBelege() {
  const all = await db.belege.toArray()
  return all.filter((b) => !b.synced)
}

export async function markSynced(id) {
  await db.belege.update(id, { synced: 1 })
}

// Belege aus der Cloud lokal einspielen bzw. aktualisieren (Dedup/Update über token)
export async function upsertFromCloud(list) {
  for (const b of list) {
    const ex = await db.belege.where('token').equals(b.token).first()
    if (ex) await db.belege.update(ex.id, { ...b, synced: 1 })
    else await db.belege.add({ ...b, synced: 1 })
  }
}

// Nachträgliche (Remote-)Unterschrift lokal eintragen
export async function signBelegLocal(token, signatureDataUrl, signerName) {
  const ex = await db.belege.where('token').equals(token).first()
  if (ex) await db.belege.update(ex.id, { signatureDataUrl, signerName, status: 'signed' })
}

// Integrität der Kette prüfen (Cockpit/Audit)
export async function verifyChain() {
  const items = await db.belege.orderBy('id').toArray()
  let prev = 'GENESIS'
  for (const it of items) {
    const expect = await sha256(hashPayload(it, prev))
    if (it.prevHash !== prev || expect !== it.hash) {
      return { ok: false, brokenAt: it.number }
    }
    prev = it.hash
  }
  return { ok: true, count: items.length }
}
