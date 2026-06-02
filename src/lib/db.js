import Dexie from 'dexie'
import { sha256, randomToken } from './hash'

export const db = new Dexie('quitto')
db.version(1).stores({
  belege: '++id, number, token, direction, createdAt, hash',
})

// Fortlaufende, lückenlose Nummer pro Richtung & Jahr
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

// Fügt einen Beleg unveränderbar mit Hash-Kette hinzu (jeder Beleg referenziert den vorherigen Hash)
export async function addBeleg(beleg) {
  const prevHash = await lastHash()
  const token = randomToken()
  const createdAt = new Date().toISOString()
  const core = { ...beleg, token, createdAt, prevHash }
  const hash = await sha256(JSON.stringify(core))
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

// Belege aus der Cloud lokal einspielen (Dedup über token)
export async function upsertFromCloud(list) {
  for (const b of list) {
    const exists = await db.belege.where('token').equals(b.token).count()
    if (!exists) await db.belege.add({ ...b, synced: 1 })
  }
}

// Prüft die Integrität der Kette (für Cockpit/Audit)
export async function verifyChain() {
  const items = await db.belege.orderBy('id').toArray()
  let prev = 'GENESIS'
  for (const it of items) {
    const { id, hash, synced, ...core } = it
    const expect = await sha256(JSON.stringify({ ...core, prevHash: prev }))
    if (it.prevHash !== prev || expect !== hash) {
      return { ok: false, brokenAt: it.number }
    }
    prev = hash
  }
  return { ok: true, count: items.length }
}
