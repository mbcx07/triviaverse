/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react'

import {
  listLessons,
  listQuestions,
  loadAttemptsForLesson,
  loadProgressMap,
  loginWithNicknamePin,
  subscribeOpenBattleRooms,
  recordAttempt,
  changePin,
  ensureTeam,
  resetLessonProgress,
  subscribeUser,
  subscribeProgressMap,
  subscribeWeeklyLeaderboard,
  updateTeamTitle,
  createBattleRoom,
  joinBattleRoom,
  subscribeBattleRoom,
  subscribeBattleMessages,
  sendBattleMessage,
  submitBattleScore,
  type Lesson,
  type Question,
  type User,
} from './firestore'
import { checkAnswer } from './lib/questionCheck'

function firstUnansweredIndex(questions: Question[], results: Record<string, boolean>) {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    if (!Object.prototype.hasOwnProperty.call(results, q.id)) return i
  }
  return 0
}

function groupLessonsBySubject(lessons: Lesson[]): Array<{ subject: string; lessons: Lesson[] }> {
  const map = new Map<string, Lesson[]>()
  for (const l of lessons) {
    const s = String(l.subject || 'general')
    if (!map.has(s)) map.set(s, [])
    map.get(s)!.push(l)
  }
  const out = [...map.entries()].map(([subject, ls]) => ({ subject, lessons: ls.sort((a, b) => (a.order || 0) - (b.order || 0)) }))
  // try to prioritize Español/Matemáticas
  const prio: Record<string, number> = { esp: 1, mat: 2, cien: 3, hist: 4, geo: 5, civ: 6, general: 99 }
  out.sort((a, b) => (prio[a.subject] || 50) - (prio[b.subject] || 50))
  return out
}

function subjectTitle(key: string): string {
  switch (key) {
    case 'esp':
      return 'Español'
    case 'mat':
      return 'Matemáticas'
    case 'cien':
      return 'Ciencias'
    case 'hist':
      return 'Historia'
    case 'geo':
      return 'Geografía'
    case 'civ':
      return 'Cívica y Ética'
    default:
      return 'Lecciones'
  }
}

function subjectIcon(key: string): string {
  switch (key) {
    case 'esp':
      return '📘'
    case 'mat':
      return '🧮'
    case 'cien':
      return '🧪'
    case 'hist':
      return '🏛️'
    case 'geo':
      return '🧭'
    case 'civ':
      return '🤝'
    default:
      return '⭐'
  }
}

function subjectGradient(key: string): string {
  switch (key) {
    case 'esp':
      return 'from-[#35C6FF] to-[#1CB0F6]'
    case 'mat':
      return 'from-[#7C4DFF] to-[#1CB0F6]'
    case 'cien':
      return 'from-[#58CC02] to-[#1CB0F6]'
    case 'hist':
      return 'from-[#FF9600] to-[#FFC800]'
    case 'geo':
      return 'from-[#1CB0F6] to-[#FFC800]'
    case 'civ':
      return 'from-[#7C4DFF] to-[#FF9600]'
    default:
      return 'from-[#1CB0F6] to-[#7C4DFF]'
  }
}

