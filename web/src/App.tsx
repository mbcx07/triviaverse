import { useMemo, useState } from 'react'

import { questions } from './data/questions'
import type { Question } from './data/questions'

type User = { nickname: string }

function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
}


export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')

  const [idx, setIdx] = useState(0)
  const q = useMemo<Question | null>(() => questions[idx] ?? null, [idx])

  // Per-question results: questionId -> wasCorrect
  const [results, setResults] = useState<Record<string, boolean>>({})

  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const totalAnswered = useMemo(() => Object.keys(results).length, [results])
  const correctAnswered = useMemo(
    () => Object.values(results).filter(Boolean).length,
    [results]
  )

  const alreadyAnswered = useMemo(() => {
    if (!q) return false
    return Object.prototype.hasOwnProperty.call(results, q.id)
  }, [q, results])

  function onLogin(e: React.FormEvent) {
    e.preventDefault()
    // MVP placeholder: en Sprint 1 se valida contra Firestore.
    if (nickname.trim().length < 2 || pin.trim().length < 4) {
      setFeedback('Usa un nickname (2+) y un PIN de 4+ dígitos.')
      return
    }
    setFeedback(null)
    setUser({ nickname: nickname.trim() })
    setIdx(0)
    setResults({})
    setAnswer('')
  }

  function submitAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!q) return

    const a = normalize(answer)
    if (!a) {
      setFeedback('Escribe una respuesta para comprobar.')
      return
    }

    const ok = q.answersAccepted.map(normalize).includes(a)

    setResults((prev) => {
      // Count only the first attempt per question in this MVP.
      if (Object.prototype.hasOwnProperty.call(prev, q.id)) return prev
      return { ...prev, [q.id]: ok }
    })

    setFeedback(ok ? '✅ Correcto' : '❌ Incorrecto')
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
          <div className="text-lg font-semibold">Triviaverse</div>
          {user ? (
            <div className="text-sm text-slate-300">Hola, {user.nickname}</div>
          ) : (
            <div className="text-sm text-slate-400">PWA piloto</div>
          )}
        </header>

        {!user ? (
          <div className="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10">
            <h1 className="text-xl font-bold">Entrar</h1>
            <p className="mt-1 text-sm text-slate-300">
              Acceso simple por <b>nickname</b> + <b>PIN</b>.
            </p>

            <form className="mt-4 space-y-3" onSubmit={onLogin}>
              <label className="block">
                <div className="mb-1 text-xs text-slate-300">Nickname</div>
                <input
                  className="w-full rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="valentina"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-xs text-slate-300">PIN</div>
                <input
                  className="w-full rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="1234"
                  inputMode="numeric"
                />
              </label>

              <button className="w-full rounded-xl bg-emerald-600 px-3 py-2 font-semibold hover:bg-emerald-500">
                Entrar
              </button>
              {feedback ? <div className="text-sm text-amber-300">{feedback}</div> : null}
            </form>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
              <div>Lección • 5º/6º • Respuesta escrita</div>
              <div className="text-slate-400">
                Pregunta {questions.length ? idx + 1 : 0}/{questions.length} • Aciertos {correctAnswered}/{totalAnswered}
              </div>
            </div>
            <div className="mt-2 text-lg font-semibold">{q?.prompt}</div>

            <form className="mt-4 space-y-3" onSubmit={submitAnswer}>
              <input
                className="w-full rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={alreadyAnswered ? 'Ya respondiste esta pregunta' : 'Escribe tu respuesta'}
                disabled={alreadyAnswered}
              />

              <button
                className="w-full rounded-xl bg-emerald-600 px-3 py-2 font-semibold hover:bg-emerald-500 disabled:opacity-60"
                disabled={alreadyAnswered}
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
              Nota: esto es un MVP UI. Sprint 1 conectará login/preguntas/progreso a Firebase.
            </div>
          </div>
        )}

        <footer className="py-6 text-center text-xs text-slate-500">
          Triviaverse • Piloto 4 niños
        </footer>
      </div>
    </div>
  )
}
