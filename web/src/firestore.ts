/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  writeBatch,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  runTransaction,
  onSnapshot,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore'

import { assertFirebaseEnabled, db } from './firebase'
import { normalize } from './lib/normalize'
import { isoWeekKey, utcDateKey } from './lib/weekKey'

function ensureDb() {
  assertFirebaseEnabled()
  return db!
}

// --- Config (prototype) ---
const TEAM_BELAS_ID = 'belas'
const FREE_TEAM_NICKNAMES = new Set(['amelia', 'isabela', 'milan', 'lili'])

export type User = {
  id: string
  nickname: string
  nicknameNorm: string
  xpTotal?: number
  streakCount?: number
  lastPlayDate?: string
  teamId?: string
}

export type Lesson = {
  id: string
  title: string
  order?: number
  grade?: string
  // New fields (seed supports some of these)
  subject?: string
  unit?: string
}

export type QuestionBase = {
  id: string
  order?: number
  prompt: string
  explanation?: string
  type?: string
}

export type QuestionWrite = QuestionBase & {
  type?: 'write' | 'fill_blank'
  answersAccepted?: string[]
  answer?: string
}

export type QuestionMC = QuestionBase & {
  type: 'multiple_choice'
  options: string[]
  correctIndex: number
}

export type QuestionTF = QuestionBase & {
  type: 'true_false'
  answer: boolean
}

export type QuestionOrder = QuestionBase & {
  type: 'order_words'
  tokens: string[]
}

export type QuestionMatch = QuestionBase & {
  type: 'match_pairs'
  pairs: Array<{ left: string; right: string }>
}

export type Question = QuestionWrite | QuestionMC | QuestionTF | QuestionOrder | QuestionMatch

export async function loginWithNicknamePin(nicknameRaw: string, pinRaw: string): Promise<User> {
  const nickname = nicknameRaw.trim()
  const pin = pinRaw.trim()
  const nicknameNorm = normalize(nickname)

  if (nickname.length < 2) throw new Error('Usa un nickname de 2+ caracteres.')
  if (!/^\d{4}$/.test(pin)) throw new Error('El PIN debe ser exactamente 4 dígitos.')

  const dbi = ensureDb()
  const userRef = doc(dbi, 'users', nicknameNorm)
  const snap = await getDoc(userRef)

  const defaultTeamId = FREE_TEAM_NICKNAMES.has(nicknameNorm) ? TEAM_BELAS_ID : undefined

  if (!snap.exists()) {
    await setDoc(userRef, {
      nickname,
      nicknameNorm,
      pin, // Prototype only (plain PIN allowed by requirement). Do NOT ship to production like this.
      teamId: defaultTeamId || null,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      xpTotal: 0,
      streakCount: 0,
      lastPlayDate: null,
    })
  } else {
    const data = snap.data() as DocumentData
    if (String(data.pin ?? '') !== pin) throw new Error('PIN incorrecto para ese nickname.')
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      nickname,
      // only set a team automatically if none exists
      ...(data.teamId ? {} : { teamId: defaultTeamId || null }),
    })
  }

  const snap2 = await getDoc(userRef)
  const data2 = (snap2.data() as any) || {}

  return {
    id: nicknameNorm,
    nickname,
    nicknameNorm,
    xpTotal: Number(data2.xpTotal || 0),
    streakCount: Number(data2.streakCount || 0),
    lastPlayDate: data2.lastPlayDate ? String(data2.lastPlayDate) : undefined,
    teamId: data2.teamId ? String(data2.teamId) : undefined,
  }
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
  return qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any
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

export async function loadProgressMap(
  userId: string
): Promise<Record<string, { answeredCount: number; correctCount: number; starsBest?: number; starsLast?: number }>> {
  const dbi = ensureDb()
  const ref = collection(dbi, 'users', userId, 'progress')
  const qs = await getDocs(query(ref, limit(500)))
  const out: Record<string, { answeredCount: number; correctCount: number; starsBest?: number; starsLast?: number }> = {}
  for (const d of qs.docs) {
    const data = d.data() as any
    out[d.id] = {
      answeredCount: Number(data.answeredCount || 0),
      correctCount: Number(data.correctCount || 0),
      starsBest: data.starsBest == null ? undefined : Number(data.starsBest || 0),
      starsLast: data.starsLast == null ? undefined : Number(data.starsLast || 0),
    }
  }
  return out
}