export default function App() {
  const baseUrl = (import.meta as any).env?.BASE_URL || '/'

  const [user, setUser] = useState<User | null>(null)
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
  const [teamCode, setTeamCode] = useState('')

  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lessonId, setLessonId] = useState<string>('')

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')

  // team config
  const [teamName, setTeamName] = useState('')

  // battles
  const [battleRoomId, setBattleRoomId] = useState<string>('')
  const [battleRoom, setBattleRoom] = useState<any>(null)
  const [battleMsgs, setBattleMsgs] = useState<Array<{ id: string; userId: string; text: string }>>([])
  const [battleMsgText, setBattleMsgText] = useState('')
  const [openRooms, setOpenRooms] = useState<Array<{ id: string; hostTeamId?: string; status?: string; subject?: string }>>([])
  const [openLobbyOn, setOpenLobbyOn] = useState(false)

  const [startModalLesson, setStartModalLesson] = useState<Lesson | null>(null)
  const [portalOpen, setPortalOpen] = useState(false)
  const [celebration, setCelebration] = useState<{ title: string; xpDelta: number } | null>(null)

  // trophies
  const [trophyToast, setTrophyToast] = useState<{ title: string; desc: string } | null>(null)

  // route pagination (10 missions per page)
  const [routePage, setRoutePage] = useState(0)

  const [tab, setTab] = useState<'mode' | 'home' | 'play' | 'league' | 'trophies' | 'battle'>('mode')
  const [menuOpen, setMenuOpen] = useState(false)

  // Worlds (subjects). When null, user is on the world picker.
  const [world, setWorld] = useState<string | null>(null)

  const [leagueScope, setLeagueScope] = useState<'team' | 'global'>('team')
  const [leaders, setLeaders] = useState<Array<{ id: string; nickname: string; xpWeek: number }>>([])

  const [questions, setQuestions] = useState<Question[]>([])
  const [idx, setIdx] = useState(0)
  const q = useMemo<Question | null>(() => questions[idx] ?? null, [questions, idx])

  // questionId -> wasCorrect
  const [results, setResults] = useState<Record<string, boolean>>({})

  // lessonId -> progress
  const [progressMap, setProgressMap] = useState<
    Record<string, { answeredCount: number; correctCount: number; starsBest?: number; starsLast?: number }>
  >({})

  const [answerText, setAnswerText] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  // order_words UI state
  const [orderSelected, setOrderSelected] = useState<string[]>([])

  // match_pairs UI state
  const [matchLeft, setMatchLeft] = useState<string | null>(null)
  const [matchMap, setMatchMap] = useState<Record<string, string>>({})

  const totalAnswered = useMemo(() => Object.keys(results).length, [results])
  const correctAnswered = useMemo(() => Object.values(results).filter(Boolean).length, [results])

  const alreadyAnswered = useMemo(() => {
    if (!q) return false
    return Object.prototype.hasOwnProperty.call(results, q.id)
  }, [q, results])

  function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(message)), ms)
      p.then(
        (v) => {
          clearTimeout(t)
          resolve(v)
        },
        (err) => {
          clearTimeout(t)
          reject(err)
        }
      )
    })
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStatus('Entrando...')
    setFeedback(null)

    try {
      const u = await withTimeout(
        loginWithNicknamePin(nickname, pin, teamCode),
        12000,
        'La conexión a Firestore está tardando demasiado. Revisa tu Internet o vuelve a intentar en modo incógnito.'
      )
      setUser(u)
      setAnswerText('')
      setResults({})
      setIdx(0)
      setStatus('Cargando lecciones...')

      await ensureTeam()

      const ls = await withTimeout(
        listLessons(),
        12000,
        'No pude cargar lecciones (Firestore). Reintenta; si persiste, falta inicializar la base o hay un bloqueo de red.'
      )
      setLessons(ls)
      setLessonId((prev) => prev || ls[0]?.id || '')

      // load progress for route locks
      const pm = await withTimeout(loadProgressMap(u.id), 12000, 'No pude cargar progreso (Firestore).')
      setProgressMap(pm)

      // live subscriptions (user + progress)
      // (keep unsub fns in module scope via closures)
      ;(window as any).__tv_unsubUser?.()
      ;(window as any).__tv_unsubProgress?.()
      ;(window as any).__tv_unsubUser = subscribeUser(u.id, (uu) => setUser(uu))
      ;(window as any).__tv_unsubProgress = subscribeProgressMap(u.id, (m) => setProgressMap(m))

      setTab('mode')
      setStatus(null)
    } catch (err: any) {
      setStatus(null)
      setError(err?.message || 'No se pudo iniciar sesión.')
    }
  }

  async function doChangePin(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setError(null)
    setStatus('Actualizando PIN...')
    try {
      await changePin({ userId: user.id, oldPin, newPin })
      setStatus(null)
      setOldPin('')
      setNewPin('')
      setSettingsOpen(false)
    } catch (err: any) {
      setStatus(null)
      setError(err?.message || 'No se pudo actualizar el PIN.')
    }
  }

  function logout() {
    ;(window as any).__tv_unsubUser?.()
    ;(window as any).__tv_unsubProgress?.()
    ;(window as any).__tv_unsubUser = null
    ;(window as any).__tv_unsubProgress = null

    setUser(null)
    setLessons([])
    setLessonId('')
    setQuestions([])
    setIdx(0)
    setResults({})
    setProgressMap({})
    setAnswerText('')
    setFeedback(null)
    setError(null)
    setStatus(null)
    setNickname('')
    setPin('')
    setSettingsOpen(false)
    setOldPin('')
    setNewPin('')
    setTab('mode')
  }

  // Auto-scroll battle chat
  useEffect(() => {
    if (tab !== 'battle') return
    // wait for DOM paint
    requestAnimationFrame(() => {
      const el = document.getElementById('battle-chat-scroll')
      if (el) el.scrollTop = el.scrollHeight
    })
  }, [tab, battleMsgs.length])

  // Live weekly league when requested
  useEffect(() => {
    if (!user || tab !== 'league') return

    const unsub = subscribeWeeklyLeaderboard({
      scope: leagueScope,
      teamId: user.teamId,
      limitN: 25,
      cb: (list) => setLeaders(list),
    })

    return () => {
      unsub()
    }
  }, [user, tab, leagueScope])

  // Load questions + attempts whenever lesson changes
  useEffect(() => {
    if (!user || !lessonId || tab !== 'play') return

    let cancelled = false
    ;(async () => {
      setError(null)
      setStatus('Cargando preguntas…')
      setFeedback(null)
      setAnswerText('')
      setOrderSelected([])
      setMatchLeft(null)
      setMatchMap({})

      try {
        const [qs, at] = await Promise.all([listQuestions(lessonId), loadAttemptsForLesson(user.id, lessonId)])

        if (cancelled) return
        setQuestions(qs)
        setResults(at)
        setIdx(firstUnansweredIndex(qs, at))
        setStatus(null)
      } catch (err: any) {
        if (cancelled) return
        setStatus(null)
        setError(err?.message || 'No se pudieron cargar las preguntas.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, lessonId, tab])

  async function submitAnswerGeneric(answerRaw: any) {
    if (!user || !lessonId || !q) return
    if (alreadyAnswered) {
      setFeedback('Ya respondiste esta pregunta.')
      return
    }

    const { ok } = checkAnswer(q, answerRaw)
    const nextResults = { ...results, [q.id]: ok }
    setResults(nextResults)
    setFeedback(ok ? '✅ Correcto' : '❌ Incorrecto')

    try {
      const r = await recordAttempt({
        userId: user.id,
        lessonId,
        questionId: q.id,
        answerRaw: typeof answerRaw === 'string' ? answerRaw : JSON.stringify(answerRaw),
        wasCorrect: ok,
        answeredCount: Object.keys(nextResults).length,
        correctCount: Object.values(nextResults).filter(Boolean).length,
      })

      setUser({ ...user, xpTotal: r.xpTotal, streakCount: r.streakCount })
      setProgressMap((pm) => ({
        ...pm,
        [lessonId]: {
          answeredCount: Object.keys(nextResults).length,
          correctCount: Object.values(nextResults).filter(Boolean).length,
          starsBest: r.starsBest ?? pm[lessonId]?.starsBest,
          starsLast: r.starsLast ?? pm[lessonId]?.starsLast,
        },
      }))

      if (Object.keys(nextResults).length === 6) {
        setCelebration({ title: lesson?.title || 'Lección', xpDelta: r.xpDelta })
        if (tab === 'battle' && battleRoomId) {
          await submitBattleScore({
            roomId: battleRoomId,
            userId: user.id,
            correct: Object.values(nextResults).filter(Boolean).length,
            answered: Object.keys(nextResults).length,
          })
        }
      }
    } catch (err: any) {
      const msg = String(err?.message || '')
      if (msg.includes('Firestore transactions require all reads')) {
        setError('Hubo un error temporal al guardar. Intenta de nuevo.')
      } else {
        setError(err?.message || 'No se pudo guardar el intento (Firestore).')
      }
    }
  }

  async function submitTextAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !lessonId || !q) return
    await submitAnswerGeneric(answerText)
  }

  async function answerChoice(choiceIndex: number) {
    if (!user || !lessonId || !q) return
    if (alreadyAnswered) return

    await submitAnswerGeneric(choiceIndex)
  }

  async function answerTF(v: boolean) {
    if (!user || !lessonId || !q) return
    if (alreadyAnswered) return

    await submitAnswerGeneric(v)
  }

  function next() {
    setAnswerText('')
    setFeedback(null)
    setOrderSelected([])
    setMatchLeft(null)
    setMatchMap({})
    setIdx((i) => (i + 1) % Math.max(questions.length, 1))
  }

  const lesson = useMemo(() => lessons.find((l) => l.id === lessonId) || null, [lessons, lessonId])
  const subjectGroups = useMemo(() => groupLessonsBySubject(lessons), [lessons])
  const worldGroups = useMemo(() => {
    if (!world) return subjectGroups
    return subjectGroups.filter((g) => g.subject === world)
  }, [subjectGroups, world])

  const qType = (q as any)?.type || 'write'

  const orderTokens = useMemo(() => (Array.isArray((q as any)?.tokens) ? ((q as any).tokens as string[]) : []), [q])
  const orderPool = useMemo(() => {
    if (!orderTokens.length) return []
    // deterministic-ish shuffle per question
    const seed = String((q as any)?.id || '')
    const arr = [...orderTokens]
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
    for (let i = arr.length - 1; i > 0; i--) {
      h = (h * 1664525 + 1013904223) >>> 0
      const j = h % (i + 1)
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [orderTokens, q])

  const matchPairs = useMemo(
    () => (Array.isArray((q as any)?.pairs) ? ((q as any).pairs as Array<{ left: string; right: string }>) : []),
    [q]
  )
  const matchRights = useMemo(() => {
    if (!matchPairs.length) return []
    const rights = matchPairs.map((p) => p.right)
    // shuffle rights
    const seed = String((q as any)?.id || '') + 'R'
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
    for (let i = rights.length - 1; i > 0; i--) {
      h = (h * 1664525 + 1013904223) >>> 0
      const j = h % (i + 1)
      ;[rights[i], rights[j]] = [rights[j], rights[i]]
    }
    return rights
  }, [matchPairs, q])

  const xpTotal = user?.xpTotal ?? 0
  const level = Math.floor(xpTotal / 100) + 1
  const levelXp = xpTotal % 100
  const levelProgressPct = Math.min(100, Math.max(0, (levelXp / 100) * 100))

  const completedLessons = useMemo(
    () => Object.values(progressMap).filter((p) => Number(p?.starsBest || 0) >= 1).length,
    [progressMap]
  )

  const trophies = useMemo(() => {
    const streak = user?.streakCount ?? 0

    const out: Array<{ id: string; title: string; desc: string; ok: boolean }> = []

    // XP trophies (50)
    for (let i = 1; i <= 50; i++) {
      const target = i * 100
      out.push({
        id: `xp-${target}`,
        title: i <= 5 ? 'Explorador' : i <= 15 ? 'Aventurero' : i <= 30 ? 'Capitán' : 'Leyenda',
        desc: `Alcanza ${target} XP`,
        ok: xpTotal >= target,
      })
    }

    // Streak trophies (25)
    const streakTargets = [1, 2, 3, 4, 5, 7, 10, 14, 21, 30, 45, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 365, 500, 750, 1000]
    for (const t of streakTargets.slice(0, 25)) {
      out.push({
        id: `streak-${t}`,
        title: t < 7 ? 'Inicio' : t < 30 ? 'Constancia' : t < 120 ? 'Fuego' : 'Imparable',
        desc: `Racha de ${t} día${t === 1 ? '' : 's'}`,
        ok: streak >= t,
      })
    }

    // Lessons completed trophies (25)
    const lessonTargets = [1, 2, 3, 5, 7, 10, 12, 15, 18, 20, 25, 30, 35, 40, 45, 50, 60, 75, 90, 100, 120, 150, 200, 250, 300]
    for (const t of lessonTargets.slice(0, 25)) {
      out.push({
        id: `lessons-${t}`,
        title: t < 10 ? 'Coleccionista' : t < 50 ? 'Campeón' : t < 150 ? 'Maestro' : 'Gran Maestro',
        desc: `Completa ${t} misiones (≥1★)`,
        ok: completedLessons >= t,
      })
    }

    // exactly 100
    return out.slice(0, 100)
  }, [user?.streakCount, xpTotal, completedLessons])

  // Trophy unlock notifications
  useEffect(() => {
    if (!user) return
    const key = `tv_trophies_unlocked_${user.id}`
    const prevRaw = localStorage.getItem(key)
    const prev = new Set<string>(prevRaw ? JSON.parse(prevRaw) : [])

    const unlockedNow = trophies.filter((t) => t.ok).map((t) => t.id)
    const newly = unlockedNow.find((id) => !prev.has(id))

    if (newly) {
      const t = trophies.find((x) => x.id === newly)
      if (t) {
        // avoid setState directly in effect body for lint rule
        queueMicrotask(() => {
          setTrophyToast({ title: t.title, desc: t.desc })
          setTimeout(() => setTrophyToast(null), 4000)
        })
      }
    }

    localStorage.setItem(key, JSON.stringify(unlockedNow))
  }, [user, trophies])

  function pickRandomUnlockedLesson(): Lesson | null {
    if (!lessons.length) return null

    // Only pick from unlocked lessons (per-progress lock model)
    const unlocked: Lesson[] = []
    for (const g of subjectGroups) {
      const ls = g.lessons
      for (let i = 0; i < ls.length; i++) {
        const l = ls[i]
        const prev = ls[i - 1]
        const prevCompleted = prev ? isLessonCompleted(prev.id) : true
        const isUnlocked = i === 0 ? true : prevCompleted
        if (isUnlocked) unlocked.push(l)
      }
    }

    const pool = unlocked.length ? unlocked : lessons
    const filtered = pool.filter((l) => l.id !== lessonId)
    const pickFrom = filtered.length ? filtered : pool

    const picked = pickFrom[Math.floor((crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * pickFrom.length)]
    return picked || null
  }

  function openRandomPortal() {
    const picked = pickRandomUnlockedLesson()
    if (!picked) return

    setPortalOpen(true)
    setTimeout(() => {
      setPortalOpen(false)
      setWorld(String(picked.subject || 'general'))
      setLessonId(picked.id)
      setTab('play')
      setFeedback(null)
      setError(null)
      setStatus(null)
    }, 650)
  }

  function isLessonCompleted(lessonId: string): boolean {
    const p = progressMap[lessonId]
    if (!p) return false
    // v1: to advance, child must earn at least 1 star.
    return Number(p.starsBest || 0) >= 1
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#070B2A] via-[#0A1240] to-[#06081d] text-slate-100">
      <div className="mx-auto max-w-md p-4">
        <header className="sticky top-0 z-50 -mx-4 mb-2 flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <img src={`${baseUrl}logo-transparent.png`} className="h-8 w-auto object-contain" alt="Triviverso" />
            <div className="text-lg font-extrabold tracking-tight">Triviverso</div>
          </div>
          {user ? (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              {/* Desktop nav */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="hidden md:block">Hola, {user.nickname}</div>

                <div className="rounded-lg bg-slate-950/40 px-2 py-1 text-xs ring-1 ring-white/10">Nivel {level}</div>
                <div className="rounded-lg bg-slate-950/40 px-2 py-1 text-xs ring-1 ring-white/10">XP {xpTotal}</div>
                <div className="rounded-lg bg-slate-950/40 px-2 py-1 text-xs ring-1 ring-white/10">Racha {user.streakCount ?? 0}</div>

                <button
                  className={`rounded-lg px-2 py-1 text-xs ring-1 ring-white/10 ${tab === 'home' ? 'bg-[#1CB0F6]/80' : 'bg-slate-800 hover:bg-slate-700'}`}
                  onClick={() => setTab('home')}
                >
                  Mundos
                </button>
                <button
                  className={`rounded-lg px-2 py-1 text-xs ring-1 ring-white/10 ${tab === 'play' ? 'bg-[#58CC02]/80' : 'bg-slate-800 hover:bg-slate-700'}`}
                  onClick={() => setTab('play')}
                >
                  Jugar
                </button>
                <button
                  className={`rounded-lg px-2 py-1 text-xs ring-1 ring-white/10 ${tab === 'league' ? 'bg-[#FFC800]/80 text-slate-900' : 'bg-slate-800 hover:bg-slate-700'}`}
                  onClick={() => setTab('league')}
                >
                  Liga
                </button>
                <button
                  className={`rounded-lg px-2 py-1 text-xs ring-1 ring-white/10 ${tab === 'trophies' ? 'bg-[#7C4DFF]/80' : 'bg-slate-800 hover:bg-slate-700'}`}
                  onClick={() => setTab('trophies')}
                >
                  Trofeos
                </button>

                <button className="rounded-lg bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700" onClick={() => setSettingsOpen(true)}>
                  Config
                </button>
                <button className="rounded-lg bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700" onClick={logout}>
                  Salir
                </button>
              </div>

              {/* Mobile compact */}
              <div className="flex sm:hidden items-center gap-2">
                <div className="rounded-lg bg-slate-950/40 px-2 py-1 text-[11px] ring-1 ring-white/10">Nv {level}</div>
                <div className="rounded-lg bg-slate-950/40 px-2 py-1 text-[11px] ring-1 ring-white/10">XP {xpTotal}</div>
                <button
                  className="rounded-lg bg-slate-800 px-3 py-2 text-[11px] font-bold hover:bg-slate-700"
                  onClick={() => setMenuOpen(true)}
                >
                  Menú
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">PWA piloto</div>
          )}
        </header>

        {user ? (
          <div className="mb-3 rounded-2xl bg-slate-950/30 p-3 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-300/80">Nivel {level} • {levelXp}/100</div>
              <div className="text-xs text-slate-300/80">Racha {user.streakCount ?? 0}</div>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-gradient-to-r from-[#1CB0F6] via-[#7C4DFF] to-[#FFC800]" style={{ width: `${levelProgressPct}%` }} />
            </div>
          </div>
        ) : null}

        {status ? (
          <div className="mb-3 rounded-xl bg-slate-950/60 p-3 text-sm text-slate-300 ring-1 ring-white/10">{status}</div>
        ) : null}

        {error ? (
          <div className="mb-3 rounded-xl bg-rose-950/40 p-3 text-sm text-rose-200 ring-1 ring-rose-400/20">{error}</div>
        ) : null}

        {settingsOpen && user ? (
          <div className="mb-3 rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">Configuración</div>
              <button className="rounded-lg bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700" onClick={() => setSettingsOpen(false)}>
                Cerrar
              </button>
            </div>

            <form className="mt-4 space-y-3" onSubmit={doChangePin}>
              <div className="text-sm text-slate-300">Cambiar PIN (4 dígitos)</div>

              <label className="block">
                <div className="mb-1 text-xs text-slate-300">PIN actual</div>
                <input
                  className="w-full rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="1703"
                  inputMode="numeric"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-xs text-slate-300">PIN nuevo</div>
                <input
                  className="w-full rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="1234"
                  inputMode="numeric"
                />
              </label>

              <button className="w-full rounded-xl bg-emerald-600 px-3 py-2 font-semibold hover:bg-emerald-500">Guardar PIN</button>

              <div className="text-xs text-slate-400">Nota: por ahora el PIN se guarda en Firestore en texto plano (piloto).</div>
            </form>
          </div>
        ) : null}

        {!user ? (
          <div className="rounded-3xl bg-black/25 p-6 ring-1 ring-white/10">
            <div className="flex flex-col items-center">
              <img
                src={`${baseUrl}logo-transparent.png`}
                alt="Triviverso"
                className="h-48 w-full max-w-[320px] object-contain drop-shadow-[0_10px_35px_rgba(0,0,0,0.55)]"
              />
              <p className="mt-4 text-center text-sm text-slate-300/90">
                Elige tu mundo, completa lecciones y sube en la liga.
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
              <div className="text-sm font-bold">Entrar</div>
              <div className="mt-1 text-xs text-slate-300/80">Nickname + PIN (4 dígitos)</div>

              <form className="mt-4 space-y-3" onSubmit={onLogin}>
              <label className="block">
                <div className="mb-1 text-xs text-slate-300">Nickname</div>
                <input
                  className="w-full rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="usuario"
                  autoComplete="username"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-xs text-slate-300">PIN (4 dígitos)</div>
                <input
                  className="w-full rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="1234"
                  inputMode="numeric"
                  autoComplete="current-password"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-xs text-slate-300">Código de equipo (opcional, para Batallas)</div>
                <input
                  className="w-full rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value)}
                  placeholder="familia123"
                />
                <div className="mt-1 text-[11px] text-slate-400">Úsalo para jugar con tu familia como equipo.</div>
              </label>

              <button className="w-full rounded-xl bg-emerald-600 px-3 py-2 font-semibold hover:bg-emerald-500">Entrar</button>

              <div className="text-xs text-slate-400">Nota: el PIN se guarda en Firestore en texto plano (permitido para este prototipo).</div>
            </form>
            </div>
          </div>
        ) : tab === 'mode' ? (
          <div className="rounded-3xl bg-black/25 p-4 ring-1 ring-white/10">
            <div className="text-lg font-extrabold">Elige modo</div>
            <div className="mt-1 text-xs text-slate-300/80">Individual o Batallas (prototipo).</div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <button
                className="rounded-3xl border-b-4 border-[#0e6e94] bg-gradient-to-b from-[#35C6FF] to-[#1CB0F6] p-4 text-left font-black text-white active:border-b-0 active:translate-y-1"
                onClick={() => setTab('home')}
              >
                <div className="text-sm opacity-90">Individual</div>
                <div className="mt-1 text-xl">Mundos & Misiones</div>
              </button>

              <button
                className="rounded-3xl border-b-4 border-[#5a35c7] bg-gradient-to-b from-[#7C4DFF] to-[#1CB0F6] p-4 text-left font-black text-white active:border-b-0 active:translate-y-1"
                onClick={() => setTab('battle')}
              >
                <div className="text-sm opacity-90">Batallas</div>
                <div className="mt-1 text-xl">1 vs 1 (beta)</div>
              </button>
            </div>
          </div>
        ) : tab === 'trophies' ? (
          <div className="rounded-3xl bg-black/25 p-4 ring-1 ring-white/10">
            <div className="text-lg font-extrabold">Trofeos (100)</div>
            <div className="mt-1 text-xs text-slate-300/80">Se desbloquean con XP, racha y misiones completadas (≥1★).</div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              {trophies.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-3xl p-4 ring-1 ring-white/10 ${t.ok ? 'bg-gradient-to-br from-[#FFC800]/20 via-[#1CB0F6]/10 to-[#7C4DFF]/10' : 'bg-slate-950/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-base font-extrabold">{t.title}</div>
                    <div className={`rounded-xl px-2 py-1 text-xs font-black ${t.ok ? 'bg-[#58CC02] text-white' : 'bg-white/10 text-slate-200'}`}>
                      {t.ok ? 'DESBLOQUEADO' : 'BLOQUEADO'}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-slate-200/90">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : tab === 'battle' ? (
          <div className="rounded-3xl bg-black/25 p-4 ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-lg font-extrabold">Batallas (beta)</div>
                <div className="mt-1 text-xs text-slate-300/80">Crear sala, lobby abierto o unirte con código.</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={`rounded-xl px-3 py-2 text-xs font-black ring-1 ring-white/10 ${openLobbyOn ? 'bg-[#1CB0F6]/70' : 'bg-slate-800 hover:bg-slate-700'}`}
                  onClick={() => {
                    setOpenLobbyOn((v) => !v)
                    if (!openLobbyOn) {
                      ;(window as any).__tv_unsubOpenRooms?.()
                      ;(window as any).__tv_unsubOpenRooms = subscribeOpenBattleRooms((r) => setOpenRooms(r))
                    } else {
                      ;(window as any).__tv_unsubOpenRooms?.()
                      ;(window as any).__tv_unsubOpenRooms = null
                      setOpenRooms([])
                    }
                  }}
                >
                  Lobby
                </button>
                <button className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-black hover:bg-slate-700" onClick={() => setTab('mode')}>
                  Volver
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-3xl bg-slate-950/30 p-4 ring-1 ring-white/10">
              <div className="text-sm font-extrabold">Nombre de tu equipo</div>
              <div className="mt-2 flex gap-2">
                <input
                  className="w-full rounded-2xl bg-slate-950/60 px-3 py-3 text-sm font-black ring-1 ring-white/10"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Team Belas"
                />
                <button
                  className="shrink-0 rounded-2xl bg-[#58CC02] px-4 py-3 text-sm font-black text-white"
                  onClick={async () => {
                    if (!user) return
                    const teamId = user.teamId || 'belas'
                    await updateTeamTitle({ teamId, title: teamName || 'Team Belas' })
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="rounded-3xl bg-slate-950/30 p-4 ring-1 ring-white/10">
                <div className="text-sm font-extrabold">Lobby abierto (sin código)</div>
                <div className="mt-1 text-xs text-slate-300/80">Únete a una sala abierta o crea una nueva.</div>

                <div className="mt-3 space-y-2">
                  {openRooms.map((r) => (
                    <button
                      key={r.id}
                      className="w-full rounded-2xl bg-white/5 px-3 py-3 text-left text-sm font-black ring-1 ring-white/10 hover:bg-white/10"
                      onClick={async () => {
                        if (!user) return
                        setBattleRoomId(r.id)
                        await joinBattleRoom({ roomId: r.id, userId: user.id, teamId: user.teamId || 'belas' })
                        ;(window as any).__tv_unsubBattle?.()
                        ;(window as any).__tv_unsubBattle = subscribeBattleRoom(r.id, (rr) => setBattleRoom(rr))
                        ;(window as any).__tv_unsubBattleMsgs?.()
                        ;(window as any).__tv_unsubBattleMsgs = subscribeBattleMessages(r.id, { kind: 'global' }, (m: any) => setBattleMsgs(m))
                      }}
                    >
                      Sala {r.id} • {r.subject || 'esp'} • Host {r.hostTeamId || '-'}
                    </button>
                  ))}
                  {!openRooms.length ? <div className="text-xs text-slate-300/70">No hay salas abiertas ahora.</div> : null}
                </div>
              </div>

              <button
                className="rounded-3xl border-b-4 border-[#5a35c7] bg-gradient-to-b from-[#7C4DFF] to-[#1CB0F6] p-4 text-left font-black text-white active:border-b-0 active:translate-y-1"
                onClick={async () => {
                  if (!user) return
                  const r = await createBattleRoom({ userId: user.id, teamId: user.teamId || 'belas', subject: world || 'esp' })
                  setBattleRoomId(r.id)
                  ;(window as any).__tv_unsubBattle?.()
                  ;(window as any).__tv_unsubBattle = subscribeBattleRoom(r.id, (rr) => setBattleRoom(rr))
                  ;(window as any).__tv_unsubBattleMsgs?.()
                  ;(window as any).__tv_unsubBattleMsgs = subscribeBattleMessages(r.id, { kind: 'global' }, (m: any) => setBattleMsgs(m))
                }}
              >
                Crear batalla
                <div className="mt-1 text-xs opacity-90">Genera un código para invitar</div>
              </button>

              <div className="rounded-3xl bg-slate-950/30 p-4 ring-1 ring-white/10">
                <div className="text-sm font-extrabold">Unirme a una batalla</div>
                <div className="mt-2 flex gap-2">
                  <input
                    className="w-full rounded-2xl bg-slate-950/60 px-3 py-3 text-sm font-black ring-1 ring-white/10"
                    value={battleRoomId}
                    onChange={(e) => setBattleRoomId(e.target.value.trim())}
                    placeholder="Código de sala"
                  />
                  <button
                    className="shrink-0 rounded-2xl bg-[#FFC800] px-4 py-3 text-sm font-black text-slate-900"
                    onClick={async () => {
                      if (!user) return
                      if (!battleRoomId) return
                      await joinBattleRoom({ roomId: battleRoomId, userId: user.id, teamId: user.teamId || 'belas' })
                      ;(window as any).__tv_unsubBattle?.()
                      ;(window as any).__tv_unsubBattle = subscribeBattleRoom(battleRoomId, (rr) => setBattleRoom(rr))
                      ;(window as any).__tv_unsubBattleMsgs?.()
                      ;(window as any).__tv_unsubBattleMsgs = subscribeBattleMessages(battleRoomId, { kind: 'global' }, (m: any) => setBattleMsgs(m))
                    }}
                  >
                    Unirme
                  </button>
                </div>
              </div>

              {battleRoom ? (
                <div className="rounded-3xl bg-slate-950/30 p-4 ring-1 ring-white/10">
                  <div className="text-sm font-extrabold">Sala</div>
                  <div className="mt-1 text-xs text-slate-300/80">Código: <span className="font-black text-white">{battleRoom.id}</span></div>
                  <div className="mt-2 text-xs text-slate-300/80">Estado: <span className="font-black text-white">{battleRoom.status || 'open'}</span></div>
                  <div className="mt-2 text-xs text-slate-300/80">
                    Host: <span className="font-black text-white">{battleRoom.hostTeamId || '-'}</span> vs Guest:{' '}
                    <span className="font-black text-white">{battleRoom.guestTeamId || '—'}</span>
                  </div>

                  <div className="mt-3 rounded-2xl bg-black/20 p-3 ring-1 ring-white/10">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-slate-200/80">Chat</div>
                    <div className="mt-2 max-h-40 space-y-2 overflow-auto">
                      {battleMsgs.map((m) => (
                        <div key={m.id} className={`rounded-2xl px-3 py-2 text-sm ring-1 ring-white/10 ${m.userId === user?.id ? 'bg-[#1CB0F6]/20' : 'bg-white/5'}`}>
                          <div className="text-[10px] font-black text-slate-200/70">{m.userId === user?.id ? 'Tú' : m.userId}</div>
                          <div className="font-bold text-white">{m.text}</div>
                        </div>
                      ))}
                      {!battleMsgs.length ? <div className="text-xs text-slate-300/70">Sin mensajes aún.</div> : null}
                    </div>

                    <div className="mt-2 flex gap-2">
                      <input
                        className="w-full rounded-2xl bg-slate-950/60 px-3 py-3 text-sm font-black text-white ring-1 ring-white/10"
                        value={battleMsgText}
                        onChange={(e) => setBattleMsgText(e.target.value)}
                        placeholder="Escribe..."
                      />
                      <button
                        className="shrink-0 rounded-2xl bg-[#58CC02] px-4 py-3 text-sm font-black text-white"
                        onClick={async () => {
                          if (!user) return
                          if (!battleRoomId) return
                          const scope = battleRoom?.chatPhase === 'match' && user.teamId ? `team:${user.teamId}` : 'global'
                          await sendBattleMessage({ roomId: battleRoomId, userId: user.id, text: battleMsgText, scope })
                          setBattleMsgText('')
                        }}
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 text-xs text-slate-300/70">
              Siguiente: reglas completas de batalla (mismo set de misión, puntaje y ganador). Audio/llamada va en fase WebRTC.
            </div>
          </div>
        ) : tab === 'league' ? (
          <div className="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">Liga semanal</div>
              <div className="flex gap-2">
                <button
                  className={`rounded-lg px-2 py-1 text-xs ring-1 ring-white/10 ${leagueScope === 'team' ? 'bg-emerald-700/80' : 'bg-slate-800 hover:bg-slate-700'}`}
                  onClick={() => setLeagueScope('team')}
                >
                  Team Belas
                </button>
                <button
                  className={`rounded-lg px-2 py-1 text-xs ring-1 ring-white/10 ${leagueScope === 'global' ? 'bg-emerald-700/80' : 'bg-slate-800 hover:bg-slate-700'}`}
                  onClick={() => setLeagueScope('global')}
                >
                  Global
                </button>
              </div>
            </div>

            <div className="mt-1 text-xs text-slate-400">XP semanal (se reinicia por semana ISO).</div>

            <ol className="mt-4 space-y-2">
              {leaders.map((u, i) => (
                <li key={u.id} className="flex items-center justify-between rounded-xl bg-slate-950/40 px-3 py-2 ring-1 ring-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-7 text-center font-bold text-slate-300">{i + 1}</div>
                    <div className="font-semibold">{u.nickname}</div>
                  </div>
                  <div className="text-sm text-slate-300">{u.xpWeek} XP</div>
                </li>
              ))}
            </ol>

            {!leaders.length ? <div className="mt-4 text-sm text-slate-400">Sin datos todavía (juega una lección y vuelve).</div> : null}
          </div>
        ) : tab === 'home' ? (
          <div className="rounded-3xl bg-black/25 p-4 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-extrabold">Mundos</div>
                <div className="mt-1 text-xs text-slate-300/80">Elige una materia o entra al mundo sorpresa (ilimitado).</div>
              </div>
              <button
                className="rounded-2xl border-b-4 border-[#d07a00] bg-gradient-to-b from-[#FFC800] to-[#FF9600] px-3 py-2 text-xs font-black text-slate-900 shadow-lg active:border-b-0 active:translate-y-1"
                onClick={openRandomPortal}
              >
                Mundo Sorpresa
              </button>
            </div>

            {!lessons.length ? (
              <div className="mt-4 text-sm text-amber-200">
                No hay lecciones en Firestore. Corre el seed o crea documentos en la colección <code>lessons</code>.
              </div>
            ) : null}

            {/* World picker */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {subjectGroups.map((g) => {
                const active = world === g.subject
                return (
                  <button
                    key={g.subject}
                    className={`rounded-3xl bg-slate-950/40 p-4 text-left ring-1 ring-white/10 hover:bg-slate-950/60 ${active ? 'outline outline-2 outline-[#1CB0F6]' : ''}`}
                    onClick={() => {
                      setWorld(g.subject)
                      setRoutePage(0)
                      setLessonId(g.lessons[0]?.id || '')
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-300/80">Mundo</div>
                      <div className={`rounded-2xl bg-gradient-to-br ${subjectGradient(g.subject)} px-2 py-1 text-xs font-black text-white ring-1 ring-white/10`}>
                        {subjectIcon(g.subject)}
                      </div>
                    </div>
                    <div className="mt-2 text-base font-extrabold">{subjectTitle(g.subject)}</div>
                    <div className="mt-2 text-xs text-slate-300/70">{g.lessons.length} lecciones</div>
                  </button>
                )
              })}
            </div>

            {/* Route map */}
            {world ? (
              <div className="mt-6 rounded-3xl bg-slate-950/30 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold">Ruta · {subjectTitle(world)}</div>
                  <button
                    className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-700"
                    onClick={() => setWorld(null)}
                  >
                    Cambiar mundo
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4].map((p) => (
                    <button
                      key={p}
                      className={`rounded-xl px-3 py-2 text-xs font-black ring-1 ring-white/10 ${routePage === p ? 'bg-[#1CB0F6]/70' : 'bg-slate-950/30 hover:bg-slate-950/50'}`}
                      onClick={() => setRoutePage(p)}
                    >
                      {p * 10 + 1}-{p * 10 + 10}
                    </button>
                  ))}
                </div>

                <div className="relative mt-6 flex flex-col items-center gap-10 pb-4">
                  <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-white/10" />

                  {worldGroups[0]?.lessons?.slice(routePage * 10, routePage * 10 + 10).map((l, i0) => {
                    const i = routePage * 10 + i0
                    const completed = isLessonCompleted(l.id)
                    const prev = worldGroups[0]?.lessons?.[i - 1]
                    const prevCompleted = prev ? isLessonCompleted(prev.id) : true
                    const unlocked = i === 0 ? true : prevCompleted
                    const current = unlocked && !completed && (i === 0 || prevCompleted)
                    const locked = !unlocked

                    const x = Math.sin(i * 1.2) * 60
                    return (
                      <div key={l.id} className="relative z-10" style={{ marginLeft: `${x}px` }}>
                        <button
                          disabled={locked}
                          className={`group relative flex h-20 w-20 items-center justify-center rounded-full border-b-8 text-center transition-all active:border-b-0 active:translate-y-2 disabled:cursor-not-allowed disabled:opacity-70
                            ${completed
                              ? 'bg-[#58CC02] border-[#46A302]'
                              : locked
                                ? 'bg-slate-700/50 border-slate-700'
                                : current
                                  ? 'bg-[#1CB0F6] border-[#1899D6] ring-8 ring-[#1CB0F6]/20 animate-bounce'
                                  : 'bg-slate-900/70 border-slate-700 hover:bg-slate-900'}
                          `}
                          onClick={() => {
                            setStartModalLesson(l)
                          }}
                          title={l.title || l.id}
                        >
                          <span className="text-xs font-black text-white">{completed ? '✓' : i + 1}</span>

                          {progressMap[l.id]?.starsBest ? (
                            <div className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-[#FFC800] drop-shadow">
                              {'★'.repeat(Math.max(0, Math.min(3, Number(progressMap[l.id]?.starsBest || 0))))}
                            </div>
                          ) : null}

                          <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-black/70 px-3 py-1 text-xs font-bold text-white opacity-0 ring-1 ring-white/10 transition-opacity group-hover:opacity-100">
                            {l.title || l.id}
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-3 text-xs text-slate-300/70">
                  Tip: se desbloquea la siguiente lección cuando completas la anterior (contesta 6 preguntas).
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-3xl bg-black/25 p-4 ring-1 ring-white/10">
            <div className="flex flex-col gap-2 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex items-center gap-2">
                <span className="shrink-0">Lección</span>
                <select
                  className="w-full rounded-lg bg-slate-950/60 px-2 py-2 ring-1 ring-white/10 sm:w-auto"
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                >
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title || l.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-slate-400">
                {lesson?.subject ? subjectTitle(String(lesson.subject)) + ' • ' : ''}
                Pregunta {questions.length ? idx + 1 : 0}/{questions.length} • Aciertos {correctAnswered}/{totalAnswered}
              </div>
            </div>

            {!lessonId ? (
              <div className="mt-3 text-sm text-amber-300">
                No hay lecciones en Firestore. Crea documentos en la colección <code>lessons</code>.
              </div>
            ) : null}

            <div className="mt-2 text-lg font-semibold">{q?.prompt || '—'}</div>

            {qType === 'multiple_choice' ? (
              <div className="mt-4 grid grid-cols-1 gap-2">
                {((q as any).options || []).map((opt: string, i: number) => (
                  <button
                    key={i}
                    disabled={alreadyAnswered}
                    className="rounded-2xl bg-slate-950/40 px-3 py-3 text-left text-sm font-bold ring-1 ring-white/10 hover:bg-slate-950/60 disabled:opacity-60"
                    onClick={() => answerChoice(i)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : qType === 'true_false' ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  disabled={alreadyAnswered}
                  className="rounded-2xl bg-slate-950/40 px-3 py-3 text-sm font-black ring-1 ring-white/10 hover:bg-slate-950/60 disabled:opacity-60"
                  onClick={() => answerTF(true)}
                >
                  Verdadero
                </button>
                <button
                  disabled={alreadyAnswered}
                  className="rounded-2xl bg-slate-950/40 px-3 py-3 text-sm font-black ring-1 ring-white/10 hover:bg-slate-950/60 disabled:opacity-60"
                  onClick={() => answerTF(false)}
                >
                  Falso
                </button>
              </div>
            ) : qType === 'order_words' ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-slate-950/30 p-3 ring-1 ring-white/10">
                  <div className="text-xs text-slate-300/80">Tu oración</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {orderSelected.length ? (
                      orderSelected.map((t, i) => (
                        <button
                          key={i}
                          disabled={alreadyAnswered}
                          className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black text-white ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-60"
                          onClick={() => {
                            if (alreadyAnswered) return
                            setOrderSelected((s) => s.filter((_, idx2) => idx2 !== i))
                          }}
                        >
                          {t}
                        </button>
                      ))
                    ) : (
                      <div className="text-sm text-slate-300/70">Toca palabras abajo para ordenarlas aquí.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-950/30 p-3 ring-1 ring-white/10">
                  <div className="text-xs text-slate-300/80">Palabras</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {orderPool
                      .filter((t) => !orderSelected.includes(t))
                      .map((t, i) => (
                        <button
                          key={i}
                          disabled={alreadyAnswered}
                          className="rounded-2xl bg-slate-950/40 px-3 py-2 text-sm font-black text-white ring-1 ring-white/10 hover:bg-slate-950/60 disabled:opacity-60"
                          onClick={() => {
                            if (alreadyAnswered) return
                            setOrderSelected((s) => [...s, t])
                          }}
                        >
                          {t}
                        </button>
                      ))}
                  </div>
                </div>

                <button
                  disabled={alreadyAnswered || orderSelected.length !== orderTokens.length}
                  className="w-full rounded-2xl border-b-4 border-[#0e6e94] bg-gradient-to-b from-[#35C6FF] to-[#1CB0F6] px-3 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-60 active:border-b-0 active:translate-y-1"
                  onClick={() => submitAnswerGeneric(orderSelected)}
                >
                  Comprobar
                </button>
              </div>
            ) : qType === 'match_pairs' ? (
              <div className="mt-4 space-y-3">
                <div className="text-xs text-slate-300/80">Toca un concepto (izquierda) y luego su pareja (derecha).</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    {matchPairs.map((p, i) => {
                      const isActive = matchLeft === p.left
                      const chosen = matchMap[p.left]
                      return (
                        <button
                          key={i}
                          disabled={alreadyAnswered}
                          className={`w-full rounded-2xl px-3 py-3 text-left text-sm font-black ring-1 ring-white/10 disabled:opacity-60 ${
                            isActive ? 'bg-[#7C4DFF]/50' : 'bg-slate-950/40 hover:bg-slate-950/60'
                          }`}
                          onClick={() => {
                            if (alreadyAnswered) return
                            setMatchLeft(p.left)
                          }}
                        >
                          {p.left}
                          {chosen ? <div className="mt-1 text-xs text-slate-200/80">→ {chosen}</div> : null}
                        </button>
                      )
                    })}
                  </div>
                  <div className="space-y-2">
                    {matchRights.map((r, i) => {
                      const used = Object.values(matchMap).includes(r)
                      return (
                        <button
                          key={i}
                          disabled={alreadyAnswered || !matchLeft || used}
                          className={`w-full rounded-2xl px-3 py-3 text-left text-sm font-black ring-1 ring-white/10 disabled:opacity-50 ${
                            used ? 'bg-slate-800/30' : 'bg-slate-950/40 hover:bg-slate-950/60'
                          }`}
                          onClick={() => {
                            if (alreadyAnswered) return
                            if (!matchLeft) return
                            setMatchMap((m) => ({ ...m, [matchLeft]: r }))
                            setMatchLeft(null)
                          }}
                        >
                          {r}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button
                  disabled={alreadyAnswered || Object.keys(matchMap).length !== matchPairs.length}
                  className="w-full rounded-2xl border-b-4 border-[#0e6e94] bg-gradient-to-b from-[#35C6FF] to-[#1CB0F6] px-3 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-60 active:border-b-0 active:translate-y-1"
                  onClick={() => submitAnswerGeneric(matchMap)}
                >
                  Comprobar
                </button>
              </div>
            ) : (
              <form className="mt-4 space-y-3" onSubmit={submitTextAnswer}>
                <input
                  className="w-full rounded-2xl bg-slate-950/60 px-3 py-3 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6] disabled:opacity-60"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder={alreadyAnswered ? 'Ya respondiste esta pregunta' : 'Escribe tu respuesta'}
                  disabled={alreadyAnswered || !q}
                />

                <button
                  className="w-full rounded-2xl border-b-4 border-[#0e6e94] bg-gradient-to-b from-[#35C6FF] to-[#1CB0F6] px-3 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-60 active:border-b-0 active:translate-y-1"
                  disabled={alreadyAnswered || !q}
                >
                  {alreadyAnswered ? 'Respondida' : 'Comprobar'}
                </button>
              </form>
            )}

            {feedback ? (
              <div className="mt-3 rounded-xl bg-slate-950/60 p-3 text-sm ring-1 ring-white/10">
                <div className="font-semibold">{feedback}</div>
                {q?.explanation ? <div className="mt-1 text-slate-300">{q.explanation}</div> : null}
                <button
                  type="button"
                  className="mt-3 w-full rounded-xl bg-slate-800 px-3 py-2 font-semibold hover:bg-slate-700"
                  onClick={next}
                >
                  Siguiente
                </button>
              </div>
            ) : null}

            <div className="mt-4 text-xs text-slate-400">Tipos: write/fill_blank, multiple_choice, true_false, order_words, match_pairs (v1).</div>
          </div>
        )}

        <footer className="py-6 text-center text-xs text-slate-500">Triviverso • Piloto</footer>

        {/* Trophy toast */}
        {trophyToast ? (
          <div className="fixed left-1/2 top-4 z-[130] w-[92vw] max-w-md -translate-x-1/2 rounded-3xl bg-slate-950/90 p-4 text-white shadow-2xl ring-1 ring-white/10">
            <div className="text-xs font-extrabold uppercase tracking-widest text-[#FFC800]">Trofeo desbloqueado</div>
            <div className="mt-1 text-lg font-black">{trophyToast.title}</div>
            <div className="mt-1 text-sm text-slate-200/90">{trophyToast.desc}</div>
          </div>
        ) : null}

        {/* Mobile menu */}
        {menuOpen && user ? (
          <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-slate-950/90 p-4 text-white ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <div className="text-sm font-extrabold">Menú</div>
                <button className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold" onClick={() => setMenuOpen(false)}>
                  Cerrar
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="rounded-2xl bg-white/10 px-3 py-3 text-sm font-black" onClick={() => { setTab('mode'); setMenuOpen(false) }}>Modo</button>
                <button className="rounded-2xl bg-white/10 px-3 py-3 text-sm font-black" onClick={() => { setTab('home'); setMenuOpen(false) }}>Mundos</button>
                <button className="rounded-2xl bg-white/10 px-3 py-3 text-sm font-black" onClick={() => { setTab('league'); setMenuOpen(false) }}>Liga</button>
                <button className="rounded-2xl bg-white/10 px-3 py-3 text-sm font-black" onClick={() => { setTab('trophies'); setMenuOpen(false) }}>Trofeos</button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="rounded-2xl bg-white/10 px-3 py-3 text-sm font-black" onClick={() => { setTab('battle'); setMenuOpen(false) }}>Batalla</button>
                <button className="rounded-2xl bg-white/10 px-3 py-3 text-sm font-black" onClick={() => { setSettingsOpen(true); setMenuOpen(false) }}>Config</button>
              </div>
              <div className="mt-2">
                <button className="w-full rounded-2xl bg-rose-500/80 px-3 py-3 text-sm font-black" onClick={() => { logout(); setMenuOpen(false) }}>Salir</button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Portal (random world) */}
        {portalOpen ? (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur">
            <div className="relative h-44 w-44 rounded-full bg-gradient-to-br from-[#1CB0F6] via-[#7C4DFF] to-[#FFC800] p-2 shadow-2xl">
              <div className="h-full w-full animate-spin rounded-full bg-gradient-to-br from-[#070B2A] via-[#1CB0F6] to-[#7C4DFF]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-2xl bg-black/30 px-4 py-2 text-sm font-black text-white ring-1 ring-white/20">
                  Abriendo portal…
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Celebration */}
        {celebration ? (
          <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-[32px] bg-white/95 text-slate-900 shadow-2xl ring-1 ring-white/20">
              <div className="bg-gradient-to-br from-[#58CC02] to-[#FFC800] p-7 text-center text-slate-900">
                <div className="text-sm font-extrabold uppercase tracking-widest opacity-80">¡Completada!</div>
                <div className="mt-1 text-2xl font-black">{celebration.title}</div>

                {(() => {
                  const p = progressMap[lessonId]
                  const stars = Number(p?.starsLast || 0)
                  const arr = [1, 2, 3]
                  return (
                    <div className="mt-3 flex justify-center gap-2">
                      {arr.map((n) => (
                        <div
                          key={n}
                          className={`text-3xl ${stars >= n ? 'text-[#FF9600]' : 'text-black/20'}`}
                        >
                          ★
                        </div>
                      ))}
                    </div>
                  )
                })()}

                <div className="mt-2 text-sm font-bold">+{celebration.xpDelta} XP</div>
                <div className="mt-1 text-xs font-black">Score: {correctAnswered}/{totalAnswered}</div>
              </div>
              <div className="space-y-3 p-6">
                <button
                  onClick={() => setCelebration(null)}
                  className="w-full rounded-2xl border-b-4 border-[#d07a00] bg-gradient-to-b from-[#FFC800] to-[#FF9600] py-4 text-lg font-black uppercase tracking-widest text-slate-900 transition-all hover:brightness-110 active:border-b-0 active:translate-y-1"
                >
                  Continuar
                </button>

                <button
                  onClick={async () => {
                    if (!user) return
                    await resetLessonProgress({ userId: user.id, lessonId })
                    // reset UI state to replay
                    setCelebration(null)
                    setResults({})
                    setIdx(0)
                    setFeedback(null)
                    setAnswerText('')
                    setOrderSelected([])
                    setMatchLeft(null)
                    setMatchMap({})
                    // reload attempts/progress quickly
                    const pm = await loadProgressMap(user.id)
                    setProgressMap(pm)
                    setTab('play')
                  }}
                  className="w-full rounded-2xl bg-slate-900 px-3 py-3 text-sm font-black text-white ring-1 ring-white/10 hover:bg-slate-800"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Start lesson modal */}
        {startModalLesson ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-[32px] bg-white/95 text-slate-900 shadow-2xl ring-1 ring-white/20">
              <div className="bg-gradient-to-br from-[#1CB0F6] to-[#7C4DFF] p-7 text-center text-white">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 ring-1 ring-white/30">
                  <span className="text-2xl font-black">▶</span>
                </div>
                <div className="text-sm font-extrabold uppercase tracking-widest opacity-90">Mundo</div>
                <div className="mt-1 text-2xl font-black">{startModalLesson.title || startModalLesson.id}</div>
                <div className="mt-2 text-sm font-bold opacity-90">¿Listo para jugar?</div>
              </div>

              <div className="space-y-3 p-6">
                <button
                  onClick={() => {
                    setLessonId(startModalLesson.id)
                    setTab('play')
                    setStartModalLesson(null)
                  }}
                  className="w-full rounded-2xl border-b-4 border-[#0e6e94] bg-gradient-to-b from-[#35C6FF] to-[#1CB0F6] py-4 text-lg font-black uppercase tracking-widest text-white transition-all hover:brightness-110 active:border-b-0 active:translate-y-1"
                >
                  ¡EMPEZAR!
                </button>
                <button
                  onClick={() => setStartModalLesson(null)}
                  className="w-full rounded-2xl py-3 font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
