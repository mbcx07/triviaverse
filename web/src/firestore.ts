import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'

import { assertFirebaseEnabled, db } from './firebase'
import { normalize } from './lib/normalize'

function ensureDb() {
  assertFirebaseEnabled()
  // db is guaranteed by assertFirebaseEnabled
  return db!
}

export type User = {
  id: string
  nickname: string
  nicknameNorm: string
  xpTotal?: number
}

export type Lesson = {
  id: string
  title: string
  order?: number
  grade?: string
}

export type Question = {
  id: string
  prompt: string
  answersAccepted: string[]
  explanation?: string
  order?: number
}

export type Attempt = {
  lessonId: string
  questionId: string
  answerRaw: string
  answerNorm: string
  wasCorrect: boolean
}

export async function loginWithNicknamePin(nicknameRaw: string, pinRaw: string): Promise<User> {
  const nickname = nicknameRaw.trim()
  const pin = pinRaw.trim()
  const nicknameNorm = normalize(nickname)

  if (nickname.length < 2) throw new Error('Usa un nickname de 2+ caracteres.')
  if (!/^\d{4}$/.test(pin)) throw new Error('El PIN debe ser exactamente 4 dígitos.')

  const dbi = ensureDb()

  const userRef = doc(dbi, 'users', nicknameNorm)
  const snap = await getDoc(userRef)

  if (!snap.exists()) {
    await setDoc(userRef, {
      nickname,
      nicknameNorm,
      pin, // Prototype only (plain PIN allowed by requirement). Do NOT ship to production like this.
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    })
  } else {
    const data = snap.data() as DocumentData
    if (String(data.pin ?? '') !== pin) throw new Error('PIN incorrecto para ese nickname.')
    await updateDoc(userRef, { lastLoginAt: serverTimestamp(), nickname })
  }

  const xpTotal = Number((snap.data() as any)?.xpTotal ?? 0)
  return { id: nicknameNorm, nickname, nicknameNorm, xpTotal }
}

export async function getLeaderboard(limitN: number = 20): Promise<Array<{ id: string; nickname: string; xpTotal: number }>> {
  const dbi = ensureDb()
  const ref = collection(dbi, 'users')
  const qs = await getDocs(query(ref, orderBy('xpTotal', 'desc'), limit(limitN)))
  return qs.docs.map((d) => {
    const data = d.data() as any
    return { id: d.id, nickname: String(data.nickname || d.id), xpTotal: Number(data.xpTotal || 0) }
  })
}

export async function changePin(params: { userId: string; oldPin: string; newPin: string }) {
  const { userId, oldPin, newPin } = params
  if (!/^\d{4}$/.test(newPin)) throw new Error('El PIN nuevo debe ser exactamente 4 dígitos.')

  const dbi = ensureDb()
  const userRef = doc(dbi, 'users', userId)
  const snap = await getDoc(userRef)
  if (!snap.exists()) throw new Error('Usuario no existe.')

  const data = snap.data() as any
  if (String(data.pin ?? '') !== String(oldPin)) throw new Error('PIN actual incorrecto.')

  await updateDoc(userRef, { pin: String(newPin), pinUpdatedAt: serverTimestamp() })
}

export async function listLessons(): Promise<Lesson[]> {
  const dbi = ensureDb()
  const ref = collection(dbi, 'lessons')
  const qs = await getDocs(query(ref, orderBy('order', 'asc')))
  return qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
}

export async function listQuestions(lessonId: string): Promise<Question[]> {
  const dbi = ensureDb()
  const ref = collection(dbi, 'lessons', lessonId, 'questions')
  const qs = await getDocs(query(ref, orderBy('order', 'asc')))
  return qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
}

export async function loadAttemptsForLesson(userId: string, lessonId: string): Promise<Record<string, boolean>> {
  const dbi = ensureDb()
  const ref = collection(dbi, 'users', userId, 'attempts')
  const qs = await getDocs(query(ref, where('lessonId', '==', lessonId), limit(500)))
  const out: Record<string, boolean> = {}
  for (const d of qs.docs) {
    const data = d.data() as any
    if (data.questionId) out[String(data.questionId)] = Boolean(data.wasCorrect)
  }
  return out
}

export async function recordAttempt(params: {
  userId: string
  lessonId: string
  questionId: string
  answerRaw: string
  wasCorrect: boolean
  answeredCount: number
  correctCount: number
}) {
  const { userId, lessonId, questionId, answerRaw, wasCorrect, answeredCount, correctCount } = params
  const attemptId = `${lessonId}__${questionId}`

  const dbi = ensureDb()

  const attemptRef = doc(dbi, 'users', userId, 'attempts', attemptId)
  const progressRef = doc(dbi, 'users', userId, 'progress', lessonId)
  const userRef = doc(dbi, 'users', userId)

  // XP model (initial): correct first try = 10, incorrect = 0.
  // (We can later add partial credit, streak bonuses, hearts, etc.)
  const xpDelta = wasCorrect ? 10 : 0

  const batch = writeBatch(dbi)
  batch.set(
    attemptRef,
    {
      lessonId,
      questionId,
      answerRaw,
      answerNorm: normalize(answerRaw),
      wasCorrect,
      createdAt: serverTimestamp(),
      xpDelta,
    },
    { merge: false }
  )
  batch.set(
    progressRef,
    {
      lessonId,
      answeredCount,
      correctCount,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
  batch.set(
    userRef,
    {
      xpTotal: increment(xpDelta),
      lastActiveAt: serverTimestamp(),
      nicknameLastSeenAt: serverTimestamp(),
    },
    { merge: true }
  )
  await batch.commit()
}
