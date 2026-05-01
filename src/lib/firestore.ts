import { db } from './firebase'
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, writeBatch, Query, DocumentData, Timestamp,
} from 'firebase/firestore'

export function toISO(val: unknown): string | null {
  if (!val) return null
  if (val instanceof Timestamp) return val.toDate().toISOString()
  if (typeof val === 'string') return val
  if (val instanceof Date) return val.toISOString()
  return null
}

function docToObj<T = Record<string, unknown>>(snap: ReturnType<typeof getDoc> extends Promise<infer U> ? U : never): (T & { id: string }) | null {
  if (!snap.exists()) return null
  const data = snap.data() as Record<string, unknown>
  const result: Record<string, unknown> = { id: snap.id }
  for (const [key, val] of Object.entries(data)) {
    result[key] = toISO(val) !== null && !(val instanceof Timestamp) ? toISO(val) ?? val : val instanceof Timestamp ? toISO(val) : val
  }
  return result as T & { id: string }
}

function docsToArr<T = Record<string, unknown>>(snaps: ReturnType<typeof getDocs> extends Promise<infer U> ? U : never): (T & { id: string })[] {
  return snaps.docs.map(d => {
    const data = d.data() as Record<string, unknown>
    const result: Record<string, unknown> = { id: d.id }
    for (const [key, val] of Object.entries(data)) {
      result[key] = val instanceof Timestamp ? toISO(val) : val
    }
    return result as T & { id: string }
  })
}

export async function getById<T = Record<string, unknown>>(col: string, id: string): Promise<(T & { id: string }) | null> {
  const snap = await getDoc(doc(db, col, id))
  return docToObj<T>(snap)
}

export async function getByField<T = Record<string, unknown>>(col: string, field: string, value: unknown): Promise<(T & { id: string }) | null> {
  const q = query(collection(db, col), where(field, '==', value), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  const data = d.data() as Record<string, unknown>
  const result: Record<string, unknown> = { id: d.id }
  for (const [key, val] of Object.entries(data)) {
    result[key] = val instanceof Timestamp ? toISO(val) : val
  }
  return result as T & { id: string }
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
  let q: Query = collection(db, col)

  if (options?.where) {
    for (const [field, [op, value]] of Object.entries(options.where)) {
      q = query(q, where(field, op as any, value))
    }
  }

  if (options?.orderBy) {
    q = query(q, orderBy(options.orderBy, options.orderDir || 'desc'))
  }

  if (options?.limit) {
    const totalLimit = options.offset ? options.limit + options.offset : options.limit
    q = query(q, limit(totalLimit))
  }

  const snap = await getDocs(q)
  let results = docsToArr<T>(snap)

  if (options?.offset && options.offset > 0) {
    results = results.slice(options.offset)
  }

  return results
}

export async function count(col: string, whereConstraints?: Record<string, [string, unknown]>): Promise<number> {
  let q: Query = collection(db, col)
  if (whereConstraints) {
    for (const [field, [op, value]] of Object.entries(whereConstraints)) {
      q = query(q, where(field, op as any, value))
    }
  }
  const snap = await getDocs(q)
  return snap.size
}

export async function create<T = Record<string, unknown>>(col: string, data: T): Promise<string> {
  const now = new Date().toISOString()
  const ref = await addDoc(collection(db, col), { ...data, createdAt: now, updatedAt: now })
  return ref.id
}

export async function update(col: string, id: string, data: Record<string, unknown>): Promise<void> {
  await updateDoc(doc(db, col, id), { ...data, updatedAt: new Date().toISOString() })
}

export async function remove(col: string, id: string): Promise<void> {
  await deleteDoc(doc(db, col, id))
}

export async function removeWhere(col: string, field: string, value: unknown): Promise<number> {
  const q = query(collection(db, col), where(field, '==', value))
  const snap = await getDocs(q)
  if (snap.empty) return 0
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
  return snap.size
}

export async function updateWhere(col: string, field: string, value: unknown, data: Record<string, unknown>): Promise<number> {
  const q = query(collection(db, col), where(field, '==', value))
  const snap = await getDocs(q)
  if (snap.empty) return 0
  const batch = writeBatch(db)
  const now = new Date().toISOString()
  snap.docs.forEach(d => batch.update(d.ref, { ...data, updatedAt: now }))
  await batch.commit()
  return snap.size
}