/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore'
import { type User as FirebaseUser } from 'firebase/auth'
import { assertFirebaseEnabled, db } from '../firebase'

export type UserProfile = {
  id: string
  firebaseUid: string
  nickname: string
  nicknameNorm: string
  email?: string
  xpTotal: number
  streakCount: number
  lastPlayDate?: string
  teamId?: string
  avatar?: string
  displayName?: string
  lastActiveAt?: any
  createdAt?: any
}

/**
 * Migrates a PIN-based user to Firebase Auth
 * Links the existing user document to the Firebase UID
 */
export async function migratePinUserToFirebase(
  firebaseUser: FirebaseUser,
  nickname: string,
  pin: string
): Promise<UserProfile> {
  assertFirebaseEnabled()
  const dbi = db!

  const nicknameNorm = normalize(nickname)

  // Verify PIN matches existing user
  const legacyUserRef = doc(dbi, 'users', nicknameNorm)
  const legacySnap = await getDoc(legacyUserRef)

  if (!legacySnap.exists()) {
    throw new Error('Usuario no encontrado con ese nickname.')
  }

  const legacyData = legacySnap.data() as DocumentData
  if (String(legacyData.pin ?? '') !== pin) {
    throw new Error('PIN incorrecto.')
  }

  // Check if already migrated
  if (legacyData.firebaseUid) {
    if (legacyData.firebaseUid !== firebaseUser.uid) {
      throw new Error('Este usuario ya está vinculado a otra cuenta.')
    }
    // Already migrated, return profile
    return {
      id: nicknameNorm,
      firebaseUid: legacyData.firebaseUid,
      nickname: legacyData.nickname || nickname,
      nicknameNorm,
      email: firebaseUser.email || undefined,
      xpTotal: Number(legacyData.xpTotal || 0),
      streakCount: Number(legacyData.streakCount || 0),
      lastPlayDate: legacyData.lastPlayDate,
      teamId: legacyData.teamId,
      avatar: legacyData.avatar,
      displayName: legacyData.displayName,
      lastActiveAt: legacyData.lastActiveAt,
    }
  }

  // Migrate: link Firebase UID to existing user
  await updateDoc(legacyUserRef, {
    firebaseUid: firebaseUser.uid,
    email: firebaseUser.email || null,
    migratedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  })

  // Create user-by-firebase-uid reference for quick lookup
  const uidRef = doc(dbi, 'usersByUid', firebaseUser.uid)
  await setDoc(uidRef, {
    nicknameNorm,
    linkedAt: serverTimestamp(),
  })

  return {
    id: nicknameNorm,
    firebaseUid: firebaseUser.uid,
    nickname: legacyData.nickname || nickname,
    nicknameNorm,
    email: firebaseUser.email || undefined,
    xpTotal: Number(legacyData.xpTotal || 0),
    streakCount: Number(legacyData.streakCount || 0),
    lastPlayDate: legacyData.lastPlayDate,
    teamId: legacyData.teamId,
    avatar: legacyData.avatar,
    displayName: legacyData.displayName,
  }
}

/**
 * Creates a new user profile from Firebase Auth
 */
