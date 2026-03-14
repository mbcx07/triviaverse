import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

function requiredEnv(name: string): string {
  const v = (import.meta as any).env?.[name] as string | undefined
  if (!v) throw new Error(`Missing env ${name}. Copy .env.example -> .env.local and fill Firebase config.`)
  return v
}

const firebaseConfig = {
  apiKey: requiredEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: requiredEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: requiredEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requiredEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requiredEnv('VITE_FIREBASE_APP_ID'),
  measurementId: ((import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID as string | undefined) ?? undefined,
}

export const firebaseApp = initializeApp(firebaseConfig)
export const db = getFirestore(firebaseApp)
