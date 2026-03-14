import {
  collection,
  doc,
  getDoc,
  getDocs,
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

import { db } from './firebase'
import { normalize } from './lib/normalize'

export type User = {
  id: string
  nickname: string
  nicknameNorm: string
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

  const userRef = doc(db, 'users', nicknameNorm)
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

  return { id: nicknameNorm, nickname, nicknameNorm }
}

export async function listLessons(): Promise<Lesson[]> {
  const ref = collection(db, 'lessons')
  const qs = await getDocs(query(ref, orderBy('order', 'asc')))
  return qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
}

export async function listQuestions(lessonId: string): Promise<Question[]> {
  const ref = collection(db, 'lessons', lessonId, 'questions')
  const qs = await getDocs(query(ref, orderBy('order', 'asc')))
  return qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
}

export async function loadAttemptsForLesson(userId: string, lessonId: string): Promise<Record<string, boolean>> {
  const ref = collection(db, 'users', userId, 'attempts')
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
  const attemptRef = doc(db, 'users', userId, 'attempts', attemptId)
  const progressRef = doc(db, 'users', userId, 'progress', lessonId)

  const batch = writeBatch(db)
  batch.set(
    attemptRef,
    {
      lessonId,
      questionId,
      answerRaw,
      answerNorm: normalize(answerRaw),
      wasCorrect,
      createdAt: serverTimestamp(),
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
  await batch.commit()
}
