/* eslint-disable @typescript-eslint/no-explicit-any */
import { normalize } from './normalize'
import type { Question } from '../firestore'

export function checkAnswer(q: Question, answerRaw: any): { ok: boolean; normalized?: string } {
  const t = (q as any).type || 'write'

  if (t === 'multiple_choice') {
    const idx = Number(answerRaw)
    return { ok: idx === Number((q as any).correctIndex) }
  }

  if (t === 'true_false') {
    const v = typeof answerRaw === 'boolean' ? answerRaw : String(answerRaw) === 'true'
    return { ok: v === Boolean((q as any).answer) }
  }

  // write/fill_blank/default
  const a = normalize(String(answerRaw ?? ''))
  const accepted = ((q as any).answersAccepted || []) as string[]
  const acceptedNorm = accepted.map((x) => normalize(String(x)))
  const ok = a ? acceptedNorm.includes(a) : false
  return { ok, normalized: a }
}
