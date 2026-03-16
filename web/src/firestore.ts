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
  avatar?: string
  displayName?: string
  lastActiveAt?: any
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

export async function loginWithNicknamePin(
  nicknameRaw: string,
  pinRaw: string,
  teamCodeRaw?: string
): Promise<User> {
  const nickname = nicknameRaw.trim()
  const pin = pinRaw.trim()
  const nicknameNorm = normalize(nickname)
  const teamCode = normalize(String(teamCodeRaw || ''))

  if (nickname.length < 2) throw new Error('Usa un nickname de 2+ caracteres.')
  if (!/^\d{4}$/.test(pin)) throw new Error('El PIN debe ser exactamente 4 dígitos.')

  const dbi = ensureDb()
  const userRef = doc(dbi, 'users', nicknameNorm)
  const snap = await getDoc(userRef)

  const defaultTeamId = FREE_TEAM_NICKNAMES.has(nicknameNorm) ? TEAM_BELAS_ID : undefined

  const teamIdFromCode = teamCode ? teamCode : undefined

  if (!snap.exists()) {
    await setDoc(userRef, {
      nickname,
      nicknameNorm,
      pin, // Prototype only (plain PIN allowed by requirement). Do NOT ship to production like this.
      teamId: teamIdFromCode || defaultTeamId || null,
      teamCode: teamCode || null,
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
      ...(teamCode ? { teamCode } : {}),
      // prefer explicit team code, otherwise only set a team automatically if none exists
      ...(teamIdFromCode ? { teamId: teamIdFromCode } : data.teamId ? {} : { teamId: defaultTeamId || null }),
    })
  }

  // Ensure team document exists when using team code
  if (teamIdFromCode) {
    await ensureTeam(teamIdFromCode)
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
    avatar: data2.avatar ? String(data2.avatar) : undefined,
    displayName: data2.displayName ? String(data2.displayName) : undefined,
    lastActiveAt: data2.lastActiveAt,
  }
}