export async function getWeeklyLeaderboard(params: {
  weekKey?: string
  scope: 'global' | 'team'
  teamId?: string
  limitN?: number
}): Promise<Array<{ id: string; nickname: string; xpWeek: number }>> {
  const dbi = ensureDb()
  const wk = params.weekKey || isoWeekKey(new Date())
  const limitN = params.limitN ?? 25

  const ref =
    params.scope === 'global'
      ? collection(dbi, 'leaderboards_global', wk, 'entries')
      : collection(dbi, 'teams', String(params.teamId || TEAM_BELAS_ID), 'weeks', wk, 'entries')
  const qs = await getDocs(query(ref, orderBy('xpWeek', 'desc'), limit(limitN)))
  return qs.docs.map((d) => {
    const data = d.data() as any
    return {
      id: d.id,
      nickname: String(data.nickname || d.id),
      xpWeek: Number(data.xpWeek || 0),
    }
  })
}

function calcStars(answeredCount: number, correctCount: number): number {
  if (answeredCount < 6) return 0
  if (correctCount >= answeredCount) return 3
  const ratio = answeredCount ? correctCount / answeredCount : 0
  if (ratio >= 0.8) return 2
  if (ratio >= 0.5) return 1
  return 0
}

export async function recordAttempt(params: {
  userId: string
  lessonId: string
  questionId: string
  answerRaw: string
  wasCorrect: boolean
  answeredCount: number
  correctCount: number
}): Promise<{ xpDelta: number; weekKey: string; streakCount: number; xpTotal: number; starsLast?: number; starsBest?: number }>
{
  const { userId, lessonId, questionId, answerRaw, wasCorrect, answeredCount, correctCount } = params
  const attemptId = `${lessonId}__${questionId}`

  const dbi = ensureDb()

  // XP model (v1): correct = 10, incorrect = 0.
  const xpDelta = wasCorrect ? 10 : 0

  const wk = isoWeekKey(new Date())
  const today = utcDateKey(new Date())

  const attemptRef = doc(dbi, 'users', userId, 'attempts', attemptId)
  const progressRef = doc(dbi, 'users', userId, 'progress', lessonId)
  const userRef = doc(dbi, 'users', userId)

  return await runTransaction(dbi, async (tx) => {
    const userSnap = await tx.get(userRef)
    if (!userSnap.exists()) throw new Error('Usuario no existe.')

    const u = userSnap.data() as any
    const prevTotal = Number(u.xpTotal || 0)
    const prevStreak = Number(u.streakCount || 0)
    const prevDate = u.lastPlayDate ? String(u.lastPlayDate) : ''

    // streak: if played today -> keep; if yesterday -> +1; else -> 1
    let nextStreak = prevStreak
    if (prevDate === today) {
      nextStreak = prevStreak || 1
    } else {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() - 1)
      const yesterday = utcDateKey(d)
      if (prevDate === yesterday) nextStreak = (prevStreak || 0) + 1
      else nextStreak = 1
    }

    const teamId = u.teamId ? String(u.teamId) : TEAM_BELAS_ID
    const nickname = String(u.nickname || userId)

    // progress per lesson (READS must happen before WRITES inside a transaction)
    const starsNow = calcStars(answeredCount, correctCount)
    const progressSnap = await tx.get(progressRef)
    const prevBest = progressSnap.exists() ? Number((progressSnap.data() as any).starsBest || 0) : 0
    const nextBest = answeredCount >= 6 ? Math.max(prevBest, starsNow) : prevBest

    // attempt write (immutable)
    tx.set(
      attemptRef,
      {
        lessonId,
        questionId,
        answerRaw,
        answerNorm: normalize(answerRaw),
        wasCorrect,
        createdAt: serverTimestamp(),
        xpDelta,
        weekKey: wk,
      },
      { merge: false }
    )

    tx.set(
      progressRef,
      {
        lessonId,
        answeredCount,
        correctCount,
        updatedAt: serverTimestamp(),
        ...(answeredCount >= 6
          ? {
              completedAt: serverTimestamp(),
              starsLast: starsNow,
              starsBest: nextBest,
            }
          : {}),
      },
      { merge: true }
    )

    // user aggregates
    tx.set(
      userRef,
      {
        xpTotal: prevTotal + xpDelta,
        streakCount: nextStreak,
        lastPlayDate: today,
        lastActiveAt: serverTimestamp(),
      },
      { merge: true }
    )

    // weekly leaderboards (global + team)
    const globalEntryRef = doc(dbi, 'leaderboards_global', wk, 'entries', userId)
    const teamEntryRef = doc(dbi, 'teams', teamId, 'weeks', wk, 'entries', userId)

    tx.set(
      globalEntryRef,
      {
        nickname,
        xpWeek: increment(xpDelta),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    tx.set(
      teamEntryRef,
      {
        nickname,
        xpWeek: increment(xpDelta),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    return {
      xpDelta,
      weekKey: wk,
      streakCount: nextStreak,
      xpTotal: prevTotal + xpDelta,
      starsLast: answeredCount >= 6 ? starsNow : undefined,
      starsBest: answeredCount >= 6 ? nextBest : undefined,
    }
  })
}

export async function resetLessonProgress(params: { userId: string; lessonId: string }) {
  const { userId, lessonId } = params
  const dbi = ensureDb()

  // Delete attempts for this lesson
  const ref = collection(dbi, 'users', userId, 'attempts')
  const qs = await getDocs(query(ref, where('lessonId', '==', lessonId), limit(500)))

  const batch = writeBatch(dbi)
  for (const d of qs.docs) {
    batch.delete(d.ref)
  }

  // Delete progress doc for lesson
  const progRef = doc(dbi, 'users', userId, 'progress', lessonId)
  batch.delete(progRef)

  await batch.commit()
}

// Legacy (total XP) leaderboard kept for debugging/back-compat
export async function getLeaderboard(limitN: number = 20): Promise<Array<{ id: string; nickname: string; xpTotal: number }>> {
  const dbi = ensureDb()
  const ref = collection(dbi, 'users')
  const qs = await getDocs(query(ref, orderBy('xpTotal', 'desc'), limit(limitN)))
  return qs.docs.map((d) => {
    const data = d.data() as any
    return { id: d.id, nickname: String(data.nickname || d.id), xpTotal: Number(data.xpTotal || 0) }
  })
}

// One-time helper to create the team doc (safe no-op if exists)
export async function ensureTeam(teamId: string = TEAM_BELAS_ID) {
  const dbi = ensureDb()
  const ref = doc(dbi, 'teams', teamId)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, { title: 'Team Belas', createdAt: serverTimestamp() })
  }
}

export async function updateTeamTitle(params: { teamId: string; title: string }) {
  const dbi = ensureDb()
  const title = params.title.trim().slice(0, 40)
  if (!title) throw new Error('Nombre de equipo inválido.')
  const ref = doc(dbi, 'teams', params.teamId)
  await setDoc(ref, { title, updatedAt: serverTimestamp() }, { merge: true })
}

export type BattleRoom = {
  id: string
  createdAt?: any
  status?: 'open' | 'started' | 'finished'
  hostUserId?: string
  hostTeamId?: string
  guestUserId?: string
  guestTeamId?: string
  subject?: string
  missionId?: string
}

export async function createBattleRoom(params: { userId: string; teamId: string; subject?: string }) {
  const dbi = ensureDb()
  const ref = doc(collection(dbi, 'battleRooms'))
  const data: BattleRoom = {
    id: ref.id,
    status: 'open',
    hostUserId: params.userId,
    hostTeamId: params.teamId,
    subject: params.subject || 'esp',
  }
  await setDoc(ref, { ...data, createdAt: serverTimestamp() }, { merge: true })
  return data
}

export async function joinBattleRoom(params: { roomId: string; userId: string; teamId: string }) {
  const dbi = ensureDb()
  const ref = doc(dbi, 'battleRooms', params.roomId)
  await runTransaction(dbi, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Sala no existe.')
    const r = snap.data() as any
    if (String(r.status || 'open') !== 'open') throw new Error('Sala no está abierta.')
    if (r.guestUserId) throw new Error('Sala llena.')
    tx.set(
      ref,
      {
        guestUserId: params.userId,
        guestTeamId: params.teamId,
        status: 'started',
        startedAt: serverTimestamp(),
      },
      { merge: true }
    )
  })
}

