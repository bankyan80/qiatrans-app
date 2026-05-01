import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let _db: ReturnType<typeof getFirestore> | null = null

function initApp() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'qia-trans-manajemen'
    
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    
    if (privateKey && clientEmail) {
      initializeApp({
        credential: cert({
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'),
          clientEmail,
        }),
      })
    } else {
      initializeApp({ projectId })
    }
  }
}

export function getDb(): ReturnType<typeof getFirestore> {
  initApp()
  if (!_db) _db = getFirestore()
  return _db
}