import { initializeApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

function optionalEnv(name: string): string | undefined {
  const v = (import.meta as any).env?.[name] as string | undefined
  return v && String(v).trim() ? v : undefined
}

// For GitHub Pages (public frontend), Firebase config must be provided at build time.
// Copy .env.example -> .env.local for local dev, and configure VITE_ env vars in CI for deploys.
const firebaseConfig = {
  apiKey: optionalEnv('VITE_FIREBASE_API_KEY'),
  authDomain: optionalEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: optionalEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: optionalEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: optionalEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: optionalEnv('VITE_FIREBASE_APP_ID'),
  measurementId: optionalEnv('VITE_FIREBASE_MEASUREMENT_ID'),
}

const hasFirebase = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
)

export const firebaseEnabled = hasFirebase

export const firebaseApp = hasFirebase ? initializeApp(firebaseConfig as any) : null
export const db: Firestore | null = hasFirebase && firebaseApp ? getFirestore(firebaseApp) : null

export function assertFirebaseEnabled(): void {
  if (!firebaseEnabled || !db) {
    throw new Error(
      'Firebase no está configurado. Falta definir VITE_FIREBASE_* en el build (GitHub Actions) o en .env.local.'
    )
  }
}