export async function createProfileFromFirebase(
  firebaseUser: FirebaseUser,
  nickname: string
): Promise<UserProfile> {
  assertFirebaseEnabled()
  const dbi = db!

  const nicknameNorm = normalize(nickname)

  // Check if nickname is taken
  const existingRef = doc(dbi, 'users', nicknameNorm)
  const existingSnap = await getDoc(existingRef)

  if (existingSnap.exists()) {
    const existingData = existingSnap.data() as DocumentData
    // If this is a PIN user, they need to migrate instead
    if (existingData.pin && !existingData.firebaseUid) {
      throw new Error('Ese nickname ya existe. Usa la opción de migrar cuenta existente.')
    }
    if (existingData.firebaseUid !== firebaseUser.uid) {
      throw new Error('Ese nickname ya está en uso.')
    }
    // Already exists with this UID, return profile
    return {
      id: nicknameNorm,
      firebaseUid: firebaseUser.uid,
      nickname: existingData.nickname || nickname,
      nicknameNorm,
      email: firebaseUser.email || undefined,
      xpTotal: Number(existingData.xpTotal || 0),
      streakCount: Number(existingData.streakCount || 0),
      lastPlayDate: existingData.lastPlayDate,
      teamId: existingData.teamId,
      avatar: existingData.avatar,
      displayName: existingData.displayName,
    }
  }

  // Create new user
  await setDoc(existingRef, {
    nickname,
    nicknameNorm,
    firebaseUid: firebaseUser.uid,
    email: firebaseUser.email || null,
    teamId: null,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
    xpTotal: 0,
    streakCount: 0,
    lastPlayDate: null,
  })

  // Create UID lookup
  const uidRef = doc(dbi, 'usersByUid', firebaseUser.uid)
  await setDoc(uidRef, {
    nicknameNorm,
    linkedAt: serverTimestamp(),
  })

  return {
    id: nicknameNorm,
    firebaseUid: firebaseUser.uid,
    nickname,
    nicknameNorm,
    email: firebaseUser.email || undefined,
    xpTotal: 0,
    streakCount: 0,
  }
}

/**
 * Gets user profile from Firebase UID
 */
export async function getProfileByUid(firebaseUid: string): Promise<UserProfile | null> {
  assertFirebaseEnabled()
  const dbi = db!

  // First lookup nickname by UID
  const uidRef = doc(dbi, 'usersByUid', firebaseUid)
  const uidSnap = await getDoc(uidRef)

  if (!uidSnap.exists()) return null

  const { nicknameNorm } = uidSnap.data() as DocumentData

  // Then get full profile
  const userRef = doc(dbi, 'users', nicknameNorm)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) return null

  const data = userSnap.data() as DocumentData

  return {
    id: nicknameNorm,
    firebaseUid: firebaseUid,
    nickname: data.nickname || nicknameNorm,
    nicknameNorm,
    email: data.email,
    xpTotal: Number(data.xpTotal || 0),
    streakCount: Number(data.streakCount || 0),
    lastPlayDate: data.lastPlayDate,
    teamId: data.teamId,
    avatar: data.avatar,
    displayName: data.displayName,
    lastActiveAt: data.lastActiveAt,
  }
}

/**
 * Updates user profile
 */
export async function updateProfile(params: {
  firebaseUid: string
  displayName?: string
  avatar?: string
}): Promise<void> {
  assertFirebaseEnabled()
  const dbi = db!

  const profile = await getProfileByUid(params.firebaseUid)
  if (!profile) throw new Error('Usuario no encontrado.')

  const userRef = doc(dbi, 'users', profile.id)
  const patch: any = { updatedAt: serverTimestamp() }

  if (params.displayName != null) {
    patch.displayName = String(params.displayName).trim().slice(0, 24)
  }
  if (params.avatar != null) {
    patch.avatar = String(params.avatar).trim().slice(0, 4)
  }

  await updateDoc(userRef, patch)
}

function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
}

/**
 * Saves FCM token to user profile
 */
export async function saveUserFCMToken(
  firebaseUid: string,
  fcmToken: string
): Promise<void> {
  assertFirebaseEnabled()
  const dbi = db!

  const profile = await getProfileByUid(firebaseUid)
  if (!profile) throw new Error('Usuario no encontrado.')

  const userRef = doc(dbi, 'users', profile.id)
  await updateDoc(userRef, {
    fcmToken,
    fcmTokenUpdatedAt: serverTimestamp(),
  })
}

/**
 * Removes FCM token from user profile (on logout)
 */
export async function removeUserFCMToken(firebaseUid: string): Promise<void> {
  assertFirebaseEnabled()
  const dbi = db!

  const profile = await getProfileByUid(firebaseUid)
  if (!profile) return

  const userRef = doc(dbi, 'users', profile.id)
  await updateDoc(userRef, {
    fcmToken: null,
    fcmTokenUpdatedAt: serverTimestamp(),
  })
}