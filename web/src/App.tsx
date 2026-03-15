/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react'

import {
  listLessons,
  listQuestions,
  loadAttemptsForLesson,
  loadProgressMap,
  loginWithNicknamePin,
  recordAttempt,
  changePin,
  getWeeklyLeaderboard,
  ensureTeam,
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

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')

  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lessonId, setLessonId] = useState<string>('')

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')

  const [startModalLesson, setStartModalLesson] = useState<Lesson | null>(null)
  const [portalOpen, setPortalOpen] = useState(false)
  const [celebration, setCelebration] = useState<{ title: string; xpDelta: number } | null>(null)

  const [tab, setTab] = useState<'home' | 'play' | 'league'>('home')

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
  const [progressMap, setProgressMap] = useState<Record<string, { answeredCount: number; correctCount: number }>>({})

  const [answerText, setAnswerText] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

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
        loginWithNicknamePin(nickname, pin),
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

      setTab('home')
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
    setUser(null)
    setLessons([])
    setLessonId('')
    setQuestions([])
    setIdx(0)
    setResults({})
    setAnswerText('')
    setFeedback(null)
    setError(null)
    setStatus(null)
    setNickname('')
    setPin('')
    setSettingsOpen(false)
    setOldPin('')
    setNewPin('')
    setTab('home')
  }

  // Load weekly league when requested
  useEffect(() => {
    if (!user || tab !== 'league') return
    let cancelled = false
    ;(async () => {
      try {
        const list = await getWeeklyLeaderboard({
          scope: leagueScope,
          teamId: user.teamId,
          limitN: 25,
        })
        if (!cancelled) setLeaders(list)
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'No se pudo cargar la liga semanal.')
      }
    })()
    return () => {
      cancelled = true
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

  async function submitTextAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !lessonId || !q) return

    if (alreadyAnswered) {
      setFeedback('Ya respondiste esta pregunta.')
      return
    }

    const { ok } = checkAnswer(q, answerText)

    const nextResults = { ...results, [q.id]: ok }
    setResults(nextResults)
    setFeedback(ok ? '✅ Correcto' : '❌ Incorrecto')

    try {
      const r = await recordAttempt({
        userId: user.id,
        lessonId,
        questionId: q.id,
        answerRaw: answerText,
        wasCorrect: ok,
        answeredCount: Object.keys(nextResults).length,
        correctCount: Object.values(nextResults).filter(Boolean).length,
      })
      // optimistic UI
      setUser({
        ...user,
        xpTotal: r.xpTotal,
        streakCount: r.streakCount,
      })

      // update progressMap for route locks
      setProgressMap((pm) => {
        const next = { ...pm, [lessonId]: { answeredCount: Object.keys(nextResults).length, correctCount: Object.values(nextResults).filter(Boolean).length } }
        return next
      })

      if (Object.keys(nextResults).length === 6) {
        setCelebration({ title: lesson?.title || 'Lección', xpDelta: r.xpDelta })
      }
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar el intento (Firestore).')
    }
  }

  async function answerChoice(choiceIndex: number) {
    if (!user || !lessonId || !q) return
    if (alreadyAnswered) return

    const { ok } = checkAnswer(q, choiceIndex)
    const nextResults = { ...results, [q.id]: ok }
    setResults(nextResults)
    setFeedback(ok ? '✅ Correcto' : '❌ Incorrecto')

    try {
      const r = await recordAttempt({
        userId: user.id,
        lessonId,
        questionId: q.id,
        answerRaw: String(choiceIndex),
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
        },
      }))
      if (Object.keys(nextResults).length === 6) setCelebration({ title: lesson?.title || 'Lección', xpDelta: r.xpDelta })
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar el intento (Firestore).')
    }
  }

  async function answerTF(v: boolean) {
    if (!user || !lessonId || !q) return
    if (alreadyAnswered) return

    const { ok } = checkAnswer(q, v)
    const nextResults = { ...results, [q.id]: ok }
    setResults(nextResults)
    setFeedback(ok ? '✅ Correcto' : '❌ Incorrecto')

    try {
      const r = await recordAttempt({
        userId: user.id,
        lessonId,
        questionId: q.id,
        answerRaw: String(v),
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
        },
      }))
      if (Object.keys(nextResults).length === 6) setCelebration({ title: lesson?.title || 'Lección', xpDelta: r.xpDelta })
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar el intento (Firestore).')
    }
  }

  function next() {
    setAnswerText('')
    setFeedback(null)
    setIdx((i) => (i + 1) % Math.max(questions.length, 1))
  }

  const lesson = useMemo(() => lessons.find((l) => l.id === lessonId) || null, [lessons, lessonId])
  const subjectGroups = useMemo(() => groupLessonsBySubject(lessons), [lessons])
  const worldGroups = useMemo(() => {
    if (!world) return subjectGroups
    return subjectGroups.filter((g) => g.subject === world)
  }, [subjectGroups, world])

  const qType = (q as any)?.type || 'write'

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
    // v1 heuristic: seed packs are ~6 questions. Consider completed when answered >= 6.
    return (p.answeredCount || 0) >= 6
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#070B2A] via-[#0A1240] to-[#06081d] text-slate-100">
      <div className="mx-auto max-w-md p-4">
        <header className="sticky top-0 z-50 -mx-4 mb-2 flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <img src="/pwa-192x192.png" className="h-8 w-8 rounded-xl ring-1 ring-white/20" alt="Triviverso" />
            <div className="text-lg font-extrabold tracking-tight">Triviverso</div>
          </div>
          {user ? (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <div className="hidden sm:block">Hola, {user.nickname}</div>
              <div className="rounded-lg bg-slate-950/40 px-2 py-1 text-xs ring-1 ring-white/10">XP: {user.xpTotal ?? 0}</div>
              <div className="rounded-lg bg-slate-950/40 px-2 py-1 text-xs ring-1 ring-white/10">Racha: {user.streakCount ?? 0}</div>

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

              <button className="rounded-lg bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700" onClick={() => setSettingsOpen(true)}>
                Config
              </button>
              <button className="rounded-lg bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700" onClick={logout}>
                Salir
              </button>
            </div>
          ) : (
            <div className="text-sm text-slate-400">PWA piloto</div>
          )}
        </header>

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
          <div className="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10">
            <h1 className="text-xl font-bold">Entrar</h1>
            <p className="mt-1 text-sm text-slate-300">
              Acceso simple por <b>nickname</b> + <b>PIN de 4 dígitos</b>.
            </p>

            <form className="mt-4 space-y-3" onSubmit={onLogin}>
              <label className="block">
                <div className="mb-1 text-xs text-slate-300">Nickname</div>
                <input
                  className="w-full rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="valentina"
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

              <button className="w-full rounded-xl bg-emerald-600 px-3 py-2 font-semibold hover:bg-emerald-500">Entrar</button>

              <div className="text-xs text-slate-400">Nota: el PIN se guarda en Firestore en texto plano (permitido para este prototipo).</div>
            </form>
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
                      setLessonId(g.lessons[0]?.id || '')
                    }}
                  >
                    <div className="text-xs text-slate-300/80">Mundo</div>
                    <div className="mt-1 text-base font-extrabold">{subjectTitle(g.subject)}</div>
                    <div className="mt-2 text-xs text-slate-300/70">{g.lessons.length} lecciones</div>
                  </button>
                )
              })}
            </div>

            {/* Route map */}
            {world ? (
              <div className="mt-6 rounded-3xl bg-slate-950/30 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold">Ruta · {subjectTitle(world)}</div>
                  <button
                    className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-700"
                    onClick={() => setWorld(null)}
                  >
                    Cambiar mundo
                  </button>
                </div>

                <div className="relative mt-6 flex flex-col items-center gap-10 pb-4">
                  <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-white/10" />

                  {worldGroups[0]?.lessons?.map((l, i) => {
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
            <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span>Lección</span>
                <select
                  className="rounded-lg bg-slate-950/60 px-2 py-1 ring-1 ring-white/10"
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
                    className="rounded-xl bg-slate-950/40 px-3 py-3 text-left text-sm ring-1 ring-white/10 hover:bg-slate-950/60 disabled:opacity-60"
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
                  className="rounded-xl bg-slate-950/40 px-3 py-3 text-sm ring-1 ring-white/10 hover:bg-slate-950/60 disabled:opacity-60"
                  onClick={() => answerTF(true)}
                >
                  Verdadero
                </button>
                <button
                  disabled={alreadyAnswered}
                  className="rounded-xl bg-slate-950/40 px-3 py-3 text-sm ring-1 ring-white/10 hover:bg-slate-950/60 disabled:opacity-60"
                  onClick={() => answerTF(false)}
                >
                  Falso
                </button>
              </div>
            ) : (
              <form className="mt-4 space-y-3" onSubmit={submitTextAnswer}>
                <input
                  className="w-full rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder={alreadyAnswered ? 'Ya respondiste esta pregunta' : 'Escribe tu respuesta'}
                  disabled={alreadyAnswered || !q}
                />

                <button
                  className="w-full rounded-xl bg-emerald-600 px-3 py-2 font-semibold hover:bg-emerald-500 disabled:opacity-60"
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

            <div className="mt-4 text-xs text-slate-400">Tipos: write/fill_blank, multiple_choice, true_false (v1).</div>
          </div>
        )}

        <footer className="py-6 text-center text-xs text-slate-500">Triviverso • Piloto</footer>

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
                <div className="mt-2 text-sm font-bold">+{celebration.xpDelta} XP</div>
              </div>
              <div className="space-y-3 p-6">
                <button
                  onClick={() => setCelebration(null)}
                  className="w-full rounded-2xl border-b-4 border-[#d07a00] bg-gradient-to-b from-[#FFC800] to-[#FF9600] py-4 text-lg font-black uppercase tracking-widest text-slate-900 transition-all hover:brightness-110 active:border-b-0 active:translate-y-1"
                >
                  Continuar
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
