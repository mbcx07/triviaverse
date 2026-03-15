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

  if (t === 'order_words') {
    const selected = Array.isArray(answerRaw) ? (answerRaw as string[]) : []
    const correct = Array.isArray((q as any).tokens) ? ((q as any).tokens as string[]) : []
    if (!selected.length || selected.length !== correct.length) return { ok: false }
    const ok = selected.map(String).join('||') === correct.map(String).join('||')
    return { ok }
  }

  if (t === 'match_pairs') {
    // answerRaw: { [left]: right }
    const mapping = (answerRaw && typeof answerRaw === 'object') ? answerRaw : null
    const pairs = Array.isArray((q as any).pairs) ? ((q as any).pairs as Array<{ left: string; right: string }>) : []
    if (!mapping || !pairs.length) return { ok: false }
    for (const p of pairs) {
      if (String(mapping[p.left] ?? '') !== String(p.right)) return { ok: false }
    }
    return { ok: true }
  }

  // write/fill_blank/default
  const a = normalize(String(answerRaw ?? ''))
  const accepted = ((q as any).answersAccepted || []) as string[]
  const acceptedNorm = accepted.map((x) => normalize(String(x)))
  const ok = a ? acceptedNorm.includes(a) : false
  return { ok, normalized: a }
}
