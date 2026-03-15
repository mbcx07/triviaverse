/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react'

import {
  listLessons,
  listQuestions,
  loadAttemptsForLesson,
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

  const [tab, setTab] = useState<'home' | 'play' | 'league'>('home')

  const [leagueScope, setLeagueScope] = useState<'team' | 'global'>('team')
  const [leaders, setLeaders] = useState<Array<{ id: string; nickname: string; xpWeek: number }>>([])

  const [questions, setQuestions] = useState<Question[]>([])
  const [idx, setIdx] = useState(0)
  const q = useMemo<Question | null>(() => questions[idx] ?? null, [questions, idx])

  // questionId -> wasCorrect
  const [results, setResults] = useState<Record<string, boolean>>({})

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

  const qType = (q as any)?.type || 'write'

  return (
    <div className="min-h-screen text-slate-100">
      <div className="mx-auto max-w-md p-4">
        <header className="flex items-center justify-between py-4">
          <div className="text-lg font-semibold">Triviverso</div>
          {user ? (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <div className="hidden sm:block">Hola, {user.nickname}</div>
              <div className="rounded-lg bg-slate-950/40 px-2 py-1 text-xs ring-1 ring-white/10">XP: {user.xpTotal ?? 0}</div>
              <div className="rounded-lg bg-slate-950/40 px-2 py-1 text-xs ring-1 ring-white/10">Racha: {user.streakCount ?? 0}</div>

              <button
                className={`rounded-lg px-2 py-1 text-xs ring-1 ring-white/10 ${tab === 'home' ? 'bg-emerald-700/80' : 'bg-slate-800 hover:bg-slate-700'}`}
                onClick={() => setTab('home')}
              >
                Ruta
              </button>
              <button
                className={`rounded-lg px-2 py-1 text-xs ring-1 ring-white/10 ${tab === 'play' ? 'bg-emerald-700/80' : 'bg-slate-800 hover:bg-slate-700'}`}
                onClick={() => setTab('play')}
              >
                Jugar
              </button>
              <button
                className={`rounded-lg px-2 py-1 text-xs ring-1 ring-white/10 ${tab === 'league' ? 'bg-emerald-700/80' : 'bg-slate-800 hover:bg-slate-700'}`}
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
          <div className="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10">
            <div className="text-lg font-bold">Ruta</div>
            <div className="mt-1 text-xs text-slate-400">Elige una lección y entra a jugar.</div>

            {!lessons.length ? (
              <div className="mt-4 text-sm text-amber-300">
                No hay lecciones en Firestore. Corre el seed o crea documentos en la colección <code>lessons</code>.
              </div>
            ) : null}

            <div className="mt-4 space-y-5">
              {subjectGroups.map((g) => (
                <div key={g.subject}>
                  <div className="mb-2 text-sm font-semibold text-slate-200">{subjectTitle(g.subject)}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {g.lessons.map((l, i) => {
                      const active = l.id === lessonId
                      return (
                        <button
                          key={l.id}
                          className={`rounded-2xl px-2 py-3 text-xs ring-1 ring-white/10 ${active ? 'bg-emerald-700/80' : 'bg-slate-950/40 hover:bg-slate-950/60'}`}
                          onClick={() => {
                            setLessonId(l.id)
                            setTab('play')
                          }}
                        >
                          <div className="text-[10px] text-slate-300">#{i + 1}</div>
                          <div className="mt-1 font-semibold">{l.title || l.id}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10">
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
      </div>
    </div>
  )
}
