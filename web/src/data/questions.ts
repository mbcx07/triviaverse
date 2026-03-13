export type Question = {
  id: string
  prompt: string
  answersAccepted: string[]
  explanation?: string
}

// MVP local question bank.
// Later: load per-grade/lesson from Firestore or remote JSON.
export const questions: Question[] = [
  {
    id: 'q1',
    prompt: '¿Cuál es la capital de México?',
    answersAccepted: ['ciudad de mexico', 'cdmx', 'mexico, ciudad de mexico'],
    explanation: 'La capital es la Ciudad de México (CDMX).',
  },
  {
    id: 'q2',
    prompt: '¿Cuánto es 7 × 8?',
    answersAccepted: ['56'],
    explanation: '7 por 8 es 56.',
  },
]
