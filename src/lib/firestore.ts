import { getDb } from './firebase'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

function toISO(val: unknown): string | null {
  if (!val) return null
  if (val instanceof Timestamp) return val.toDate().toISOString()
  if (typeof val === 'string') return val
  if (val instanceof Date) return val.toISOString()
  return null
}

function snapToObj<T = Record<string, unknown>>(snap: { id: string; data: () => Record<string, unknown>; exists: () => boolean }): (T & { id: string }) | null {
  if (!snap.exists()) return null
  const data = snap.data()
  const result: Record<string, unknown> = { id: snap.id }
  for (const [key, val] of Object.entries(data)) {
    if (val instanceof FieldValue) continue
    result[key] = toISO(val) ?? val
  }
  return result as T & { id: string }
}

function snapsToArr<T = Record<string, unknown>>(snaps: { docs: { id: string; data: () => Record<string, unknown> }[] }): (T & { id: string })[] {
  return snaps.docs.map(d => {
    const data = d.data()
    const result: Record<string, unknown> = { id: d.id }
    for (const [key, val] of Object.entries(data)) {
      if (val instanceof FieldValue) continue
      result[key] = toISO(val) ?? val
    }
    return result as T & { id: string }
  })
}

export async function getById<T = Record<string, unknown>>(col: string, id: string): Promise<(T & { id: string }) | null> {
  const db = getDb()
  const snap = await db.collection(col).doc(id).get()
  return snapToObj<T>(snap)
}

export async function getByField<T = Record<string, unknown>>(col: string, field: string, value: unknown): Promise<(T & { id: string }) | null> {
  const db = getDb()
  const snap = await db.collection(col).where(field, '==', value).limit(1).get()
  if (snap.empty) return null
  return snapToObj<T>(snap.docs[0])
}

export async function getAll<T = Record<string, unknown>>(
  col: string,
  options?: {
    where?: Record<string, [string, unknown]>
    orderBy?: string
    orderDir?: 'asc' | 'desc'
    limit?: number
    offset?: number
  }
): Promise<(T & { id: string })[]> {
  const db = getDb()
  let q = db.collection(col) as ReturnType<typeof db.collection>
  if (options?.where) {
    for (const [field, [op, value]] of Object.entries(options.where)) {
      q = q.where(field, op as any, value)
    }
  }
  if (options?.orderBy) {
    q = q.orderBy(options.orderBy, options.orderDir || 'desc')
  }
  if (options?.limit) {
    const totalLimit = options.offset ? options.limit + options.offset : options.limit
    q = q.limit(totalLimit)
  }
  const snap = await q.get()
  let results = snapsToArr<T>(snap)
  if (options?.offset && options.offset > 0) {
    results = results.slice(options.offset)
  }
  return results
}

export async function count(col: string, whereConstraints?: Record<string, [string, unknown]>): Promise<number> {
  const db = getDb()
  let q = db.collection(col) as ReturnType<typeof db.collection>
  if (whereConstraints) {
    for (const [field, [op, value]] of Object.entries(whereConstraints)) {
      q = q.where(field, op as any, value)
    }
  }
  const snap = await q.count().get()
  return snap.data().count
}

export async function create<T = Record<string, unknown>>(col: string, data: T): Promise<string> {
  const db = getDb()
  const now = new Date().toISOString()
  const ref = await db.collection(col).add({ ...data, createdAt: now, updatedAt: now })
  return ref.id
}

export async function update(col: string, id: string, data: Record<string, unknown>): Promise<void> {
  const db = getDb()
  await db.collection(col).doc(id).update({ ...data, updatedAt: new Date().toISOString() })
}

export async function remove(col: string, id: string): Promise<void> {
  const db = getDb()
  await db.collection(col).doc(id).delete()
}

export async function removeWhere(col: string, field: string, value: unknown): Promise<number> {
  const db = getDb()
  const snap = await db.collection(col).where(field, '==', value).get()
  if (snap.empty) return 0
  const batch = db.batch()
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
  return snap.size
}

export async function updateWhere(col: string, field: string, value: unknown, data: Record<string, unknown>): Promise<number> {
  const db = getDb()
  const snap = await db.collection(col).where(field, '==', value).get()
  if (snap.empty) return 0
  const batch = db.batch()
  const now = new Date().toISOString()
  snap.docs.forEach(d => batch.update(d.ref, { ...data, updatedAt: now }))
  await batch.commit()
  return snap.size
}