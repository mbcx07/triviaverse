import { useEffect, useMemo, useState } from 'react'

import {
  listLessons,
  listQuestions,
  loadAttemptsForLesson,
  loginWithNicknamePin,
  recordAttempt,
  changePin,
  getLeaderboard,
  type Lesson,
  type Question,
  type User,
} from './firestore'
import { normalize } from './lib/normalize'

function firstUnansweredIndex(questions: Question[], results: Record<string, boolean>) {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    if (!Object.prototype.hasOwnProperty.call(results, q.id)) return i
  }
  return 0
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

  const [tab, setTab] = useState<'play' | 'leaderboard'>('play')
  const [leaders, setLeaders] = useState<Array<{ id: string; nickname: string; xpTotal: number }>>([])

  const [questions, setQuestions] = useState<Question[]>([])
  const [idx, setIdx] = useState(0)
  const q = useMemo<Question | null>(() => questions[idx] ?? null, [questions, idx])

  // questionId -> wasCorrect
  const [results, setResults] = useState<Record<string, boolean>>({})

  const [answer, setAnswer] = useState('')
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
      setAnswer('')
      setResults({})
      setIdx(0)
      setStatus('Cargando lecciones...')

      const ls = await withTimeout(
        listLessons(),
        12000,
        'No pude cargar lecciones (Firestore). Reintenta; si persiste, falta inicializar la base o hay un bloqueo de red.'
      )
      setLessons(ls)
      setLessonId((prev) => prev || ls[0]?.id || '')

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
    setAnswer('')
    setFeedback(null)
    setError(null)
    setStatus(null)
    setNickname('')
    setPin('')
    setSettingsOpen(false)
    setOldPin('')
    setNewPin('')
  }

  // Load leaderboard when requested
  useEffect(() => {
    if (!user || tab !== 'leaderboard') return
    let cancelled = false
    ;(async () => {
      try {
        const list = await getLeaderboard(25)
        if (!cancelled) setLeaders(list)
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'No se pudo cargar el leaderboard.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, tab])

  // Load questions + attempts whenever lesson changes
  useEffect(() => {
    if (!user || !lessonId) return

    let cancelled = false
    ;(async () => {
      setError(null)
      setStatus('Cargando preguntas…')
      setFeedback(null)
      setAnswer('')

      try {
        const [qs, at] = await Promise.all([
          listQuestions(lessonId),
          loadAttemptsForLesson(user.id, lessonId),
        ])

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
  }, [user, lessonId])

  async function submitAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !lessonId || !q) return

    const a = normalize(answer)
    if (!a) {
      setFeedback('Escribe una respuesta para comprobar.')
      return
    }

    if (Object.prototype.hasOwnProperty.call(results, q.id)) {
      setFeedback('Ya respondiste esta pregunta.')
      return
    }

    const ok = (q.answersAccepted ?? []).map(normalize).includes(a)

    const nextResults = { ...results, [q.id]: ok }
    setResults(nextResults)
    setFeedback(ok ? '✅ Correcto' : '❌ Incorrecto')

    try {
      await recordAttempt({
        userId: user.id,
        lessonId,
        questionId: q.id,
        answerRaw: answer,
        wasCorrect: ok,
        answeredCount: Object.keys(nextResults).length,
        correctCount: Object.values(nextResults).filter(Boolean).length,
      })
    } catch (err: any) {
      // Keep UI responsive even if write fails.
      setError(err?.message || 'No se pudo guardar el intento (Firestore).')
    }
  }

  function next() {
    setAnswer('')
    setFeedback(null)
    setIdx((i) => (i + 1) % Math.max(questions.length, 1))
  }

  return (
    <div className="min-h-screen text-slate-100">
      <div className="mx-auto max-w-md p-4">
        <header className="flex items-center justify-between py-4">
          <div className="text-lg font-semibold">Triviverso</div>
          {user ? (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <div className="hidden sm:block">Hola, {user.nickname}</div>
              <div className="rounded-lg bg-slate-950/40 px-2 py-1 text-xs ring-1 ring-white/10">
                XP: {user.xpTotal ?? 0}
              </div>

              <button
                className={`rounded-lg px-2 py-1 text-xs ring-1 ring-white/10 ${tab === 'play' ? 'bg-emerald-700/80' : 'bg-slate-800 hover:bg-slate-700'}`}
                onClick={() => setTab('play')}
              >
                Jugar
              </button>
              <button
                className={`rounded-lg px-2 py-1 text-xs ring-1 ring-white/10 ${tab === 'leaderboard' ? 'bg-emerald-700/80' : 'bg-slate-800 hover:bg-slate-700'}`}
                onClick={() => setTab('leaderboard')}
              >
                Liga
              </button>

              <button
                className="rounded-lg bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
                onClick={() => setSettingsOpen(true)}
              >
                Configuración
              </button>
              <button
                className="rounded-lg bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
                onClick={logout}
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="text-sm text-slate-400">PWA piloto</div>
          )}
        </header>

        {status ? (
          <div className="mb-3 rounded-xl bg-slate-950/60 p-3 text-sm text-slate-300 ring-1 ring-white/10">
            {status}
          </div>
        ) : null}

        {error ? (
          <div className="mb-3 rounded-xl bg-rose-950/40 p-3 text-sm text-rose-200 ring-1 ring-rose-400/20">
            {error}
          </div>
        ) : null}

        {settingsOpen && user ? (
          <div className="mb-3 rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">Configuración</div>
              <button
                className="rounded-lg bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
                onClick={() => setSettingsOpen(false)}
              >
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

              <button className="w-full rounded-xl bg-emerald-600 px-3 py-2 font-semibold hover:bg-emerald-500">
                Guardar PIN
              </button>

              <div className="text-xs text-slate-400">
                Nota: por ahora el PIN se guarda en Firestore en texto plano (piloto).
              </div>
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

              <button className="w-full rounded-xl bg-emerald-600 px-3 py-2 font-semibold hover:bg-emerald-500">
                Entrar
              </button>

              <div className="text-xs text-slate-400">
                Nota: el PIN se guarda en Firestore en texto plano (permitido para este prototipo).
              </div>
            </form>
          </div>
        ) : tab === 'leaderboard' ? (
          <div className="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10">
            <div className="text-lg font-bold">Liga (XP total)</div>
            <div className="mt-1 text-xs text-slate-400">
              Primera versión: ordena por XP total (luego agregamos XP semanal + Team Belas + global).
            </div>

            <ol className="mt-4 space-y-2">
              {leaders.map((u, i) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded-xl bg-slate-950/40 px-3 py-2 ring-1 ring-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 text-center font-bold text-slate-300">{i + 1}</div>
                    <div className="font-semibold">{u.nickname}</div>
                  </div>
                  <div className="text-sm text-slate-300">{u.xpTotal} XP</div>
                </li>
              ))}
            </ol>

            {!leaders.length ? <div className="mt-4 text-sm text-slate-400">Sin datos todavía.</div> : null}
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
                Pregunta {questions.length ? idx + 1 : 0}/{questions.length} • Aciertos {correctAnswered}/{totalAnswered}
              </div>
            </div>

            {!lessonId ? (
              <div className="mt-3 text-sm text-amber-300">
                No hay lecciones en Firestore. Crea documentos en la colección <code>lessons</code>.
              </div>
            ) : null}

            <div className="mt-2 text-lg font-semibold">{q?.prompt || '—'}</div>

            <form className="mt-4 space-y-3" onSubmit={submitAnswer}>
              <input
                className="w-full rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={alreadyAnswered ? 'Ya respondiste esta pregunta' : 'Escribe tu respuesta'}
                disabled={alreadyAnswered || !q}
              />

              <button
                className="w-full rounded-xl bg-emerald-600 px-3 py-2 font-semibold hover:bg-emerald-500 disabled:opacity-60"
                disabled={alreadyAnswered || !q}
              >
                {alreadyAnswered ? 'Respondida' : 'Comprobar'}
              </button>

              {feedback ? (
                <div className="rounded-xl bg-slate-950/60 p-3 text-sm ring-1 ring-white/10">
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
            </form>

            <div className="mt-4 text-xs text-slate-400">
              Firestore mode: users/lessons/questions/attempts.
            </div>
          </div>
        )}

        <footer className="py-6 text-center text-xs text-slate-500">Triviverso • Piloto 4 niños</footer>
      </div>
    </div>
  )
}