export function subscribeBattleRoom(roomId: string, cb: (r: BattleRoom | null) => void): Unsubscribe {
  const dbi = ensureDb()
  const ref = doc(dbi, 'battleRooms', roomId)
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return cb(null)
    const d = snap.data() as any
    cb({ id: snap.id, ...(d as any) })
  })
}

export function subscribeBattleMessages(
  roomId: string,
  cb: (msgs: Array<{ id: string; userId: string; text: string; createdAt?: any }>) => void
): Unsubscribe {
  const dbi = ensureDb()
  const ref = collection(dbi, 'battleRooms', roomId, 'messages')
  const q = query(ref, orderBy('createdAt', 'asc'), limit(100))
  return onSnapshot(q, (qs) => {
    const out = qs.docs.map((d) => {
      const data = d.data() as any
      return { id: d.id, userId: String(data.userId || ''), text: String(data.text || ''), createdAt: data.createdAt }
    })
    cb(out)
  })
}

export async function sendBattleMessage(params: { roomId: string; userId: string; text: string }) {
  const dbi = ensureDb()
  const text = params.text.trim().slice(0, 200)
  if (!text) return
  const ref = doc(collection(dbi, 'battleRooms', params.roomId, 'messages'))
  await setDoc(ref, { userId: params.userId, text, createdAt: serverTimestamp() }, { merge: true })
}