export function subscribeOpenBattleRooms(
  cb: (rooms: Array<{ id: string; hostTeamId?: string; status?: string; subject?: string }>) => void
): Unsubscribe {
  const dbi = ensureDb()
  const ref = collection(dbi, 'battleRooms')
  // Keep query index-free for now (avoid composite index requirements)
  const q = query(ref, where('status', '==', 'open'), where('visibility', '==', 'open'), limit(25))
  return onSnapshot(q, (qs) => {
    const rooms = qs.docs.map((d) => {
      const data = d.data() as any
      return { id: d.id, hostTeamId: data.hostTeamId, status: data.status, subject: data.subject }
    })
    cb(rooms)
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

export async function pingActive(userId: string) {
  const dbi = ensureDb()
  const ref = doc(dbi, 'users', userId)
  await setDoc(ref, { lastActiveAt: serverTimestamp() }, { merge: true })
}

export async function updateProfile(params: { userId: string; displayName?: string; avatar?: string }) {
  const dbi = ensureDb()
  const ref = doc(dbi, 'users', params.userId)
  const patch: any = { updatedAt: serverTimestamp() }
  if (params.displayName != null) patch.displayName = String(params.displayName).trim().slice(0, 24)
  if (params.avatar != null) patch.avatar = String(params.avatar).trim().slice(0, 4)
  await setDoc(ref, patch, { merge: true })
}

export async function getUserPublic(userId: string): Promise<Partial<User> | null> {
  const dbi = ensureDb()
  const snap = await getDoc(doc(dbi, 'users', userId))
  if (!snap.exists()) return null
  const data = snap.data() as any
  return {
    id: snap.id,
    nickname: String(data.nickname || snap.id),
    avatar: data.avatar ? String(data.avatar) : undefined,
    displayName: data.displayName ? String(data.displayName) : undefined,
    lastActiveAt: data.lastActiveAt,
  }
}

export type BattleRoom = {
  id: string
  createdAt?: any
  status?: 'open' | 'started' | 'finished'
  // v2 team-based
  maxPerTeam?: number
  subject?: string // esp|mat|cien|hist|geo|civ|mixed
  missionId?: string
  teams?: {
    A?: { teamId: string; members: string[] }
    B?: { teamId: string; members: string[] }
  }
  // legacy fields kept for compatibility
  hostUserId?: string
  hostTeamId?: string
  guestUserId?: string
  guestTeamId?: string
  // Chat scope control
  chatPhase?: 'lobby' | 'match' | 'post'
  // Ready system (v2)
  readyUsers?: { [userId: string]: boolean }
  countdownStarted?: boolean
  countdownFrom?: number
  startedAt?: any
  finishedAt?: any
  // Scores (v2)
  scores?: { [userId: string]: { correct: number; answered: number; updatedAt?: any } }
  // Result
  winnerTeamId?: string | null
}

function stableMissionId(subject: string, roomId: string): string {
  const subj = subject || 'esp'
  // 1..50
  let h = 0
  for (let i = 0; i < roomId.length; i++) h = (h * 31 + roomId.charCodeAt(i)) >>> 0
  const n = (h % 50) + 1
  // mixed uses esp as base for now
  const base = subj === 'mixed' ? 'esp' : subj
  return `${base}-${n}`
}

export async function createBattleRoom(params: {
  userId: string
  teamId: string
  subject?: string
  maxPerTeam?: number
  visibility?: 'open' | 'private'
}) {
  const dbi = ensureDb()
  const ref = doc(collection(dbi, 'battleRooms'))
  const subject = params.subject || 'esp'
  const maxPerTeam = Math.min(4, Math.max(1, params.maxPerTeam || 4))

  const visibility = params.visibility || 'open'

  const data: BattleRoom = {
    id: ref.id,
    status: 'open',
    subject,
    maxPerTeam,
    missionId: stableMissionId(subject, ref.id),
    teams: {
      A: { teamId: params.teamId, members: [params.userId] },
      B: undefined,
    },
    chatPhase: 'lobby',
    // legacy
    hostUserId: params.userId,
    hostTeamId: params.teamId,
  }

  await setDoc(ref, { ...data, visibility, createdAt: serverTimestamp() }, { merge: true })
  return data
}

export async function joinBattleRoom(params: { roomId: string; userId: string; teamId: string }) {
  const dbi = ensureDb()
  const ref = doc(dbi, 'battleRooms', params.roomId)
  await runTransaction(dbi, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Sala no existe.')
    const r = snap.data() as any

    const status = String(r.status || 'open')
    if (status !== 'open') throw new Error('Sala no está abierta.')

    const maxPerTeam = Math.min(4, Math.max(1, Number(r.maxPerTeam || 4)))
    const teams = (r.teams || {}) as any
    const A = teams.A as any
    const B = teams.B as any

    function addMember(teamKey: 'A' | 'B') {
      const cur = (teamKey === 'A' ? A : B) || { teamId: params.teamId, members: [] }
      const members = Array.isArray(cur.members) ? cur.members.map(String) : []
      if (members.includes(params.userId)) return
      if (members.length >= maxPerTeam) throw new Error('Equipo lleno.')
      members.push(params.userId)
      tx.set(ref, { teams: { [teamKey]: { teamId: cur.teamId || params.teamId, members } } }, { merge: true })
    }

    // If joining same team as A
    if (A?.teamId && String(A.teamId) === params.teamId) {
      addMember('A')
      return
    }
    // If B exists and matches
    if (B?.teamId && String(B.teamId) === params.teamId) {
      addMember('B')
      return
    }
    // Else, if B empty, create B with this team
    if (!B?.teamId) {
      tx.set(ref, { teams: { B: { teamId: params.teamId, members: [params.userId] } } }, { merge: true })
      // Start match as soon as there are two teams
      tx.set(ref, { status: 'started', startedAt: serverTimestamp(), chatPhase: 'match' }, { merge: true })
      return
    }

    throw new Error('Sala llena o equipo no coincide.')
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
  scope: { kind: 'global' } | { kind: 'team'; teamId: string },
  cb: (msgs: Array<{ id: string; userId: string; text: string; createdAt?: any; scope?: string }>) => void
): Unsubscribe {
  const dbi = ensureDb()
  const ref = collection(dbi, 'battleRooms', roomId, 'messages')
  const scopeKey = scope.kind === 'global' ? 'global' : `team:${scope.teamId}`
  const q = query(ref, where('scope', '==', scopeKey), orderBy('createdAt', 'asc'), limit(100))
  return onSnapshot(q, (qs) => {
    const out = qs.docs.map((d) => {
      const data = d.data() as any
      return {
        id: d.id,
        userId: String(data.userId || ''),
        text: String(data.text || ''),
        createdAt: data.createdAt,
        scope: String(data.scope || 'global'),
      }
    })
    cb(out)
  })
}

export async function sendBattleMessage(params: { roomId: string; userId: string; text: string; scope: string }) {
  const dbi = ensureDb()
  const text = params.text.trim().slice(0, 200)
  if (!text) return
  const ref = doc(collection(dbi, 'battleRooms', params.roomId, 'messages'))
  await setDoc(ref, { userId: params.userId, text, scope: params.scope, createdAt: serverTimestamp() }, { merge: true })
}

export async function submitBattleScore(params: { roomId: string; userId: string; correct: number; answered: number }) {
  const dbi = ensureDb()
  const ref = doc(dbi, 'battleRooms', params.roomId)
  const field = `scores.${params.userId}`
  await setDoc(ref, { [field]: { correct: params.correct, answered: params.answered, updatedAt: serverTimestamp() } }, { merge: true })
}

export async function toggleBattleReady(params: { roomId: string; userId: string; ready: boolean }) {
  const dbi = ensureDb()
  const ref = doc(dbi, 'battleRooms', params.roomId)
  const field = `readyUsers.${params.userId}`
  await setDoc(ref, { [field]: params.ready }, { merge: true })
}

export async function startBattleCountdown(params: { roomId: string }) {
  const dbi = ensureDb()
  const ref = doc(dbi, 'battleRooms', params.roomId)
  await setDoc(ref, { countdownStarted: true, countdownFrom: 3, chatPhase: 'lobby' }, { merge: true })
}

export async function finishBattle(params: { roomId: string, winnerTeamId?: string | null }) {
  const dbi = ensureDb()
  const ref = doc(dbi, 'battleRooms', params.roomId)
  await setDoc(ref, {
    status: 'finished',
    finishedAt: serverTimestamp(),
    chatPhase: 'post',
    winnerTeamId: params.winnerTeamId || null
  }, { merge: true })
}

// --- Friends / Social (v1) ---
export type Friend = { id: string; nickname?: string; createdAt?: any }

export async function sendFriendRequest(params: { fromUserId: string; toNickname: string }) {
  const dbi = ensureDb()
  const toId = normalize(params.toNickname)
  if (!toId) throw new Error('Nickname inválido.')
  if (toId === params.fromUserId) throw new Error('No puedes agregarte a ti mismo.')

  const toUserRef = doc(dbi, 'users', toId)
  const toUserSnap = await getDoc(toUserRef)
  if (!toUserSnap.exists()) throw new Error('Usuario no existe.')

  const inRef = doc(dbi, 'users', toId, 'friendRequestsIn', params.fromUserId)
  const outRef = doc(dbi, 'users', params.fromUserId, 'friendRequestsOut', toId)

  await setDoc(inRef, { fromUserId: params.fromUserId, createdAt: serverTimestamp() }, { merge: true })
  await setDoc(outRef, { toUserId: toId, createdAt: serverTimestamp() }, { merge: true })
}

export async function acceptFriendRequest(params: { userId: string; fromUserId: string }) {
  const dbi = ensureDb()
  const a = params.userId
  const b = params.fromUserId

  const aRef = doc(dbi, 'users', a)
  const bRef = doc(dbi, 'users', b)
  const [aSnap, bSnap] = await Promise.all([getDoc(aRef), getDoc(bRef)])
  if (!aSnap.exists() || !bSnap.exists()) throw new Error('Usuario no existe.')

  const aNick = String((aSnap.data() as any).nickname || a)
  const bNick = String((bSnap.data() as any).nickname || b)

  const batch = writeBatch(dbi)
  batch.set(doc(dbi, 'users', a, 'friends', b), { nickname: bNick, createdAt: serverTimestamp() }, { merge: true })
  batch.set(doc(dbi, 'users', b, 'friends', a), { nickname: aNick, createdAt: serverTimestamp() }, { merge: true })
  batch.delete(doc(dbi, 'users', a, 'friendRequestsIn', b))
  batch.delete(doc(dbi, 'users', b, 'friendRequestsOut', a))
  await batch.commit()
}

export async function rejectFriendRequest(params: { userId: string; fromUserId: string }) {
  const dbi = ensureDb()
  const batch = writeBatch(dbi)
  batch.delete(doc(dbi, 'users', params.userId, 'friendRequestsIn', params.fromUserId))
  batch.delete(doc(dbi, 'users', params.fromUserId, 'friendRequestsOut', params.userId))
  await batch.commit()
}

export function subscribeFriends(userId: string, cb: (list: Friend[]) => void): Unsubscribe {
  const dbi = ensureDb()
  const ref = collection(dbi, 'users', userId, 'friends')
  const q = query(ref, orderBy('createdAt', 'desc'), limit(200))
  return onSnapshot(q, (qs) => {
    cb(
      qs.docs.map((d) => {
        const data = d.data() as any
        return { id: d.id, nickname: data.nickname, createdAt: data.createdAt }
      })
    )
  })
}

export function subscribeFriendRequestsIn(userId: string, cb: (list: Array<{ id: string; fromUserId: string }>) => void): Unsubscribe {
  const dbi = ensureDb()
  const ref = collection(dbi, 'users', userId, 'friendRequestsIn')
  const q = query(ref, limit(200))
  return onSnapshot(q, (qs) => {
    cb(qs.docs.map((d) => ({ id: d.id, fromUserId: d.id })))
  })
}

export function subscribeFriendRequestsOut(userId: string, cb: (list: Array<{ id: string; toUserId: string }>) => void): Unsubscribe {
  const dbi = ensureDb()
  const ref = collection(dbi, 'users', userId, 'friendRequestsOut')
  const q = query(ref, limit(200))
  return onSnapshot(q, (qs) => {
    cb(qs.docs.map((d) => ({ id: d.id, toUserId: d.id })))
  })
}

export async function sendBattleInvite(params: { fromUserId: string; toUserId: string; roomId: string }) {
  const dbi = ensureDb()
  const ref = doc(collection(dbi, 'users', params.toUserId, 'battleInvites'))
  await setDoc(ref, { fromUserId: params.fromUserId, roomId: params.roomId, createdAt: serverTimestamp() }, { merge: true })
}

export function subscribeBattleInvites(
  userId: string,
  cb: (list: Array<{ id: string; fromUserId: string; roomId: string }>) => void
): Unsubscribe {
  const dbi = ensureDb()
  const ref = collection(dbi, 'users', userId, 'battleInvites')
  const q = query(ref, orderBy('createdAt', 'desc'), limit(50))
  return onSnapshot(q, (qs) => {
    cb(
      qs.docs.map((d) => {
        const data = d.data() as any
        return { id: d.id, fromUserId: String(data.fromUserId || ''), roomId: String(data.roomId || '') }
      })
    )
  })
}

// --- Voice (WebRTC signaling via Firestore) ---
export function subscribeVoiceSignal(
  params: {
    roomId: string
    scopeKey: string
    kind: 'offer' | 'answer'
    cb: (data: any | null) => void
  }
): Unsubscribe {
  const dbi = ensureDb()
  const ref = doc(dbi, 'battleRooms', params.roomId, 'webrtc', params.scopeKey, 'signals', params.kind)
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return params.cb(null)
    params.cb(snap.data() as any)
  })
}

export function subscribeVoiceCandidates(
  params: {
    roomId: string
    scopeKey: string
    kind: 'caller' | 'callee'
    cb: (c: any) => void
  }
): Unsubscribe {
  const dbi = ensureDb()
  const ref = collection(dbi, 'battleRooms', params.roomId, 'webrtc', params.scopeKey, 'candidates', params.kind)
  const q = query(ref, orderBy('createdAt', 'asc'), limit(200))
  return onSnapshot(q, (qs) => {
    for (const d of qs.docChanges()) {
      if (d.type !== 'added') continue
      params.cb((d.doc.data() as any).candidate)
    }
  })
}

export async function publishVoiceSignal(params: { roomId: string; scopeKey: string; kind: 'offer' | 'answer'; sdp: any }) {
  const dbi = ensureDb()
  const ref = doc(dbi, 'battleRooms', params.roomId, 'webrtc', params.scopeKey, 'signals', params.kind)
  await setDoc(ref, { sdp: params.sdp, updatedAt: serverTimestamp() }, { merge: true })
}

export async function publishVoiceCandidate(params: { roomId: string; scopeKey: string; kind: 'caller' | 'callee'; candidate: any }) {
  const dbi = ensureDb()
  const ref = doc(collection(dbi, 'battleRooms', params.roomId, 'webrtc', params.scopeKey, 'candidates', params.kind))
  await setDoc(ref, { candidate: params.candidate, createdAt: serverTimestamp() }, { merge: true })
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
      avatar: data.avatar ? String(data.avatar) : undefined,
      displayName: data.displayName ? String(data.displayName) : undefined,
      lastActiveAt: data.lastActiveAt,
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
