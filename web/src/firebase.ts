/* eslint-disable @typescript-eslint/no-explicit-any */
import { initializeApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'
import { getMessaging, getToken, onMessage, type Messaging, type MessagePayload } from 'firebase/messaging'

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
export const auth: Auth | null = hasFirebase && firebaseApp ? getAuth(firebaseApp) : null
export const messaging: Messaging | null = hasFirebase && firebaseApp ? getMessaging(firebaseApp) : null

export function assertFirebaseEnabled(): void {
  if (!firebaseEnabled || !db) {
    throw new Error(
      'Firebase no está configurado. Falta definir VITE_FIREBASE_* en el build (GitHub Actions) o en .env.local.'
    )
  }
}

// FCM Token management
export async function requestFCMToken(): Promise<string | null> {
  if (!messaging) {
    console.warn('FCM no está disponible (messaging no inicializado)')
    return null
  }
  
  try {
    // Request permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('Permiso de notificaciones denegado')
      return null
    }
    
    // Get FCM token
    const vapidKey = optionalEnv('VITE_FIREBASE_VAPID_KEY')
    const token = await getToken(messaging, vapidKey ? { vapidKey } : undefined)
    return token
  } catch (error) {
    console.error('Error obteniendo token FCM:', error)
    return null
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: MessagePayload) => void): (() => void) | null {
  if (!messaging) return null
  
  return onMessage(messaging, callback)
}