export async function submitBattleScore(params: { roomId: string; userId: string; correct: number; answered: number }) {
  const dbi = ensureDb()
  const ref = doc(dbi, 'battleRooms', params.roomId)
  const field = `scores.${params.userId}`
  await setDoc(ref, { [field]: { correct: params.correct, answered: params.answered, updatedAt: serverTimestamp() } }, { merge: true })
}

// --- Live subscriptions ---
export function subscribeUser(userId: string, cb: (u: User) => void): Unsubscribe {
  const dbi = ensureDb()
  const ref = doc(dbi, 'users', userId)
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return
    const data = snap.data() as any
    cb({
      id: snap.id,
      nickname: String(data.nickname || snap.id),
      nicknameNorm: String(data.nicknameNorm || snap.id),
      xpTotal: Number(data.xpTotal || 0),
      streakCount: Number(data.streakCount || 0),
      lastPlayDate: data.lastPlayDate ? String(data.lastPlayDate) : undefined,
      teamId: data.teamId ? String(data.teamId) : undefined,
    })
  })
}

export function subscribeProgressMap(
  userId: string,
  cb: (m: Record<string, { answeredCount: number; correctCount: number; starsBest?: number; starsLast?: number }>) => void
): Unsubscribe {
  const dbi = ensureDb()
  const ref = collection(dbi, 'users', userId, 'progress')
  return onSnapshot(ref, (qs) => {
    const out: Record<string, { answeredCount: number; correctCount: number; starsBest?: number; starsLast?: number }> = {}
    for (const d of qs.docs) {
      const data = d.data() as any
      out[d.id] = {
        answeredCount: Number(data.answeredCount || 0),
        correctCount: Number(data.correctCount || 0),
        starsBest: data.starsBest == null ? undefined : Number(data.starsBest || 0),
        starsLast: data.starsLast == null ? undefined : Number(data.starsLast || 0),
      }
    }
    cb(out)
  })
}

export function subscribeWeeklyLeaderboard(params: {
  weekKey?: string
  scope: 'global' | 'team'
  teamId?: string
  limitN?: number
  cb: (list: Array<{ id: string; nickname: string; xpWeek: number }>) => void
}): Unsubscribe {
  const dbi = ensureDb()
  const wk = params.weekKey || isoWeekKey(new Date())
  const limitN = params.limitN ?? 25

  const ref =
    params.scope === 'global'
      ? collection(dbi, 'leaderboards_global', wk, 'entries')
      : collection(dbi, 'teams', String(params.teamId || TEAM_BELAS_ID), 'weeks', wk, 'entries')

  const q = query(ref, orderBy('xpWeek', 'desc'), limit(limitN))

  return onSnapshot(q, (qs) => {
    const list = qs.docs.map((d) => {
      const data = d.data() as any
      return {
        id: d.id,
        nickname: String(data.nickname || d.id),
        xpWeek: Number(data.xpWeek || 0),
      }
    })
    params.cb(list)
  })
}
