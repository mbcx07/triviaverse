/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './lib/useAuth'
import { useFCM } from './lib/useFCM'
import { getProfileByUid, createProfileFromFirebase } from './lib/auth'
import { SubscriptionModal } from './components/SubscriptionModal'


import {
  listLessons,
  listQuestions,
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
  createBattleRoom,
  cancelBattleRoom,
  leaveBattleRoom,
  joinBattleRoom,
  subscribeBattleRoom,
  subscribeBattleMessages,
  sendBattleMessage,
  submitBattleScore,
  subscribeLessonQuestions,
  toggleBattleReady,
  startBattleCountdown,
  startBattleMatch,
  finishBattle,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  subscribeFriends,
  subscribeFriendRequestsIn,
  subscribeFriendRequestsOut,
  sendBattleInvite,
  subscribeBattleInvites,
  pingActive,
  updateProfile,
  getUserPublic,
  voteTeamLeader,
  subscribeLeaderVotes,
  type Lesson,
  type Question,
  type User,
} from './firestore'
import { checkAnswer } from './lib/questionCheck'
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db, assertFirebaseEnabled } from './lib/firebase-client'

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
    case 'gen':
      return 'Mundo Sorpresa'
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
  const [teamCode, _setTeamCode] = useState('')

  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lessonId, setLessonId] = useState<string>('')
  const [timerOn, setTimerOn] = useState<boolean>(() => localStorage.getItem('tv_timerOn') === '1')

  // Firebase Auth
  const { user: firebaseUser, signInWithGoogle } = useAuth()
  const { requestPermission: requestFCMPermission } = useFCM(firebaseUser)
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  const [newUserNickname, setNewUserNickname] = useState('')
  const [creatingProfile, setCreatingProfile] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')

  // team config
  const [avatar, setAvatar] = useState('🪐')
  const AVATARS = ['🪐', '🌟', '⭐', '🌙', '☀️', '🚀', '🛸', '🎮', '🎯', '🏆', '🥇', '👑', '💎', '🔮', '🧠', '🐱', '🦊', '🦁', '🐼', '🦄', '🐙', '🦋', '🌸', '🌺', '🌻', '🧙', '🧛', '🦸', '🥷', '👽', '🤖', '🎃', '👻', '🦖', '🐉', '🔥', '💫', '✨', '🪄', '🎭', '🎪', '🎨']
  const [displayName, setDisplayName] = useState('')

  // battles
  const [battleRoomId, setBattleRoomId] = useState<string>('')
  const [battleRoom, setBattleRoom] = useState<any>(null)
  const [battleCountdown, setBattleCountdown] = useState<number | null>(null)
  const [battleTimer, setBattleTimer] = useState<number>(0)
  const [battleMsgs, setBattleMsgs] = useState<Array<{ id: string; userId: string; text: string; isEmoji?: boolean; isSticker?: boolean }>>([])
  const [battleMsgText, setBattleMsgText] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  // Battle quiz state
  const [battleQuestions, setBattleQuestions] = useState<any[]>([])
  const [battleIdx, setBattleIdx] = useState(0)
  const [_battleResults, setBattleResults] = useState<Record<string, boolean>>({})
  const [battleFeedback, setBattleFeedback] = useState<any>(null)
  const [battleAnswered, setBattleAnswered] = useState(false)
  const [battleStatus, setBattleStatus] = useState<'countdown' | 'match' | 'sudden_death' | 'ended' | 'results'>('countdown')
  const [battleVotes, setBattleVotes] = useState<Record<string, { option: number; timestamp: number }>>({})
  const [battleTimerSeconds, setBattleTimerSeconds] = useState<number>(0)
  const [battleConfirmed, setBattleConfirmed] = useState(false)
  const [isTeamLeader, setIsTeamLeader] = useState(false)
  const [myBattleVote, setMyBattleVote] = useState<number | null>(null)
  const [leaderVotes, setLeaderVotes] = useState<Record<string, { teamKey: string; candidateId: string }>>({})
  const [showQuestionResults, setShowQuestionResults] = useState(false)
  const [showBattleResults, setShowBattleResults] = useState(false)
  const [battleFinalResults, setBattleFinalResults] = useState<{ teams: { id: string; name: string; score: number; members: { id: string; avatar: string; displayName: string }[] }[]; hasTie?: boolean; tiedTeamIds?: string[] } | null>(null)
  const [battleSuddenDeathActive, setBattleSuddenDeathActive] = useState(false) // estamos en ronda de muerte súbita
  const [battleSuddenDeathWinner, setBattleSuddenDeathWinner] = useState<string | null>(null) // userId del primero en responder bien
  const [battleSubject, setBattleSubject] = useState('esp')
  const [battleSize, setBattleSize] = useState(4)
  const [battleQuestionCount, setBattleQuestionCount] = useState(10)
  const [battleTeamCount, setBattleTeamCount] = useState(2) // número de equipos (1-4)
  const [battleTimerConfig, setBattleTimerConfig] = useState(120) // segundos por pregunta configurados
  const [showBattleConfig, setShowBattleConfig] = useState(false)
  const [pendingBattleVisibility, setPendingBattleVisibility] = useState<'open' | 'private'>('open')
  // suddenDeath está en battleRoom.suddenDeath, se usa al crear sala
  const [battleSuddenDeath, setBattleSuddenDeath] = useState(true)

  // Daily Challenge state
  const [dailyChallenge, setDailyChallenge] = useState<{ questions: any[]; idx: number; lives: number; completed: boolean; rewardClaimed: boolean; correctCount: number } | null>(null)
  const [dcAnswered, setDcAnswered] = useState(false)
  const [dcFeedback, setDcFeedback] = useState<{ correct: boolean; correctIndex: number } | null>(null)
  const [dcSelected, setDcSelected] = useState<number | null>(null)

  // Battle: vote for an answer (can change while timer is active)
  async function submitBattleVote(option: number) {
    if (!user || battleConfirmed) return
    // Register vote locally
    setBattleVotes((prev) => ({ ...prev, [user.id]: { option, timestamp: Date.now() } }))
    // Also submit to Firestore for team sync
    if (battleRoomId) {
      assertFirebaseEnabled()
      const ref = doc(db!, 'battleRooms', battleRoomId, 'votes', user.id)
      await setDoc(ref, { option, timestamp: serverTimestamp() }, { merge: true }).catch(() => {})
    }
  }

  // Battle: leader confirms team's answer
  async function confirmBattleAnswer() {
    if (!user || !battleRoom || !bq || battleConfirmed) return
    setBattleConfirmed(true)
    
    // Get user's vote
    const userVote = battleVotes[user.id]
    if (userVote === undefined) return
    
    const questionId = bq.id || String(battleIdx)
    const correctIndex = bq.correctIndex ?? bq.answer ?? 0
    const wasCorrect = userVote.option === correctIndex
    
    setBattleResults((prev) => ({ ...prev, [questionId]: wasCorrect }))
    setBattleFeedback(wasCorrect ? { ok: 1 } : { ok: 0, correct: correctIndex })
    setBattleAnswered(true)
    setShowQuestionResults(true)
    
    // Update local score
    const currentScore = battleRoom.scores?.[user.id]
    const newCorrect = (currentScore?.correct || 0) + (wasCorrect ? 1 : 0)
    const newAnswered = (currentScore?.answered || 0) + 1
    if (battleRoomId) {
      await submitBattleScore({ roomId: battleRoomId, userId: user.id, correct: newCorrect, answered: newAnswered }).catch(() => {})
    }
    
    // Sudden death: first correct answer wins
    if (battleSuddenDeathActive && wasCorrect && battleRoomId) {
      setBattleSuddenDeathWinner(user.id)
      const userTeam = Object.entries(battleRoom.teams || {}).find(([, teamData]) => 
        (teamData as any)?.members?.includes(user.id)
      )?.[0] || 'A'
      await finishBattle({ roomId: battleRoomId, winnerTeamId: userTeam }).catch(() => {})
      setBattleStatus('ended')
    }
  }

  const bq = battleQuestions[battleIdx] || null

  // Calculate final battle results
  function calculateBattleResults() {
    if (!battleRoom) return null
    const teams = battleRoom.teams || {}
    const scores = battleRoom.scores || {}
    const teamResults: { id: string; name: string; score: number; members: { id: string; avatar: string; displayName: string }[] }[] = []
    
    Object.entries(teams).forEach(([teamId, teamData]: [string, any]) => {
      const members = (teamData.members || []).map((memberId: string) => {
        const info = friendInfo[memberId]
        return { id: memberId, avatar: info?.avatar || '👤', displayName: info?.displayName || memberId.slice(0, 6) }
      })
      let teamScore = 0
      members.forEach((m: { id: string }) => {
        teamScore += scores[m.id]?.correct || 0
      })
      const teamName = teamId === 'A' ? 'Team Belas' : teamId === 'B' ? 'Equipo Azul' : teamId === 'C' ? 'Equipo Verde' : 'Equipo Dorado'
      teamResults.push({ id: teamId, name: teamName, score: teamScore, members })
    })
    
    // Sort by score descending
    teamResults.sort((a, b) => b.score - a.score)
    
    // Check for tie at first place
    const topScore = teamResults[0]?.score || 0
    const tiedTeams = teamResults.filter(t => t.score === topScore)
    
    return { 
      teams: teamResults, 
      hasTie: tiedTeams.length > 1,
      tiedTeamIds: tiedTeams.map(t => t.id)
    }
  }

  // Emojis básicos (frecuentes)
  const EMOJIS = ['😀', '😂', '🤣', '😍', '😎', '🔥', '🎉', '💪', '👍', '👎', '🏆', '⭐', '💯', '❤️', '🎯', '🚀', '🌟', '✨', '🎊', '🎪', '🎁', '🎸', '🎮', '🥇', '🥈', '🥉', '👏', '🙌', '🤝', '✌️']

  // Stickers (colección variada tipo WhatsApp)
  const STICKERS = [
    { emoji: '🎯', label: 'Diana' },
    { emoji: '🔥', label: 'Fuego' },
    { emoji: '💯', label: 'Perfecto' },
    { emoji: '🏆', label: 'Trofeo' },
    { emoji: '🥇', label: 'Primer lugar' },
    { emoji: '🎉', label: 'Celebración' },
    { emoji: '💪', label: 'Fuerza' },
    { emoji: '👍', label: 'Pulgar arriba' },
    { emoji: '🤣', label: 'Risa fuerte' },
    { emoji: '😍', label: 'Amor' },
    { emoji: '😎', label: 'Cool' },
    { emoji: '⭐', label: 'Estrella' },
    { emoji: '✨', label: 'Brilla' },
    { emoji: '🎊', label: 'Fiesta' },
    { emoji: '🎁', label: 'Regalo' },
    { emoji: '🎸', label: 'Guitarra' },
    { emoji: '🎮', label: 'Videojuego' },
    { emoji: '🏀', label: 'Baloncesto' },
    { emoji: '⚽', label: 'Fútbol' },
    { emoji: '🚀', label: 'Cohete' },
    { emoji: '🌟', label: 'Brilla más' },
    { emoji: '🤩', label: 'Cien por cien' },
    { emoji: '🤝', label: 'Acuerdo' },
    { emoji: '✌️', label: 'Paz' },
  ]

  // Enviar emoji
  async function sendEmoji(emoji: string) {
    if (!user || !battleRoomId) return
    const scope = battleRoom?.chatPhase === 'match' && user.teamId ? `team:${user.teamId}` : 'global'
    await sendBattleMessage({ roomId: battleRoomId, userId: user.id, text: emoji, scope })
    setShowEmojiPicker(false)
  }

  // Enviar sticker
  async function sendSticker(sticker: string) {
    if (!user || !battleRoomId) return
    const scope = battleRoom?.chatPhase === 'match' && user.teamId ? `team:${user.teamId}` : 'global'
    await sendBattleMessage({ roomId: battleRoomId, userId: user.id, text: sticker, scope })
    setShowStickers(false)
  }
  const [openRooms, setOpenRooms] = useState<Array<{ id: string; hostTeamId?: string; status?: string; subject?: string }>>([])
  const [selectedTeamKey, setSelectedTeamKey] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [openLobbyOn, setOpenLobbyOn] = useState(false)

  // friends
  const [friendQuery, setFriendQuery] = useState('')
  const [friends, setFriends] = useState<Array<{ id: string; nickname?: string }>>([])
  const [friendInfo, setFriendInfo] = useState<Record<string, { avatar?: string; displayName?: string; lastActiveAt?: any }>>({})
  const [reqIn, setReqIn] = useState<Array<{ id: string; fromUserId: string }>>([])
  const [reqOut, setReqOut] = useState<Array<{ id: string; toUserId: string }>>([])
  const [invites, setInvites] = useState<Array<{ id: string; fromUserId: string; roomId: string }>>([])

  const [startModalLesson, setStartModalLesson] = useState<Lesson | null>(null)
  const [portalOpen, setPortalOpen] = useState(false)
  const [celebration, setCelebration] = useState<{ title: string; xpDelta: number; failed?: boolean } | null>(null)
  const [exitConfirm, setExitConfirm] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(60)

  // trophies
  const [trophyToast, setTrophyToast] = useState<{ title: string; desc: string } | null>(null)

  // route pagination (10 missions per page)
  const [routePage, setRoutePage] = useState(0)

  const [tab, setTab] = useState<'mode' | 'home' | 'play' | 'league' | 'trophies' | 'battle' | 'friends'>('mode')
  const [menuOpen, setMenuOpen] = useState(false)

  // Worlds (subjects). When null, user is on the world picker.
  const [world, setWorld] = useState<string | null>(null)

  const [leagueScope, _setLeagueScope] = useState<'team' | 'global'>('team')
  const [_leaders, setLeaders] = useState<Array<{ id: string; nickname: string; xpWeek: number }>>([])

  const [questions, setQuestions] = useState<Question[]>([])
  const [idx, setIdx] = useState(0)
  const q = useMemo<Question | null>(() => questions[idx] ?? null, [questions, idx])

  // questionId -> wasCorrect
  const [results, setResults] = useState<Record<string, boolean>>({})
  const isAnsweringRef = useRef(false)  // Ref para evitar limpiar feedback (no causa re-render)

  // lessonId -> progress
  const [progressMap, setProgressMap] = useState<
    Record<string, { answeredCount: number; correctCount: number; starsBest?: number; starsLast?: number }>
  >({})

  const [answerText, setAnswerText] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [_lessonAnswered, setLessonAnswered] = useState(false)
  const [_lessonSelectedChoice, setLessonSelectedChoice] = useState<number | null>(null)

  // order_words UI state
  const [orderSelected, setOrderSelected] = useState<string[]>([])

  // match_pairs UI state
  const [matchLeft, setMatchLeft] = useState<string | null>(null)
  const [matchMap, setMatchMap] = useState<Record<string, string>>({})
  const [matchRightsUsed, setMatchRightsUsed] = useState<Set<number>>(new Set())

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

  // @ts-ignore Legacy login (Google Sign-In only now)
  // eslint-disable-next-line
  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStatus('Entrando...')
    setFeedback(null)

    try {
      const u = await withTimeout(
        loginWithNicknamePin(nickname, pin, teamCode),
        12000,
        'La conexión está tardando demasiado. Revisa tu Internet o vuelve a intentar.'
      )
      setUser(u)
      setAvatar(u.avatar || '🪐')
      setDisplayName(u.displayName || '')
      setAnswerText('')
      setResults({})
      setIdx(0)
      setStatus('Cargando lecciones...')

      await ensureTeam()

      // mark active now
      await pingActive(u.id)

      const ls = await withTimeout(
        listLessons(),
        12000,
        'No pude cargar lecciones. Reintenta; si persiste, verifica tu conexión.'
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

  // Individual mission timer (optional)
  useEffect(() => {
    if (!timerOn) return
    if (tab !== 'play') return
    if (!lessonId) return
    if (!questions.length) return
    if (celebration) return

    const t = setInterval(() => {
      setTimeLeft((v) => {
        if (v <= 1) {
          clearInterval(t)
          setExitConfirm(true)
          return 0
        }
        return v - 1
      })
    }, 1000)

    return () => clearInterval(t)
  }, [timerOn, tab, lessonId, questions.length, celebration])

  // Sync Firebase Auth with app user state
  useEffect(() => {
    if (!firebaseUser) return
    ;(async () => {
      try {
        const profile = await getProfileByUid(firebaseUser.uid)
        if (profile) {
          setUser({
            id: profile.id,
            nickname: profile.nickname,
            nicknameNorm: profile.nicknameNorm,
            xpTotal: profile.xpTotal,
            streakCount: profile.streakCount,
            teamId: profile.teamId,
            avatar: profile.avatar,
            displayName: profile.displayName,
          })
          setAvatar(profile.avatar || '🪐')
          setDisplayName(profile.displayName || '')
          
          // Cargar lecciones y progreso
          const ls = await listLessons()
          setLessons(ls)
          setLessonId((prev) => prev || ls[0]?.id || '')
          const pm = await loadProgressMap(profile.id)
          setProgressMap(pm)
          
          setTab('mode')
        } else {
          // Usuario nuevo de Google - mostrar formulario para crear perfil
          setShowCreateProfile(true)
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        setShowCreateProfile(true)
      }
    })()
  }, [firebaseUser])

  // Crear perfil para usuario nuevo de Google
  async function handleCreateProfile() {
    if (!firebaseUser) return
    if (!newUserNickname.trim()) {
      setError('Ingresa un nickname')
      return
    }
    if (newUserNickname.trim().length < 2) {
      setError('El nickname debe tener al menos 2 caracteres')
      return
    }
    
    setCreatingProfile(true)
    setError(null)
    
    try {
      const profile = await createProfileFromFirebase(firebaseUser, newUserNickname.trim())
      setUser({
        id: profile.id,
        nickname: profile.nickname,
        nicknameNorm: profile.nicknameNorm,
        xpTotal: profile.xpTotal || 0,
        streakCount: profile.streakCount || 0,
        teamId: profile.teamId,
        avatar: profile.avatar,
        displayName: profile.displayName,
      })
      setAvatar(profile.avatar || '🪐')
      setDisplayName(profile.displayName || '')
      
      // Cargar lecciones después de crear perfil
      const ls = await listLessons()
      setLessons(ls)
      setLessonId((prev) => prev || ls[0]?.id || '')
      
      setShowCreateProfile(false)
      setTab('mode')
    } catch (err: any) {
      console.error('Error creating profile:', err)
      setError(err.message || 'Error al crear perfil')
    } finally {
      setCreatingProfile(false)
    }
  }

  // Guest mode: auto-join room from URL ?room=XXX
  useEffect(() => {
    if (user) return // already logged in
    const params = new URLSearchParams(window.location.search)
    const roomId = params.get('room')
    if (!roomId) return
    
    // Create guest user
    const guestId = 'guest_' + Math.random().toString(36).slice(2, 10)
    const guestUser: User = {
      id: guestId,
      nickname: 'Invitado',
      nicknameNorm: 'invitado',
      teamId: 'guests',
      avatar: '🎭',
      displayName: 'Invitado',
      xpTotal: 0,
      streakCount: 0,
    }
    setUser(guestUser)
    setAvatar('🎭')
    setDisplayName('Invitado')
    setBattleRoomId(roomId)
    setTab('battle')
    
    // Auto-join the room
    joinBattleRoom({ roomId, userId: guestId, teamId: 'guests' }).catch((err) => {
      console.error('Error joining room:', err)
      setError('No se pudo unir a la sala. Verifica el código.')
    })
    ;(window as any).__tv_unsubBattle = subscribeBattleRoom(roomId, (rr) => setBattleRoom(rr))
    ;(window as any).__tv_unsubBattleMsgs = subscribeBattleMessages(roomId, { kind: 'global' }, (m: any) => setBattleMsgs(m))
    ;(window as any).__tv_unsubLeaderVotes = subscribeLeaderVotes(roomId, (v) => setLeaderVotes(v))
    
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname)
  }, [user])

  // Battle countdown (3, 2, 1...) when started
  useEffect(() => {
    if (!battleRoom || !user) {
      setIsTeamLeader(false)
      return
    }
    // Check if current user is leader of their team
    const teams = battleRoom.teams || {}
    const userTeam = Object.entries(teams).find(([, teamData]: [string, any]) => 
      (teamData as any)?.members?.includes(user.id)
    )
    if (userTeam) {
      const teamData = (teams as any)[userTeam[0]]
      setIsTeamLeader(teamData?.leader === user.id)
    }
  }, [battleRoom, user])

  useEffect(() => {
    if (!battleRoom) return
    const started = battleRoom.countdownStarted
    if (!started) {
      setBattleCountdown(null)
      return
    }
    const from = Number(battleRoom.countdownFrom || 3)
    let current = from
    setBattleCountdown(current)
    const t = setInterval(() => {
      current--
      if (current <= 0) {
        clearInterval(t)
        setBattleCountdown(0)
        setTimeout(async () => {
          setBattleCountdown(null)
          setBattleStatus('match')
          // Transition battleRoom.status from 'open' → 'started' (idempotent, first caller wins)
          if (battleRoom?.id) {
            await startBattleMatch({ roomId: battleRoom.id }).catch(() => {})
          }
        }, 1000)
      } else {
        setBattleCountdown(current)
      }
    }, 1000)
    return () => clearInterval(t)
  }, [battleRoom?.countdownStarted, battleRoom?.countdownFrom])

  // Battle timer (configurable via battleRoom.timerSeconds, default 120s)
  // Handles sudden death when timer reaches 0 with tied scores
  useEffect(() => {
    if (!battleRoom || !user) {
      setIsTeamLeader(false)
      return
    }
    // Check if current user is leader of their team
    const teams = battleRoom.teams || {}
    const userTeam = Object.entries(teams).find(([, teamData]: [string, any]) => 
      (teamData as any)?.members?.includes(user.id)
    )
    if (userTeam) {
      const teamData = (teams as any)[userTeam[0]]
      setIsTeamLeader(teamData?.leader === user.id)
    }
  }, [battleRoom, user])

  useEffect(() => {
    if (!battleRoom) return
    const status = battleRoom.status
    if (status !== 'started') {
      setBattleTimer(0)
      return
    }
    // startedAt timestamp
    const startedAt = battleRoom.startedAt
    if (!startedAt) return
    const timerSeconds = battleRoom.timerSeconds || 120
    const now = Date.now()
    const elapsed = Math.floor((now - startedAt.toDate().getTime()) / 1000)
    const remaining = Math.max(0, timerSeconds - elapsed)
    setBattleTimer(remaining)
          setBattleTimerSeconds(remaining)
    
    // Check for tie when timer reaches 0
    if (remaining <= 0 && !battleSuddenDeathActive) {
      // Calculate team scores
      const teams = battleRoom.teams || {}
      const scores = battleRoom.scores || {}
      const teamScores: Record<string, number> = {}
      
      for (const [teamKey, teamData] of Object.entries(teams)) {
        const members = (teamData as any)?.members || []
        let teamTotal = 0
        for (const uid of members) {
          teamTotal += (scores[uid] as any)?.correct || 0
        }
        teamScores[teamKey] = teamTotal
      }
      
      // Find max score and check for tie
      const scoreValues = Object.values(teamScores)
      const maxScore = Math.max(...scoreValues.map(Number))
      const teamsWithMax = Object.entries(teamScores).filter(([, s]) => s === maxScore)
      
      if (teamsWithMax.length > 1 && battleRoom.suddenDeath) {
        // TIE with sudden death enabled -> enter sudden death mode
        setBattleSuddenDeathActive(true)
        setBattleStatus('sudden_death')
        // Load a random question for sudden death
        const subjects = ['mat', 'esp', 'cien', 'hist', 'geo', 'civ']
        const randomSubject = subjects[Math.floor(Math.random() * subjects.length)]
        const randomLevel = Math.floor(Math.random() * 100) + 1
        const lessonId = `${randomSubject}-${randomLevel}`
        subscribeLessonQuestions(lessonId, (qs) => {
          if (qs.length > 0) {
            // Filtrar preguntas simples y agregar una de sudden death
            const filtered = qs.filter(q => {
              const prompt = (q.prompt || '').toLowerCase()
              return !prompt.includes('inicia con') && 
                     !prompt.includes('termina con') && 
                     !prompt.includes('empieza con') &&
                     !prompt.includes('comienza con')
            })
            const pool = filtered.length > 0 ? filtered : qs
            setBattleQuestions(prev => [...prev, pool[Math.floor(Math.random() * pool.length)]])
          }
        })
      } else {
        // No tie or sudden death disabled -> finish battle
        const winnerTeamId = teamsWithMax.length === 1 ? teamsWithMax[0][0] : null
        finishBattle({ roomId: battleRoom.id, winnerTeamId }).catch(() => {})
      }
    }
    
    const t = setInterval(() => {
      const now2 = Date.now()
      const elapsed2 = Math.floor((now2 - startedAt.toDate().getTime()) / 1000)
      const remaining2 = Math.max(0, timerSeconds - elapsed2)
      setBattleTimer(remaining2)
      if (remaining2 <= 0 && !battleSuddenDeathActive) {
        clearInterval(t)
        // Same tie check as above (already handled in first check)
      }
    }, 1000)
    return () => clearInterval(t)
  }, [battleRoom?.status, battleRoom?.startedAt, battleRoom?.timerSeconds, battleSuddenDeathActive])

  // Load battle questions once battle is starting (status becomes 'started', battleStatus becomes 'match')
  useEffect(() => {
    if (battleStatus !== 'match') return
    if (battleRoom?.status !== 'started') return
    if (battleQuestions.length > 0) return // already loaded
    const lessonId = battleRoom.missionId || battleRoom.lessonId || 'mat-1'
    const unsub = subscribeLessonQuestions(lessonId, (qs) => {
      // Filtrar preguntas simples: "inicia con", "termina con", "empieza con"
      const filtered = qs.filter(q => {
        const prompt = (q.prompt || '').toLowerCase()
        return !prompt.includes('inicia con') && 
               !prompt.includes('termina con') && 
               !prompt.includes('empieza con') &&
               !prompt.includes('comienza con')
      })
      // 🎲 Shuffle options para que las respuestas no siempre estén en la misma posición
      const shuffled = (filtered.length > 0 ? filtered : qs).map(q => {
        if (!Array.isArray((q as any).options) || (q as any).options.length === 0) return q
        const opts = [...(q as any).options]
        const correctIdx = (q as any).correctIndex ?? (q as any).answer ?? 0
        const correctOpt = opts[correctIdx]
        // Fisher-Yates shuffle
        for (let i = opts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [opts[i], opts[j]] = [opts[j], opts[i]]
        }
        const newCorrectIdx = opts.indexOf(correctOpt)
        return { ...q, options: opts, correctIndex: newCorrectIdx, answer: newCorrectIdx }
      })
      setBattleQuestions(shuffled)
      setBattleIdx(0)
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleStatus, battleRoom?.id, battleRoom?.status])

  // Auto-start match when status is 'started' but no countdown (e.g., AI mode)
  useEffect(() => {
    if (battleRoom?.status !== 'started') return
    if (battleStatus === 'match') return
    // If match already started without countdown, jump to match state
    if (!battleRoom.countdownStarted && battleRoom.startedAt) {
      setBattleStatus('match')
    }
  }, [battleRoom?.status, battleRoom?.countdownStarted, battleRoom?.startedAt, battleStatus])

  // Voice PTT: enable/disable mic track
  // Auto-scroll battle chat
  useEffect(() => {
    if (tab !== 'battle') return
    // wait for DOM paint
    requestAnimationFrame(() => {
      const el = document.getElementById('battle-chat-scroll')
      if (el) el.scrollTop = el.scrollHeight
    })
  }, [tab, battleMsgs.length])

  // Friends subscriptions
  useEffect(() => {
    if (!user) return
    ;(window as any).__tv_unsubFriends?.()
    ;(window as any).__tv_unsubReqIn?.()
    ;(window as any).__tv_unsubReqOut?.()
    ;(window as any).__tv_unsubInvites?.()

    ;(window as any).__tv_unsubFriends = subscribeFriends(user.id, (l) => setFriends(l))
    ;(window as any).__tv_unsubReqIn = subscribeFriendRequestsIn(user.id, (l) => setReqIn(l))
    ;(window as any).__tv_unsubReqOut = subscribeFriendRequestsOut(user.id, (l) => setReqOut(l))
    ;(window as any).__tv_unsubInvites = subscribeBattleInvites(user.id, (l) => setInvites(l))

    return () => {
      ;(window as any).__tv_unsubFriends?.()
      ;(window as any).__tv_unsubReqIn?.()
      ;(window as any).__tv_unsubReqOut?.()
      ;(window as any).__tv_unsubInvites?.()
    }
  }, [user])

  // Presence ping
  useEffect(() => {
    if (!user) return
    const id = user.id
    const t = setInterval(() => {
      pingActive(id).catch(() => {})
    }, 30000)
    return () => clearInterval(t)
  }, [user?.id])

  // Friend public info (presence)
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      const ids = friends.map((f) => f.id)
      const entries = await Promise.all(ids.slice(0, 100).map((id) => getUserPublic(id)))
      if (cancelled) return
      const map: Record<string, { avatar?: string; displayName?: string; lastActiveAt?: any }> = {}
      for (const e of entries) {
        if (!e?.id) continue
        map[e.id] = { avatar: e.avatar, displayName: e.displayName, lastActiveAt: e.lastActiveAt }
      }
      setFriendInfo(map)
    })()
    return () => {
      cancelled = true
    }
  }, [friends, user])

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
    console.log('[DEBUG] Load questions useEffect triggered:', { user: !!user, lessonId, tab, isAnswering: isAnsweringRef.current })
    if (!user || !lessonId || tab !== 'play') return

    // Si estamos respondiendo, NO recargar nada
    if (isAnsweringRef.current) {
      console.log('[DEBUG] Skipping load - answering in progress')
      return
    }

    let cancelled = false
    ;(async () => {
      setError(null)
      setStatus('Cargando preguntas…')
      setFeedback(null)
      setAnswerText('')
      setOrderSelected([])
      setMatchLeft(null)
      setMatchMap({})

      // reset timer
      setTimeLeft(60)

      try {
        const qs = await listQuestions(lessonId)
        // 🎲 Shuffle options para que las respuestas no siempre estén en la misma posición
        const shuffledQs = qs.map(q => {
          if (!Array.isArray((q as any).options) || (q as any).options.length === 0) return q
          const opts = [...(q as any).options]
          const correctIdx = (q as any).correctIndex ?? (q as any).answer ?? 0
          const correctOpt = opts[correctIdx]
          // Fisher-Yates shuffle
          for (let i = opts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [opts[i], opts[j]] = [opts[j], opts[i]]
          }
          const newCorrectIdx = opts.indexOf(correctOpt)
          return { ...q, options: opts, correctIndex: newCorrectIdx }
        })

        if (cancelled) return
        setQuestions(shuffledQs)
        setResults({})  // Empezar desde cero (reintento)
        setIdx(0)  // Primera pregunta
        setMatchRightsUsed(new Set())
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
  }, [user, lessonId, tab])  // isAnsweringRef es una ref, no necesita estar en dependencias

  async function submitAnswerGeneric(answerRaw: any) {
    console.log('[DEBUG] submitAnswerGeneric called', { alreadyAnswered, questionId: q?.id, answerRaw })
    if (!user || !lessonId || !q) return
    if (alreadyAnswered) {
      console.log('[DEBUG] Already answered, showing feedback')
      setFeedback('Ya respondiste esta pregunta.')
      return
    }

    // IMPORTANTE: Marcar que estamos respondiendo ANTES de cualquier setState
    isAnsweringRef.current = true

    const { ok } = checkAnswer(q, answerRaw)
    console.log('[DEBUG] Answer result:', { ok, correctAnswer: (q as any).correctIndex })
    const nextResults = { ...results, [q.id]: ok }
    console.log('[DEBUG] Setting results:', nextResults)
    setResults(nextResults)
    
    // Mostrar feedback visual con la respuesta correcta
    const correctAnswer = (q as any).correctIndex ?? (q as any).answer ?? 0
    const userAnswer = typeof answerRaw === 'number' ? answerRaw : -1
    setFeedback(ok ? '✅ Correcto' : `❌ Incorrecto. Respuesta: ${((q as any).options || [])[correctAnswer] || correctAnswer}`)
    
    // Guardar información del feedback para mostrar
    setLessonAnswered(true)
    setLessonSelectedChoice(userAnswer)

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

      if (Object.keys(nextResults).length === questions.length) {
        const starsEarned = r.starsLast ?? 0
        setCelebration({ 
          title: lesson?.title || 'Lección', 
          xpDelta: r.xpDelta,
          failed: starsEarned === 0
        })
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

  async function answerTF(v: boolean) {
    if (!user || !lessonId || !q) return
    if (alreadyAnswered) return

    await submitAnswerGeneric(v)
  }

  function next() {
    // Si es la última pregunta, salir de la lección
    isAnsweringRef.current = false  // Resetear flag
    if (idx + 1 >= questions.length) {
      setLessonId('')
      setQuestions([])
      setResults({})
      setIdx(0)
      setTab('mode')
      setFeedback(null)
      setAnswerText('')
      setOrderSelected([])
      setMatchLeft(null)
      setMatchMap({})
      setMatchRightsUsed(new Set())
      setLessonAnswered(false)
      setLessonSelectedChoice(null)
      return
    }
    // Si no es la última, pasar a la siguiente
    setAnswerText('')
    setFeedback(null)
    setOrderSelected([])
    setMatchLeft(null)
    setMatchMap({})
    setMatchRightsUsed(new Set())
    setLessonAnswered(false)
    setLessonSelectedChoice(null)
    setIdx(idx + 1)
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

  // @ts-expect-error Portal feature pending UI hookup
  function _openRandomPortal() {
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
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b3b] via-[#2a1158] to-[#070B2A] text-slate-100">
      <div className="mx-auto max-w-md lg:max-w-4xl p-4">
        <header className="sticky top-0 z-50 -mx-4 mb-2 flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setTab('mode'); setUser(null); setShowCreateProfile(false) }}>
            <img src={`${baseUrl}logo-transparent.png`} className="h-8 w-auto object-contain" alt="Triviverso" />
            <div className="text-lg font-extrabold tracking-tight">Triviverso</div>
          </div>
          {user ? (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              {/* Desktop nav */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="hidden md:block">{user.avatar || '🪐'} {user.displayName || user.nickname}</div>

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
            <div className="text-sm text-slate-400">
              <div className="mb-1 text-xs text-slate-500"></div>
            </div>
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

            <div className="mt-4 rounded-2xl bg-slate-950/30 p-3 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <div className="text-sm font-extrabold text-slate-200">Perfil</div>
                <button
                  className={`rounded-xl px-3 py-2 text-xs font-black ring-1 ring-white/10 ${timerOn ? 'bg-[#FFC800]/80 text-slate-900' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                  onClick={(e) => {
                    e.preventDefault()
                    const next = !timerOn
                    setTimerOn(next)
                    localStorage.setItem('tv_timerOn', next ? '1' : '0')
                  }}
                >
                  Timer: {timerOn ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {AVATARS.slice(0, 24).map((a) => (
                  <button
                    key={a}
                    className={`rounded-2xl px-3 py-3 text-xl ring-1 ring-white/10 ${avatar === a ? 'bg-[#1CB0F6]/40' : 'bg-white/5 hover:bg-white/10'}`}
                    onClick={(e) => {
                      e.preventDefault()
                      setAvatar(a)
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <label className="mt-3 block">
                <div className="mb-1 text-xs text-slate-300">Nombre visible (opcional)</div>
                <input
                  className="w-full rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={user.nickname}
                />
              </label>
              <button
                className="mt-3 w-full rounded-xl bg-[#1CB0F6] px-3 py-2 font-black text-white hover:bg-[#35C6FF]"
                onClick={async (e) => {
                  e.preventDefault()
                  await updateProfile({ userId: user.id, avatar, displayName })
                }}
              >
                Guardar perfil
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

              <div className="text-xs text-slate-400">Nota: el PIN se guarda en Firestore en texto plano.</div>
            </form>

            {/* Premium Button */}
            <div className="mt-4">
              <button
                className="w-full rounded-2xl bg-gradient-to-r from-[#FFD700] to-[#FFA500] px-4 py-3 font-black text-slate-900 hover:opacity-90 transition-opacity"
                onClick={() => setShowPremiumModal(true)}
              >
                👑 Premium
              </button>
            </div>
          </div>
        ) : null}

        {/* Premium Modal */}
        {showPremiumModal && (
          <SubscriptionModal
            onClose={() => setShowPremiumModal(false)}
            onPurchase={async (productId) => {
              // On native Android: use RevenueCat Play Billing
              const isNative = !!(window as any).Capacitor?.isNativePlatform?.()
              if (isNative) {
                try {
                  const { Purchases } = await import('@revenuecat/purchases-capacitor')
                  const { current } = await Purchases.getOfferings()
                  if (current) {
                    const pkg = current.availablePackages.find((p: any) => p.product.identifier === productId || p.identifier === productId)
                    if (pkg) {
                      await Purchases.purchasePackage({ aPackage: pkg })
                      // Update user premium status in Firestore
                      if (user) {
                        const ref = doc(db!, 'users', user.id)
                        await updateDoc(ref, { premium: true, premiumSince: serverTimestamp() })
                      }
                    }
                  }
                } catch (err: any) {
                  if (!err?.userCancelled) {
                    setError('Error al procesar la compra: ' + (err.message || err))
                  }
                  return
                }
              } else {
                // Web: just log (no Play Billing on web)
                console.log('Purchase (web):', productId)
              }
              setShowPremiumModal(false)
            }}
            onRestore={async () => {
              const isNative = !!(window as any).Capacitor?.isNativePlatform?.()
              if (isNative) {
                try {
                  const { Purchases } = await import('@revenuecat/purchases-capacitor')
                  const { customerInfo } = await Purchases.restorePurchases()
                  const hasActive = Object.keys(customerInfo.entitlements.active).length > 0
                  if (hasActive && user) {
                    const ref = doc(db!, 'users', user.id)
                    await updateDoc(ref, { premium: true })
                  }
                  return hasActive
                } catch { return false }
              }
              return false
            }}
          />
        )}

        {!user ? (
          <div className="rounded-3xl bg-black/25 p-6 ring-1 ring-white/10">
            <div className="flex flex-col items-center">
              <img
                src={`${baseUrl}logo-transparent.png`}
                alt="Triviverso"
                className="h-48 w-full max-w-[320px] object-contain drop-shadow-[0_10px_35px_rgba(0,0,0,0.55)]"
              />
              <p className="mt-4 text-center text-sm text-slate-300/90">
                Preguntas de 5° y 6° de primaria. ¡Aprende jugando!
              </p>
            </div>

            {showCreateProfile && firebaseUser && (
              <div className="mt-6 rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
                <div className="text-sm font-bold">Crear tu perfil</div>
                <div className="mt-1 text-xs text-slate-300/80">Elige un nickname para tu cuenta</div>
                
                {error && (
                  <div className="mt-3 rounded-xl bg-rose-950/40 p-3 text-sm text-rose-200">{error}</div>
                )}
                
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <div className="mb-1 text-xs text-slate-300">Nickname</div>
                    <input
                      className="w-full rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]"
                      value={newUserNickname}
                      onChange={(e) => setNewUserNickname(e.target.value)}
                      placeholder="tuNickname"
                    />
                  </label>
                  
                  <button
                    type="button"
                    className="w-full rounded-xl bg-[#1CB0F6] px-3 py-2 font-semibold hover:bg-[#35C6FF] disabled:opacity-50"
                    onClick={handleCreateProfile}
                    disabled={creatingProfile || !newUserNickname.trim()}
                  >
                    {creatingProfile ? 'Creando...' : 'Crear mi perfil'}
                  </button>
                  
                  <button
                    type="button"
                    className="w-full rounded-xl bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
                    onClick={() => {
                      setShowCreateProfile(false)
                      setNewUserNickname('')
                      setError(null)
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {!showCreateProfile && (
            <div className="mt-6 rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
              <div className="text-sm font-bold">Entrar</div>
              <div className="mt-1 text-xs text-slate-300/80">Inicia sesión con tu cuenta de Google</div>

              <button
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 font-semibold text-slate-900 hover:bg-slate-100"
                onClick={async () => {
                  const result = await signInWithGoogle()
                  if (result) {
                    // Request FCM permission after successful login
                    requestFCMPermission()
                  } else {
                    setError('No se pudo iniciar sesión con Google.')
                  }
                }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuar con Google
              </button>
            </div>
            )}
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
                <div className="mt-1 text-xl">Compite con otros</div>
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
        ) : tab === 'friends' ? (
          <div className="rounded-3xl bg-black/25 p-4 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-extrabold">Amigos</div>
                <div className="mt-1 text-xs text-slate-300/80">Estilo Roblox: solicitudes, lista e invitación a batalla.</div>
              </div>
              <button className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-black hover:bg-slate-700" onClick={() => setTab('mode')}>
                Volver
              </button>
            </div>

            <div className="mt-4 rounded-3xl bg-slate-950/30 p-4 ring-1 ring-white/10">
              <div className="text-sm font-extrabold">Agregar amigo</div>
              <div className="mt-2 flex gap-2">
                <input
                  className="w-full rounded-2xl bg-slate-950/60 px-3 py-3 text-sm font-black ring-1 ring-white/10"
                  value={friendQuery}
                  onChange={(e) => setFriendQuery(e.target.value)}
                  placeholder="nickname"
                />
                <button
                  className="shrink-0 rounded-2xl bg-[#58CC02] px-4 py-3 text-sm font-black text-white"
                  onClick={async () => {
                    if (!user) return
                    await sendFriendRequest({ fromUserId: user.id, toNickname: friendQuery })
                    setFriendQuery('')
                  }}
                >
                  Enviar
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="rounded-3xl bg-slate-950/30 p-4 ring-1 ring-white/10">
                <div className="text-sm font-extrabold">Solicitudes recibidas</div>
                <div className="mt-3 space-y-2">
                  {reqIn.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
                      <div className="text-sm font-black">{r.fromUserId}</div>
                      <div className="flex gap-2">
                        <button className="rounded-xl bg-[#58CC02] px-3 py-2 text-xs font-black text-white" onClick={() => user && acceptFriendRequest({ userId: user.id, fromUserId: r.fromUserId })}>
                          Aceptar
                        </button>
                        <button className="rounded-xl bg-rose-500/80 px-3 py-2 text-xs font-black text-white" onClick={() => user && rejectFriendRequest({ userId: user.id, fromUserId: r.fromUserId })}>
                          Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
                  {!reqIn.length ? <div className="text-xs text-slate-300/70">Sin solicitudes.</div> : null}
                </div>
              </div>

              <div className="rounded-3xl bg-slate-950/30 p-4 ring-1 ring-white/10">
                <div className="text-sm font-extrabold">Solicitudes enviadas</div>
                <div className="mt-3 space-y-2">
                  {reqOut.map((r) => (
                    <div key={r.id} className="rounded-2xl bg-white/5 px-3 py-3 text-sm font-black ring-1 ring-white/10">
                      {r.toUserId}
                    </div>
                  ))}
                  {!reqOut.length ? <div className="text-xs text-slate-300/70">Sin solicitudes.</div> : null}
                </div>
              </div>

              <div className="rounded-3xl bg-slate-950/30 p-4 ring-1 ring-white/10">
                <div className="text-sm font-extrabold">Mis amigos</div>
                <div className="mt-3 space-y-2">
                  {friends.map((f) => {
                    const info = friendInfo[f.id] || {}
                    const ts: any = info.lastActiveAt
                    const ms = ts?.toDate ? ts.toDate().getTime() : ts?.seconds ? ts.seconds * 1000 : 0
                    const ageSec = ms ? (Date.now() - ms) / 1000 : 999999
                    const online = ageSec < 90
                    const mins = Math.max(1, Math.round(ageSec / 60))

                    return (
                      <div key={f.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
                        <div>
                          <div className="text-sm font-black">
                            {(info.avatar || '🪐') + ' '}
                            {info.displayName || f.nickname || f.id}
                            {online ? <span className="ml-2 rounded-full bg-[#58CC02] px-2 py-1 text-[10px] font-black text-white">EN LÍNEA</span> : null}
                          </div>
                          <div className="text-xs text-slate-300/70">
                            @{f.id} {online ? '' : `• hace ${mins} min`}
                          </div>
                        </div>
                        <button
                          className="rounded-2xl bg-[#7C4DFF]/60 px-3 py-2 text-xs font-black text-white"
                          onClick={async () => {
                            if (!user) return
                            const maxPerTeam = 1
                            const subject = 'esp'
                            const r = await createBattleRoom({ userId: user.id, teamId: user.teamId || 'belas', subject, maxPerTeam, visibility: 'private' })
                            await sendBattleInvite({ fromUserId: user.id, toUserId: f.id, roomId: r.id })
                            setTab('battle')
                          }}
                        >
                          Invitar
                        </button>
                      </div>
                    )
                  })}
                  {!friends.length ? <div className="text-xs text-slate-300/70">Aún no tienes amigos.</div> : null}
                </div>
              </div>

              <div className="rounded-3xl bg-slate-950/30 p-4 ring-1 ring-white/10">
                <div className="text-sm font-extrabold">Invitaciones a batalla</div>
                <div className="mt-3 space-y-2">
                  {invites.map((iv) => (
                    <button
                      key={iv.id}
                      className="w-full rounded-2xl bg-white/5 px-3 py-3 text-left text-sm font-black ring-1 ring-white/10 hover:bg-white/10"
                      onClick={async () => {
                        if (!user) return
                        setBattleRoomId(iv.roomId)
                        await joinBattleRoom({ roomId: iv.roomId, userId: user.id, teamId: user.teamId || 'belas' })
                        setTab('battle')
                      }}
                    >
                      Invitación de {iv.fromUserId} → sala {iv.roomId}
                    </button>
                  ))}
                  {!invites.length ? <div className="text-xs text-slate-300/70">Sin invitaciones.</div> : null}
                </div>
              </div>
            </div>
          </div>
        ) : tab === 'home' || tab === 'play' ? (
          /* ===== MODO INDIVIDUAL - Quiz o World picker ===== */
          tab === 'play' && lessonId ? (
            /* ===== QUIZ INDIVIDUAL - Cuando estás jugando una lección ===== */
            <div className="rounded-3xl bg-black/25 p-4 ring-1 ring-white/10">
              <div className="flex flex-col gap-2 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex items-center gap-2">
                  <div>
                    {lesson?.subject ? subjectTitle(String(lesson.subject)) + ' • ' : ''}
                    Pregunta {questions.length ? idx + 1 : 0}/{questions.length} • Aciertos {correctAnswered}/{totalAnswered}
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-xl bg-rose-500/70 px-3 py-2 text-xs font-black text-white hover:bg-rose-500"
                  onClick={() => setExitConfirm(true)}
                >
                  Salir
                </button>
              </div>

              {!lessonId ? (
                <div className="mt-3 text-sm text-amber-300">
                  No hay lecciones en Firestore. Crea documentos en la colección <code>lessons</code>.
                </div>
              ) : null}

              <div className="mt-2 text-lg font-semibold">{q?.prompt || '—'}</div>

              {timerOn ? (
                <div className="mt-2 flex items-center justify-between rounded-2xl bg-slate-950/30 px-3 py-2 text-xs font-black text-slate-200 ring-1 ring-white/10">
                  <div>⏱️ Tiempo</div>
                  <div>{timeLeft}s</div>
                </div>
              ) : null}

              {qType === 'multiple_choice' ? (
                <div className="mt-4 grid grid-cols-1 gap-2">
                  {((q as any).options || []).map((opt: string, i: number) => {
                    const isCorrectAnswer = (q as any).correctIndex ?? (q as any).answer ?? 0
                    const isSelected = alreadyAnswered && i === (q as any)._selectedAnswer
                    const isCorrect = alreadyAnswered && i === isCorrectAnswer
                    const isWrong = alreadyAnswered && isSelected && !isCorrect
                    return (
                    <button
                      key={i}
                      type="button"
                      disabled={alreadyAnswered}
                      className={`group relative overflow-hidden rounded-2xl px-4 py-4 text-left text-sm font-bold transition-all duration-300 transform active:scale-95 ${alreadyAnswered ? 'scale-105 ring-2' : 'ring-1 ring-white/20'} ${alreadyAnswered ? (isCorrect ? 'ring-green-500 bg-[#58CC02] text-white' : isWrong ? 'ring-red-500 bg-red-500 text-white' : 'ring-white/20 bg-slate-800/50 opacity-50') : 'bg-slate-800 hover:bg-slate-700 hover:ring-white/40 hover:scale-[1.02]'}`}
                      onClick={() => {
                        if (!alreadyAnswered) {
                          (q as any)._selectedAnswer = i
                          submitAnswerGeneric(i)
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black transition-all duration-200 ${alreadyAnswered && isCorrect ? 'bg-white/30' : alreadyAnswered && isWrong ? 'bg-white/30' : 'bg-white/10 group-hover:bg-white/20'}`}>{['A', 'B', 'C', 'D'][i]}</span>
                        <span className="flex-1">{opt}</span>
                        {alreadyAnswered && isCorrect && <span className="text-xl">✓</span>}
                        {alreadyAnswered && isWrong && <span className="text-xl">✗</span>}
                      </div>
                    </button>
                  )})}
                </div>
              ) : qType === 'true_false' ? (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={alreadyAnswered}
                    className="rounded-2xl bg-slate-950/40 px-3 py-3 text-sm font-black ring-1 ring-white/10 hover:bg-slate-950/60 disabled:opacity-60"
                    onClick={() => answerTF(true)}
                  >
                    Verdadero
                  </button>
                  <button
                    type="button"
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
              ) : qType === 'match_pairs' ? (() => {
                  // Asignar colores por índice de par para que el par emparejado comparta color
                  const PAIR_COLORS = ['#7C4DFF', '#FF4B4B', '#4B9DFF', '#58CC02', '#FFB84B', '#FF69B4', '#00CED1', '#FF9600']
                  // Mapa inverso: right -> left, para encontrar qué left va con cada right ya emparejado
                  const rightToLeft: Record<string, string> = {}
                  for (const [left, right] of Object.entries(matchMap)) { rightToLeft[right] = left }
                  // Mapa left -> índice de color
                  const leftColorIdx: Record<string, number> = {}
                  matchPairs.forEach((p, i) => { leftColorIdx[p.left] = i })
                  return (
                <div className="mt-4 space-y-3">
                  <div className="text-xs text-slate-300/80">Toca un concepto (izquierda) y luego su pareja (derecha).</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      {matchPairs.map((p, i) => {
                        const isActive = matchLeft === p.left
                        const chosen = matchMap[p.left]
                        const colorIdx = leftColorIdx[p.left] ?? i
                        const pairColor = PAIR_COLORS[colorIdx % PAIR_COLORS.length]
                        return (
                          <button
                            key={i}
                            disabled={alreadyAnswered}
                            style={chosen ? { boxShadow: `0 0 0 2px ${pairColor}` } : {}}
                            className={`w-full rounded-2xl px-3 py-3 text-left text-sm font-black ring-1 ring-white/10 disabled:opacity-60 transition-all ${
                              isActive ? 'bg-[#7C4DFF]/40 ring-[#7C4DFF]' : chosen ? 'bg-slate-900/60' : 'bg-slate-950/40 hover:bg-slate-950/60'
                            }`}
                            onClick={() => {
                              if (alreadyAnswered) return
                              setMatchLeft(p.left)
                            }}
                          >
                            {p.left}
                            {chosen ? <div className="mt-1 text-xs font-bold" style={{color: pairColor}}>→ {chosen}</div> : null}
                          </button>
                        )
                      })}
                    </div>
                    <div className="space-y-2">
                      {matchRights.map((r, i) => {
                        const used = matchRightsUsed.has(i)
                        // Encontrar qué left está emparejado con este right
                        const pairedLeft = rightToLeft[r]
                        const colorIdx = pairedLeft ? (leftColorIdx[pairedLeft] ?? 0) : 0
                        const pairColor = PAIR_COLORS[colorIdx % PAIR_COLORS.length]
                        return (
                          <button
                            key={i}
                            disabled={alreadyAnswered || !matchLeft || used}
                            style={used && pairedLeft ? { boxShadow: `0 0 0 2px ${pairColor}`, borderColor: pairColor } : {}}
                            className={`w-full rounded-2xl px-3 py-3 text-left text-sm font-black ring-1 ring-white/10 disabled:opacity-50 transition-all ${
                              used ? 'ring-2' : 'bg-slate-950/40 hover:bg-slate-950/60'
                            }`}
                            onClick={() => {
                              if (alreadyAnswered) return
                              if (!matchLeft) return
                              setMatchMap((m) => ({ ...m, [matchLeft]: r }))
                              setMatchRightsUsed((s) => new Set(s).add(i))
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
                  )
                })() : (
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
                  {q && 'correctIndex' in q && 'options' in q && q.correctIndex !== undefined && (q.options as string[]) ? (
                    <div className="mt-2 rounded-lg bg-[#58CC02]/20 p-2 text-xs text-[#58CC02]">
                      ✓ Respuesta correcta: {(q.options as string[])[q.correctIndex as number]}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="mt-3 w-full rounded-xl bg-slate-800 px-3 py-2 font-semibold hover:bg-slate-700"
                    onClick={next}
                  >
                    Siguiente
                  </button>
                </div>
              ) : alreadyAnswered ? (
                <div className="mt-3 rounded-xl bg-slate-950/60 p-3 text-sm ring-1 ring-white/10">
                  <div className="font-semibold">✓ Ya respondiste esta pregunta</div>
                  {q && 'correctIndex' in q && 'options' in q && q.correctIndex !== undefined && (q.options as string[]) ? (
                    <div className="mt-2 rounded-lg bg-[#58CC02]/20 p-2 text-xs text-[#58CC02]">
                      Respuesta correcta: {(q.options as string[])[q.correctIndex as number]}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="mt-3 w-full rounded-xl bg-slate-800 px-3 py-2 font-semibold hover:bg-slate-700"
                    onClick={next}
                  >
                    Siguiente
                  </button>
                </div>
              ) : null}

              </div>
          ) : (
          /* ===== MODO INDIVIDUAL - World picker, Route map, Reto Diario (cuando NO estás jugando) ===== */
          <div className="rounded-3xl bg-black/25 p-4 ring-1 ring-white/10">
            {/* Reto Diario */}
            {!dailyChallenge ? (
              <button
                className="w-full rounded-3xl border-b-4 border-[#d07a00] bg-gradient-to-b from-[#FFC800] to-[#FF9600] p-4 text-left shadow-lg active:border-b-0 active:translate-y-1"
                onClick={async () => {
                  if (!user) return
                  const subjects = ['mat', 'esp', 'cien', 'hist', 'geo', 'civ']
                  const qs: any[] = []
                  for (const s of subjects) {
                    try {
                      const lessonId = `${s}-${Math.floor(Math.random() * 100) + 1}`
                      const lessonsQs = await listQuestions(lessonId)
                      if (lessonsQs.length) qs.push(lessonsQs[Math.floor(Math.random() * lessonsQs.length)])
                    } catch { /* skip */ }
                  }
                  setDailyChallenge({ questions: qs.slice(0, 3), idx: 0, lives: 3, completed: false, rewardClaimed: false, correctCount: 0 })
                  setDcAnswered(false); setDcFeedback(null); setDcSelected(null)
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black text-slate-900">🏆 RETO DIARIO</div>
                    <div className="mt-1 text-xs font-bold text-slate-800">3 preguntas · mín 2 correctas · XP</div>
                  </div>
                  <div className="text-3xl">🔥</div>
                </div>
              </button>
            ) : dailyChallenge.completed && !dailyChallenge.rewardClaimed ? (
              <div className="rounded-3xl border-b-4 border-[#58CC02] bg-gradient-to-b from-[#7DFE00] to-[#58CC02] p-4 text-center">
                <div className="text-base font-black text-slate-900">🎉 ¡Completado!</div>
                <div className="mt-1 text-xs font-bold text-slate-800">Bonus: +50 XP</div>
                <button
                  className="mt-2 w-full rounded-2xl bg-[#4AA000] py-2 text-sm font-black text-white"
                  onClick={async () => {
                    if (!user) return
                    await recordAttempt({
                      userId: user.id, lessonId: `daily-${new Date().toISOString().slice(0, 10)}`,
                      questionId: 'daily-challenge', answerRaw: 'completed', wasCorrect: true,
                      answeredCount: 5, correctCount: 5,
                    })
                    setDailyChallenge((d: any) => d ? { ...d, rewardClaimed: true } : d)
                  }}
                >
                  Reclamar Bonus
                </button>
              </div>
            ) : dailyChallenge.completed && dailyChallenge.rewardClaimed ? (
              <div className="rounded-3xl bg-[#58CC02]/20 p-4 text-center ring-1 ring-[#58CC02]">
                <div className="text-sm font-black text-[#58CC02]">✅ Reto Diario Completado</div>
                <div className="mt-1 text-xs text-slate-300">Mañana habrá uno nuevo</div>
              </div>
            ) : (
              <div className="rounded-3xl bg-slate-950/40 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-white">🏆 Reto Diario</div>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="text-lg">{i < dailyChallenge.lives ? '❤️' : '🖤'}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-300">Pregunta {dailyChallenge.idx + 1}/3</div>
                {dailyChallenge.questions[dailyChallenge.idx] ? (
                  <div className="mt-3">
                    <div className="text-sm font-bold text-white">{dailyChallenge.questions[dailyChallenge.idx].prompt || dailyChallenge.questions[dailyChallenge.idx].question}</div>
                    {dailyChallenge.questions[dailyChallenge.idx].options ? (
                      <div className="mt-2 grid grid-cols-1 gap-2">
                        {dailyChallenge.questions[dailyChallenge.idx].options.map((opt: string, oi: number) => {
                          let cls = 'bg-white/5 ring-1 ring-white/10 hover:bg-white/10'
                          if (dcAnswered) {
                            if (oi === dcFeedback?.correctIndex) cls = 'bg-[#58CC02]/30 ring-[#58CC02] text-[#58CC02]'
                            else if (oi === dcSelected && !dcFeedback?.correct) cls = 'bg-rose-500/20 ring-rose-500 text-rose-300'
                          }
                          return (
                            <button
                              key={oi}
                              className={`rounded-2xl border-b-4 px-4 py-3 text-left text-sm font-black transition-colors ${cls}`}
                              style={{ borderColor: dcAnswered && oi === dcFeedback?.correctIndex ? '#46A302' : dcAnswered && oi === dcSelected ? '#be123c' : '#374151' }}
                              onClick={() => {
                                if (dcAnswered) return
                                const correct = dailyChallenge.questions[dailyChallenge.idx].correctIndex
                                const correctIndex = typeof correct === 'number' ? correct : 0
                                setDcSelected(oi)
                                setDcFeedback({ correct: oi === correctIndex, correctIndex })
                                setDcAnswered(true)
                                if (oi === correctIndex) {
                                  setDailyChallenge((d: any) => ({ ...d, correctCount: (d.correctCount || 0) + 1 }))
                                } else {
                                  setDailyChallenge((d: any) => ({ ...d, lives: d.lives - 1 }))
                                }
                              }}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    ) : dailyChallenge.questions[dailyChallenge.idx].type === 'true_false' ? (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {[['Verdadero', true], ['Falso', false]].map(([label, val], oi) => {
                          const isSelected = dcSelected === oi
                          const isCorrect = dailyChallenge.questions[dailyChallenge.idx].answer === val
                          let cls = 'bg-white/5 ring-1 ring-white/10 hover:bg-white/10'
                          if (dcAnswered) {
                            if (isCorrect) cls = 'bg-[#58CC02]/30 ring-[#58CC02] text-[#58CC02]'
                            else if (isSelected && !isCorrect) cls = 'bg-rose-500/20 ring-rose-500 text-rose-300'
                          }
                          return (
                            <button
                              key={oi}
                              className={`rounded-2xl border-b-4 px-4 py-3 text-center text-sm font-black transition-colors ${cls}`}
                              style={{ borderColor: dcAnswered && isCorrect ? '#46A302' : dcAnswered && isSelected && !isCorrect ? '#be123c' : '#374151' }}
                              onClick={() => {
                                if (dcAnswered) return
                                const correctAnswer = dailyChallenge.questions[dailyChallenge.idx].answer
                                setDcSelected(oi)
                                setDcFeedback({ correct: val === correctAnswer, correctIndex: correctAnswer === true ? 0 : 1 })
                                setDcAnswered(true)
                                if (val === correctAnswer) {
                                  setDailyChallenge((d: any) => ({ ...d, correctCount: (d.correctCount || 0) + 1 }))
                                } else {
                                  setDailyChallenge((d: any) => ({ ...d, lives: d.lives - 1 }))
                                }
                              }}
                            >
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    ) : null}
                    {dcAnswered ? (
                      <button
                        className="mt-3 w-full rounded-2xl border-b-4 border-[#0e6e94] bg-gradient-to-b from-[#35C6FF] to-[#1CB0F6] py-3 text-sm font-black text-white active:border-b-0 active:translate-y-1"
                        onClick={() => {
                          const next = dailyChallenge.idx + 1
                          if (next >= 3 || dailyChallenge.lives <= 0) {
                            setDailyChallenge((d: any) => ({ ...d, completed: true }))
                          } else {
                            setDailyChallenge((d: any) => ({ ...d, idx: next }))
                            setDcAnswered(false); setDcFeedback(null); setDcSelected(null)
                          }
                        }}
                      >
                        Siguiente →
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-400">Cargando pregunta…</div>
                )}
                <button className="mt-2 text-xs text-slate-500 underline" onClick={() => { setDailyChallenge(null); setDcAnswered(false); setDcFeedback(null); setDcSelected(null) }}>
                  Salir del reto
                </button>
              </div>
            )}

            {/* World picker */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {subjectGroups.filter((g) => g.subject !== 'gen').map((g) => {
                const active = world === g.subject
                return (
                  <button
                    key={g.subject}
                    className={`rounded-3xl bg-slate-950/40 p-4 text-left ring-1 ring-white/10 hover:bg-slate-950/60 ${active ? 'outline outline-2 outline-[#1CB0F6]' : ''}`}
                    onClick={() => {
                      setWorld(g.subject)
                      setRoutePage(0)
                      setLessonId(g.lessons[0]?.id || '')
                      // Scroll to route map after a brief delay
                      setTimeout(() => {
                        document.getElementById('route-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }, 100)
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
              {/* Mundo Sorpresa - Portal aleatorio */}
              <button
                className="rounded-3xl bg-gradient-to-br from-[#7C4DFF] via-[#1CB0F6] to-[#FFC800] p-4 text-left ring-1 ring-white/20 hover:opacity-90"
                onClick={() => {
                  const picked = pickRandomUnlockedLesson()
                  if (!picked) {
                    setError('Completa al menos una lección para desbloquear el Mundo Sorpresa')
                    return
                  }
                  setPortalOpen(true)
                  setTimeout(() => {
                    setPortalOpen(false)
                    setWorld(String(picked.subject || 'esp'))
                    setLessonId(picked.id)
                    setTab('play')
                    setFeedback(null)
                    setError(null)
                    setStatus(null)
                  }, 650)
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/80">Portal</div>
                  <div className="rounded-2xl bg-black/30 px-2 py-1 text-lg">🌀</div>
                </div>
                <div className="mt-2 text-base font-extrabold text-white">Mundo Sorpresa</div>
                <div className="mt-2 text-xs text-white/70">Misión aleatoria</div>
              </button>
            </div>

            {/* Route map */}
            {world ? (
              <div id="route-map" className="mt-6 rounded-3xl bg-slate-950/30 p-4 ring-1 ring-white/10">
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
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => (
                    <button
                      key={p}
                      className={`rounded-xl px-3 py-2 text-xs font-black ring-1 ring-white/10 ${routePage === p ? 'bg-[#1CB0F6]/70' : 'bg-slate-950/30 hover:bg-slate-950/50'}`}
                      onClick={() => setRoutePage(p)}
                    >
                      {p * 10 + 1}-{Math.min(p * 10 + 10, 100)}
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
          )
        ) : tab === 'battle' ? (
          <div className="rounded-3xl bg-black/25 p-4 ring-1 ring-white/10">
            {/* Battle config modal */}
            {/* ===== Estructura de batalla:
                 - battleRoom && battleRoom.status === 'started' → quiz activo
                 - battleRoom && battleRoom.status === 'open' → esperando jugadores
                 - sin battleRoom → menú de crear/unirse
            ===== */}
            {battleRoom && battleRoom.status === 'started' ? (
              <div className="rounded-3xl bg-slate-950/40 p-4 ring-1 ring-white/10">
                {/* Header: Timer + Subject + HURRY UP warning */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-bold text-slate-300/80">⏱️</div>
                    <div className={`text-2xl font-black transition-colors duration-300 ${battleTimer <= 10 ? 'timer-warning text-lg' : battleTimer <= 30 ? 'text-rose-400' : 'text-white'}`}>
                      {Math.floor(battleTimer / 60)}:{(battleTimer % 60).toString().padStart(2, '0')}
                    </div>
                    {battleTimer <= 10 && battleTimer > 0 && !battleAnswered && (
                      <div className="countdown-pulse rounded-full bg-rose-500/30 px-2 py-0.5 text-[10px] font-black text-rose-300">
                        ⚡ ¡APÚRATE!
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-300/80">
                    🏁 <span className="font-black text-white">{battleRoom.missionId || subjectTitle(battleRoom.subject || 'esp')}</span>
                  </div>
                </div>
                
                {/* 🏎️ MARIO KART LIVE RANKING PODIUM */}
                <div className="mt-4 space-y-2">
                  {(() => {
                    const teamColors: Record<string, string> = { A: '#FF4B4B', B: '#4B9DFF', C: '#4BFF7A', D: '#FFB84B' }
                    const teamNames: Record<string, string> = { A: 'Rojos 🔴', B: 'Azules 🔵', C: 'Verdes 🟢', D: 'Naranjas 🟠' }
                    const rankEmojis = ['🥇', '🥈', '🥉', '4️⃣']
                    // Build ranked teams array
                    const ranked = ['A', 'B', 'C', 'D'].slice(0, battleRoom.teamCount || 2).map(teamKey => {
                      const teamData = (battleRoom.teams as any)?.[teamKey]
                      const teamScore = Object.entries(battleRoom.scores || {}).reduce((acc: number, [uid, s]: any) => acc + (teamData?.members?.includes(uid) ? ((s as any).correct || 0) : 0), 0)
                      return { key: teamKey, data: teamData, score: teamScore }
                    }).sort((a, b) => b.score - a.score)
                    const maxScore = Math.max(ranked[0]?.score || 1, 1)
                    return ranked.map((team, ri) => {
                      const isFirst = ri === 0
                      const isMyTeam = team.data?.members?.includes(user?.id)
                      const members = (team.data?.members || []) as string[]
                      const bgClass = isFirst
                        ? 'bg-gradient-to-r from-[#FFD700]/20 via-[#FFA500]/15 to-[#FFD700]/20 ring-2 ring-[#FFD700]/50'
                        : ri === 1
                          ? 'bg-gradient-to-r from-[#C0C0C0]/10 to-[#A8A8A8]/10 ring-1 ring-[#C0C0C0]/40'
                          : ri === 2
                            ? 'bg-gradient-to-r from-[#CD7F32]/10 to-[#8B4513]/10 ring-1 ring-[#CD7F32]/30'
                            : 'bg-white/5 ring-1 ring-white/10'
                      return (
                        <div key={team.key} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-500 ${bgClass} ${isMyTeam ? 'ring-2 ring-white/40' : ''}`} style={isFirst ? {boxShadow: '0 0 30px rgba(255,215,0,0.15)'} : {}}>
                          {/* Race position */}
                          <div className={`text-xl font-black w-8 text-center ${isFirst ? 'scale-125' : ''}`}>
                            {rankEmojis[ri]}
                          </div>
                          {/* Team name + members */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-xs font-black text-white truncate" style={{color: teamColors[team.key]}}>
                                {teamNames[team.key] || `Equipo ${team.key}`}
                              </div>
                              {isMyTeam && <span className="text-[10px] bg-white/20 rounded-full px-1.5 py-0.5 text-white/80">TÚ</span>}
                            </div>
                            {/* Member avatars */}
                            <div className="flex -space-x-1.5 mt-0.5">
                              {members.slice(0, 5).map((mid: string, mi: number) => {
                                const info = friendInfo[mid]
                                return (
                                  <span key={mid} className={`rounded-full bg-slate-800 p-0.5 text-sm ring-1 ring-slate-900 ${isFirst && mi === 0 ? 'team-avatar-bounce' : ''}`}>
                                    {info?.avatar || '👤'}
                                  </span>
                                )
                              })}
                              {members.length > 5 && <span className="text-[10px] text-slate-400 self-center ml-1">+{members.length - 5}</span>}
                            </div>
                          </div>
                          {/* Score with animated bar */}
                          <div className="text-right min-w-[54px]">
                            <div className={`text-xl font-black ${isFirst ? 'text-[#FFD700]' : 'text-white'}`}>
                              {team.score}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase">pts</div>
                            {/* Score progress bar */}
                            <div className="mt-0.5 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div 
                                className="score-bar h-full rounded-full transition-all duration-700"
                                style={{
                                  '--score-width': `${(team.score / maxScore) * 100}%`,
                                  backgroundColor: teamColors[team.key],
                                  width: `${(team.score / maxScore) * 100}%`
                                } as React.CSSProperties}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
                {bq ? (
                  <div className="mt-4">
                    {battleSuddenDeathActive ? (
                      <div className="mb-3 rounded-xl bg-rose-500/20 px-3 py-2 text-center ring-1 ring-rose-500">
                        <div className="text-sm font-black text-rose-300">⚡ MUERTE SÚBITA</div>
                        <div className="text-xs text-rose-200">¡El primero en responder correctamente gana!</div>
                      </div>
                    ) : null}
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-300/80">Pregunta {battleIdx + 1}/{battleQuestions.length || '?'}</div>
                      <div className="rounded-xl bg-[#1CB0F6]/20 px-3 py-1 text-sm font-black text-[#1CB0F6]">
                        ⏱️ {battleTimerSeconds}s
                      </div>
                    </div>
                    <div className="mb-4 rounded-2xl bg-white/5 px-4 py-4 text-center text-sm font-black text-white ring-1 ring-white/10">
                      {bq.question || bq.prompt || '¿?'}
                    </div>
                    {bq.type === 'multiple_choice' && Array.isArray(bq.options) ? (
                      <div className="grid grid-cols-1 gap-2">
                        {bq.options.map((opt: string, idx: number) => {
                          // Get avatars of team members who voted for this option
                          const voters = Object.entries(battleVotes)
                            .filter(([, v]) => v.option === idx)
                            .map(([uid]) => {
                              const memberInfo = friendInfo[uid]
                              return memberInfo?.avatar || '👤'
                            })
                          let cls = 'bg-white/5 ring-1 ring-white/10 hover:bg-white/10'
                          // Highlight user's selected option
                          if (myBattleVote === idx && !battleAnswered) cls = 'bg-[#1CB0F6]/30 ring-2 ring-[#1CB0F6] text-white'
                          // Show correct/incorrect after answer
                          if (battleAnswered && battleFeedback) {
                            if (idx === battleFeedback.correct) cls = 'bg-[#58CC02]/30 ring-[#58CC02] text-white'
                            else if (battleFeedback.selected !== undefined && idx === battleFeedback.selected && !battleFeedback.ok) cls = 'bg-rose-500/20 ring-rose-500 text-rose-300'
                          }
                          return (
                            <div key={idx} className="relative">
                              {voters.length > 0 && (
                                <div className="mb-1 flex -space-x-1">
                                  {voters.slice(0, 4).map((av, i) => (
                                    <span key={i} className="rounded-full bg-slate-800 p-1 text-lg ring-2 ring-slate-900">{av}</span>
                                  ))}
                                  {voters.length > 4 && <span className="rounded-full bg-slate-700 px-2 text-xs font-bold text-white">+{voters.length - 4}</span>}
                                </div>
                              )}
                              <button 
                                className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-black transition-all duration-150 active:scale-95 ${cls} ${!battleConfirmed ? 'hover:bg-white/10 cursor-pointer' : 'cursor-not-allowed'}`} 
                                onPointerUp={() => { if (!battleConfirmed) submitBattleVote(idx) }} 
                                disabled={battleConfirmed}>
                                <span className="mr-2 text-xs opacity-60">{['A', 'B', 'C', 'D'][idx]}</span>{opt}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ) : <div className="text-center text-xs text-slate-400">{bq.type || 'cargando...'}</div>}
                    {!battleConfirmed && !battleAnswered && (
                      <>
                        {isTeamLeader ? (
                          <button className="mt-3 w-full rounded-2xl border-b-4 border-[#0e6e94] bg-gradient-to-b from-[#35C6FF] to-[#1CB0F6] py-3 text-sm font-black text-white active:border-b-0 active:translate-y-1" onClick={confirmBattleAnswer}>
                            👑 Confirmar respuesta del equipo
                          </button>
                        ) : (
                          <div className="mt-3 rounded-xl bg-slate-800/50 p-3 text-center">
                            <div className="text-xs text-slate-400">Tu líder debe confirmar la respuesta</div>
                            <div className="mt-1 text-xs text-slate-500">Los votos se mostrarán arriba</div>
                          </div>
                        )}
                      </>
                    )}
                    {showQuestionResults && battleFeedback && (
                      <div className="mt-4 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 p-4 ring-1 ring-white/10 backdrop-blur">
                        <div className="text-center">
                          {/* Dramatic result icon with animation */}
                          <div className={`text-5xl mb-1 ${battleFeedback.ok ? 'animate-bounce' : 'incorrect-answer'}`}>
                            {battleFeedback.ok ? '🌟' : '💥'}
                          </div>
                          <div className={`text-xl font-black ${battleFeedback.ok ? 'text-[#FFD700]' : 'text-rose-400'}`} style={battleFeedback.ok ? {textShadow: '0 0 15px rgba(255,215,0,0.6)'} : {}}>
                            {battleFeedback.ok ? '⭐ ¡CORRECTO! +1' : '❌ ¡INCORRECTO!'}
                          </div>
                          {/* Floating +1 star effect for correct answers */}
                          {battleFeedback.ok && (
                            <div className="flex justify-center gap-1 mt-1">
                              {[...Array(3)].map((_, i) => (
                                <span key={i} className="text-lg score-increment" style={{animationDelay: `${i * 0.15}s`}}>⭐</span>
                              ))}
                            </div>
                          )}
                          <div className="mt-2 text-xs text-slate-300">
                            Respuesta correcta: <span className="font-bold text-[#58CC02]">{['A', 'B', 'C', 'D'][battleFeedback.correct]} - {bq.options?.[battleFeedback.correct]}</span>
                          </div>
                          {Object.keys(battleVotes).length > 1 && (
                            <div className="mt-3 rounded-xl bg-slate-950/60 p-2">
                              <div className="text-[10px] text-slate-400 mb-1.5">Votos del equipo:</div>
                              <div className="flex flex-wrap justify-center gap-2">
                                {Object.entries(battleVotes).map(([uid, v]) => {
                                  const info = friendInfo[uid]
                                  const isCorrect = v.option === battleFeedback.correct
                                  return (
                                    <div key={uid} className={`flex items-center gap-1 rounded-full px-2 py-1 ${isCorrect ? 'bg-[#58CC02]/20 ring-1 ring-[#58CC02]' : 'bg-rose-500/20 ring-1 ring-rose-500'}`}>
                                      <span>{info?.avatar || '👤'}</span>
                                      <span className="text-[10px]">{['A', 'B', 'C', 'D'][v.option]}</span>
                                      <span className="text-[10px]">{isCorrect ? '✓' : '✗'}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {showQuestionResults && battleFeedback && !battleSuddenDeathActive && (
                      <button className="mt-3 w-full rounded-2xl bg-[#1CB0F6] py-3 text-sm font-black text-white" onClick={() => {
                        if (battleIdx + 1 >= (battleQuestions.length || 0)) {
                          // Calculate and show results with dramatic finish
                          const results = calculateBattleResults()
                          setBattleFinalResults(results)
                          setShowBattleResults(true)
                          finishBattle({ roomId: battleRoomId, winnerTeamId: results?.teams[0]?.id || 'A' }).catch(() => {})
                        } else {
                          // 🏎️ MARIO KART TRANSITION: 3s countdown before next question
                          setBattleStatus('countdown')
                          setBattleCountdown(3)
                          let cd = 3
                          const iv = setInterval(() => {
                            cd--
                            setBattleCountdown(cd)
                            if (cd <= 0) {
                              clearInterval(iv)
                              setBattleCountdown(null)
                              setBattleStatus('match')
                              setBattleIdx(battleIdx + 1)
                              setBattleAnswered(false)
                              setBattleFeedback(null)
                              setShowQuestionResults(false)
                              setBattleConfirmed(false)
                              setBattleVotes({})
                              setMyBattleVote(null)
                            }
                          }, 1000)
                        }
                      }}>
                        {battleIdx + 1 >= (battleQuestions.length || 0) ? '🏆 Ver Resultados Finales' : '🏁 Siguiente Pregunta'}
                      </button>
                    )}
                    {/* 🏎️ Transition countdown screen */}
                    {battleStatus === 'countdown' && battleCountdown !== null && battleCountdown > 0 && (
                      <div className="mt-4 rounded-2xl bg-gradient-to-b from-[#1a1a2e] to-[#16213e] p-6 ring-2 ring-[#FFD700]/30 text-center">
                        <div className="text-sm text-slate-400 mb-2">🏁 Preparando siguiente pregunta...</div>
                        <div className="countdown-burst text-6xl font-black text-[#FFD700]" style={{textShadow: '0 0 30px rgba(255,215,0,0.8)'}}>
                          {battleCountdown}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">¡Prepárate!</div>
                        {/* Mini ranking during transition */}
                        <div className="mt-3 flex justify-center gap-4 text-xs text-slate-400">
                          {(() => {
                            const ranked = ['A', 'B', 'C', 'D'].slice(0, battleRoom.teamCount || 2).map(teamKey => {
                              const teamData = (battleRoom.teams as any)?.[teamKey]
                              const teamScore = Object.entries(battleRoom.scores || {}).reduce((acc: number, [uid, s]: any) => acc + (teamData?.members?.includes(uid) ? ((s as any).correct || 0) : 0), 0)
                              return { key: teamKey, score: teamScore }
                            }).sort((a, b) => b.score - a.score)
                            return ranked.slice(0, 3).map((t, i) => (
                              <span key={t.key}>{['🥇','🥈','🥉'][i]} {t.score}pts</span>
                            ))
                          })()}
                        </div>
                      </div>
                    )}
                    {showBattleResults && battleFinalResults && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 overflow-hidden">
                        {/* Mario Kart style confetti - more dramatic */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          {[...Array(40)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute"
                              style={{
                                left: `${Math.random() * 100}%`,
                                top: `-5%`,
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${2 + Math.random() * 2}s`,
                              }}
                            >
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{
                                  backgroundColor: ['#FFD700', '#1CB0F6', '#58CC02', '#FF4D4D', '#7C4DFF', '#FF69B4', '#00CED1', '#FF6347'][i % 8],
                                  animation: `confetti-fall ${2 + Math.random() * 2}s ease-in forwards`,
                                  animationDelay: `${Math.random() * 3}s`,
                                }}
                              />
                            </div>
                          ))}
                          {/* Stars burst for winner */}
                          {battleFinalResults.teams[0] && (
                            <>
                              {[...Array(8)].map((_, i) => (
                                <div
                                  key={`star-${i}`}
                                  className="absolute text-4xl"
                                  style={{
                                    left: `${20 + i * 10}%`,
                                    top: '30%',
                                    animation: 'star-burst 1s ease-out forwards',
                                    animationDelay: `${0.5 + i * 0.1}s`,
                                    opacity: 0,
                                  }}
                                >
                                  ⭐
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                        
                        <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1a1a2e] to-[#16213e] p-6 ring-2 ring-white/20 shadow-2xl shadow-[#FFD700]/20">
                          <div className="text-center">
                            {/* Animated crown for winner - Mario Kart style */}
                            {battleFinalResults.teams[0] && (
                              <div className="winner-crown text-7xl mb-1">👑</div>
                            )}
                            <div className="text-2xl font-black text-white mb-4 tracking-wide">
                              {battleFinalResults.hasTie ? '⚡ ¡EMPATE!' : '🏆 ¡Fin de la Batalla!'}
                            </div>
                            
                            {/* Animated ranking - Mario Kart podium style */}
                            <div className="mt-6 space-y-3">
                              {battleFinalResults.teams.map((team: { id: string; name: string; score: number; members: { id: string; avatar: string; displayName: string }[] }, idx: number) => {
                                const rankClass = idx === 0 ? 'rank-animation-1' : idx === 1 ? 'rank-animation-2' : idx === 2 ? 'rank-animation-3' : 'rank-animation-4'
                                const maxScore = battleFinalResults.teams[0]?.score || 1
                                const barPercent = maxScore > 0 ? (team.score / maxScore) * 100 : 0
                                const bgClass = idx === 0 
                                  ? 'bg-gradient-to-r from-[#FFD700]/40 via-[#FFA500]/30 to-[#FFD700]/40 ring-2 ring-[#FFD700] podium-spotlight' 
                                  : idx === 1 
                                    ? 'bg-gradient-to-r from-[#C0C0C0]/20 to-[#A8A8A8]/20 ring-2 ring-[#C0C0C0]' 
                                    : idx === 2 
                                      ? 'bg-gradient-to-r from-[#CD7F32]/20 to-[#8B4513]/20 ring-2 ring-[#CD7F32]' 
                                      : 'bg-white/5 ring-1 ring-white/10'
                                
                                return (
                                  <div
                                    key={team.id}
                                    className={`relative flex items-center gap-3 rounded-2xl p-4 ${bgClass} ${rankClass}`}
                                  >
                                    {/* Rank position with dramatic styling */}
                                    <div className="relative">
                                      <div className={`text-5xl ${idx === 0 ? 'animate-bounce' : ''}`}>
                                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎖️'}
                                      </div>
                                      {idx === 0 && (
                                        <div className="absolute -top-1 -right-1 text-xs bg-[#FFD700] text-black rounded-full w-5 h-5 flex items-center justify-center font-black">
                                          1
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Team info with color accent + animated score bar */}
                                    <div className="flex-1 min-w-0">
                                      <div 
                                        className="font-black text-white text-lg truncate"
                                        style={{ textShadow: idx === 0 ? '0 0 10px rgba(255,215,0,0.5)' : 'none' }}
                                      >
                                        {team.name}
                                      </div>
                                      {/* Animated score comparison bar */}
                                      <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800 overflow-hidden ring-1 ring-white/5">
                                        <div 
                                          className="score-bar h-full rounded-full"
                                          style={{ 
                                            width: `${barPercent}%`,
                                            backgroundColor: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#7C4DFF'
                                          }}
                                        />
                                      </div>
                                      <div className="flex -space-x-2 mt-1.5">
                                        {team.members.slice(0, 4).map((m: { id: string; avatar: string; displayName: string }, mi: number) => (
                                          <span 
                                            key={m.id} 
                                            className={`rounded-full bg-slate-800 p-1.5 text-lg ring-2 ring-slate-900 ${idx === 0 && mi === 0 ? 'team-avatar-bounce' : ''}`}
                                            style={{ animationDelay: `${mi * 0.1}s` }}
                                          >
                                            {m.avatar}
                                          </span>
                                        ))}
                                        {team.members.length > 4 && (
                                          <span className="rounded-full bg-slate-700 px-2 text-xs font-bold text-white flex items-center">
                                            +{team.members.length - 4}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Score with pop animation for winner */}
                                    <div className="text-right">
                                      <div 
                                        className={`text-4xl font-black ${idx === 0 ? 'text-[#FFD700]' : 'text-white'}`}
                                        style={{ textShadow: idx === 0 ? '0 0 20px rgba(255,215,0,0.8)' : 'none' }}
                                      >
                                        {team.score}
                                      </div>
                                      <div className="text-xs text-slate-400 uppercase tracking-wider">pts</div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-3">
                              <button
                                className="rounded-2xl border-b-4 border-[#0e6e94] bg-gradient-to-b from-[#35C6FF] to-[#1CB0F6] py-3 text-sm font-black text-white active:border-b-0 active:translate-y-1"
                                onClick={async () => {
                                  if (user && battleRoom) {
                                    setShowBattleResults(false)
                                    setBattleFinalResults(null)
                                    setBattleIdx(0)
                                    setBattleAnswered(false)
                                    setBattleFeedback(null)
    setShowQuestionResults(false)
                                    setBattleConfirmed(false)
                                    setBattleVotes({})
    setMyBattleVote(null)
                                    setBattleQuestions([])
                                    setBattleStatus('countdown')
                                    const subject = battleRoom.subject || 'esp'
                                    const teamCount = battleRoom.teamCount || 2
                                    const maxPerTeam = battleRoom.maxPerTeam || 1
                                    const timerSeconds = battleRoom.timerSeconds || 120
                                    const questionCount = battleRoom.questionCount || 10
                                    const suddenDeath = battleRoom.suddenDeath || false
                                    const r = await createBattleRoom({ userId: user.id, teamId: user.teamId || 'belas', subject, maxPerTeam, teamCount, timerSeconds, questionCount, suddenDeath, visibility: 'open' })
                                    setBattleRoomId(r.id)
                                    ;(window as any).__tv_unsubBattle?.()
                                    ;(window as any).__tv_unsubBattle = subscribeBattleRoom(r.id, (rr) => setBattleRoom(rr))
                                  }
                                }}
                              >
                                🔄 Revancha
                              </button>
                              <button
                                className="rounded-2xl bg-slate-800 py-3 text-sm font-black text-white ring-1 ring-white/10 hover:bg-slate-700"
                                onClick={() => {
                                  setBattleRoomId('')
                                  setBattleRoom(null)
                                  setBattleQuestions([])
                                  setBattleStatus('countdown')
                                  setShowBattleResults(false)
                                  setBattleFinalResults(null)
                                  setTab('home')
                                }}
                              >
                                🌍 Otro Mundo
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {battleSuddenDeathWinner && (
                      <div className="mt-3 rounded-xl bg-[#58CC02]/20 px-3 py-3 text-center ring-1 ring-[#58CC02]">
                        <div className="text-sm font-black text-[#58CC02]">🏆 ¡GANASTE!</div>
                        <div className="text-xs text-white/80">Respondiste correctamente primero</div>
                      </div>
                    )}
                  </div>
                ) : <div className="mt-4 text-center text-sm text-slate-400">Cargando preguntas...</div>}
                <button className="mt-4 w-full rounded-2xl bg-rose-500/80 py-2 text-xs font-black text-white" onClick={() => {
                  setBattleRoomId(''); setBattleRoom(null); setBattleQuestions([]); setBattleStatus('countdown')
                  ;(window as any).__tv_unsubBattle?.(); (window as any).__tv_unsubBattleMsgs?.()
                }}>Salir de la batalla</button>
              </div>
            ) : showBattleConfig ? (
              <div className="mb-4 rounded-3xl bg-slate-900/80 p-5 ring-1 ring-white/20">
                <div className="text-center text-base font-black uppercase tracking-widest text-white">Configurar Batalla</div>

                <div className="mt-4">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300/80">Materia</div>
                  <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {[
                      { key: 'esp', label: 'Español', emoji: '📘' },
                      { key: 'mat', label: 'Matemáticas', emoji: '🧮' },
                      { key: 'cien', label: 'Ciencias', emoji: '🧪' },
                      { key: 'hist', label: 'Historia', emoji: '🏛️' },
                      { key: 'geo', label: 'Geografía', emoji: '🌎' },
                      { key: 'civ', label: 'Cívica', emoji: '⚖️' },
                      { key: 'mixed', label: 'Mixto', emoji: '🎲' },
                    ].map(({ key, label, emoji }) => (
                      <button
                        key={key}
                        className={`flex flex-col items-center rounded-2xl p-2 text-xs font-black ring-1 transition-colors ${battleSubject === key ? 'bg-[#1CB0F6]/30 ring-[#1CB0F6] text-white' : 'bg-white/5 ring-white/10 text-slate-300 hover:bg-white/10'}`}
                        onClick={() => setBattleSubject(key)}
                      >
                        <span className="text-lg">{emoji}</span>
                        <span className="mt-0.5 text-center leading-tight">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300/80">Número de equipos</div>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {[2, 3, 4].map((n) => (
                      <button
                        key={n}
                        className={`rounded-xl py-2 text-xs font-black ring-1 transition-colors ${battleTeamCount === n ? 'bg-[#7C4DFF]/30 ring-[#7C4DFF] text-white' : 'bg-white/5 ring-white/10 text-slate-300 hover:bg-white/10'}`}
                        onClick={() => setBattleTeamCount(n)}
                      >
                        {n} Equipos
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300/80">Jugadores por equipo</div>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((size) => (
                      <button
                        key={size}
                        className={`rounded-xl py-2 text-xs font-black ring-1 transition-colors ${battleSize === size ? 'bg-[#58CC02]/30 ring-[#58CC02] text-white' : 'bg-white/5 ring-white/10 text-slate-300 hover:bg-white/10'}`}
                        onClick={() => setBattleSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300/80">Tiempo por pregunta</div>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {[30, 60, 90, 120].map((t) => (
                      <button
                        key={t}
                        className={`rounded-xl py-2 text-xs font-black ring-1 transition-colors ${battleTimerConfig === t ? 'bg-[#FFC800]/30 ring-[#FFC800] text-white' : 'bg-white/5 ring-white/10 text-slate-300 hover:bg-white/10'}`}
                        onClick={() => setBattleTimerConfig(t)}
                      >
                        {t}s
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300/80">Preguntas (múltiplos de 2)</div>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {[4, 6, 8, 10, 12, 14, 16, 20].map((n) => (
                      <button
                        key={n}
                        className={`rounded-xl py-2 text-xs font-black ring-1 transition-colors ${battleQuestionCount === n ? 'bg-[#FFC800]/30 ring-[#FFC800] text-white' : 'bg-white/5 ring-white/10 text-slate-300 hover:bg-white/10'}`}
                        onClick={() => setBattleQuestionCount(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 rounded-xl bg-black/20 p-3">
                  <input
                    type="checkbox"
                    id="suddenDeath"
                    checked={battleSuddenDeath}
                    onChange={(e) => setBattleSuddenDeath(e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  <label htmlFor="suddenDeath" className="text-xs font-bold text-slate-200">
                    ⚡ Pregunta decisiva (desempate): el primero en responder correctamente gana
                  </label>
                </div>

                <button
                  className="mt-5 w-full rounded-2xl border-b-4 border-[#0e6e94] bg-gradient-to-b from-[#35C6FF] to-[#1CB0F6] py-4 text-sm font-black uppercase tracking-widest text-white active:border-b-0 active:translate-y-1"
                  onClick={async () => {
                    if (!user) return
                    setShowBattleConfig(false)
                    const subject = battleSubject || 'esp'
                    const maxPerTeam = battleSize || 1
                    const teamCount = battleTeamCount || 2
                    const timerSeconds = battleTimerConfig || 120
                    const questionCount = battleQuestionCount || 10
                    const suddenDeath = battleSuddenDeath
                    console.log('[BATALLA] Creando batalla:', { subject, maxPerTeam, teamCount, timerSeconds, questionCount, suddenDeath, visibility: pendingBattleVisibility })
                    try {
                      const r = await createBattleRoom({ 
                        userId: user.id, 
                        teamId: user.teamId || 'belas', 
                        subject, 
                        maxPerTeam, 
                        teamCount,
                        timerSeconds,
                        questionCount,
                        suddenDeath,
                        visibility: pendingBattleVisibility 
                      })
                      console.log('[BATALLA] Sala creada:', r.id, 'teamCount:', r.teamCount)
                      setBattleRoomId(r.id)
                      ;(window as any).__tv_unsubBattle?.()
                      ;(window as any).__tv_unsubBattle = subscribeBattleRoom(r.id, (rr) => setBattleRoom(rr))
                      ;(window as any).__tv_unsubBattleMsgs?.()
                      ;(window as any).__tv_unsubBattleMsgs = subscribeBattleMessages(r.id, { kind: 'global' }, (m: any) => setBattleMsgs(m))
                    } catch (err) {
                      console.error('Error creando batalla:', err)
                      const msg = err instanceof Error ? err.message : String(err)
                      setError(`Error: ${msg}`)
                    }
                  }}
                >
                  🚀 Crear Batalla
                </button>
                <button
                  className="mt-2 w-full rounded-2xl bg-slate-800 py-2 text-xs font-bold text-slate-400 ring-1 ring-white/10 hover:bg-slate-700"
                  onClick={() => setShowBattleConfig(false)}
                >
                  Cancelar
                </button>
              </div>
            ) : null}

            {/* Menú de Batallas - oculto durante batalla activa (started) */}
            <div className={battleRoom?.status === 'started' ? 'hidden' : ''}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-lg font-extrabold">Batallas</div>
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
                  Salas Abiertas
                </button>
                <button className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-black hover:bg-slate-700" onClick={() => setTab('mode')}>
                  Volver
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="rounded-3xl bg-slate-950/30 p-4 ring-1 ring-white/10">
                <div className="text-sm font-extrabold">Salas abiertas</div>
                <div className="mt-1 text-xs text-slate-300/80">Únete a una sala abierta o crea una nueva.</div>

                <div className="mt-3 space-y-2">
                  {openRooms.map((r: any) => {
                    const teamCount = r.teamCount || 2
                    const maxPerTeam = r.maxPerTeam || 1
                    const totalPlayers = ['A', 'B', 'C', 'D'].slice(0, teamCount).reduce((acc: number, key: string) => acc + ((r.teams as any)?.[key]?.members?.length || 0), 0)
                    const maxPlayers = teamCount * maxPerTeam
                    const isMyRoom = user?.id === r.hostUserId
                    return (
                    <div key={r.id} className="rounded-2xl bg-black/30 p-3 ring-1 ring-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-bold">{subjectTitle(r.subject || 'esp')}</div>
                          <div className="text-xs text-slate-300/70">
                            {teamCount} equipos · {maxPerTeam}vs{maxPerTeam} · {r.timerSeconds || 120}s/preg · {r.questionCount || 10} preguntas
                          </div>
                          <div className="text-xs text-slate-400">
                            {totalPlayers}/{maxPlayers} jugadores
                          </div>
                        </div>
                        <button
                          className="rounded-xl bg-[#1CB0F6] px-4 py-2 text-sm font-bold text-white active:scale-95"
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
                          {isMyRoom ? ' Entrar' : 'Unirse'}
                        </button>
                      </div>
                      {isMyRoom ? (
                        <button
                          className="mt-2 w-full rounded-xl bg-red-500/20 py-1 text-xs text-red-300 hover:bg-red-500/40"
                          onClick={async () => {
                            if (confirm('¿Eliminar esta sala?')) {
                              try {
                                await cancelBattleRoom({ roomId: r.id })
                                setOpenRooms((prev) => prev.filter((room) => room.id !== r.id))
                              } catch (err) {
                                console.error('Error eliminando sala:', err)
                                setError('Error al eliminar la sala')
                              }
                            }
                          }}
                        >
                          🗑️ Eliminar mi sala
                        </button>
                      ) : null}
                    </div>
                  )})}
                  {!openRooms.length ? <div className="text-xs text-slate-300/70">No hay salas abiertas ahora.</div> : null}
                </div>
              </div>
            </div>

            {!battleRoom && !showBattleConfig ? (
              /* ===== MENÚ DE BATALLA - Solo cuando NO hay batalla activa ===== */
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    className="rounded-3xl border-b-4 border-[#1899D6] bg-gradient-to-b from-[#35C6FF] to-[#1CB0F6] p-4 text-left font-black text-white active:border-b-0 active:translate-y-1"
                    onClick={() => { if (!user) return; setPendingBattleVisibility('open'); setShowBattleConfig(true) }}
                  >
                    Crear batalla abierta
                    <div className="mt-1 text-xs opacity-90">Aparece en Lobby</div>
                  </button>

                  <button
                    className="rounded-3xl border-b-4 border-[#5a35c7] bg-gradient-to-b from-[#7C4DFF] to-[#1CB0F6] p-4 text-left font-black text-white active:border-b-0 active:translate-y-1"
                    onClick={() => { if (!user) return; setPendingBattleVisibility('private'); setShowBattleConfig(true) }}
                  >
                    Crear batalla privada
                    <div className="mt-1 text-xs opacity-90">Solo con código</div>
                  </button>
                </div>

                <div className="rounded-3xl bg-slate-950/30 p-4 ring-1 ring-white/10">
                  <div className="text-sm font-extrabold">Unirme con código (batalla privada)</div>
                  <div className="mt-2 flex gap-2">
                    <input
                      className="flex-1 min-w-0 rounded-2xl bg-slate-950/60 px-3 py-3 text-sm font-black ring-1 ring-white/10"
                      value={battleRoomId}
                      onChange={(e) => setBattleRoomId(e.target.value.trim())}
                      placeholder="Código de sala"
                    />
                    <button
                      className="shrink-0 rounded-2xl bg-[#FFC800] px-4 py-3 text-sm font-black text-slate-900"
                      onClick={async () => {
                        if (!user) return
                        if (!battleRoomId) return
                        try {
                          await joinBattleRoom({ roomId: battleRoomId, userId: user.id, teamId: user.teamId || 'belas' })
                          ;(window as any).__tv_unsubBattle?.()
                          ;(window as any).__tv_unsubBattle = subscribeBattleRoom(battleRoomId, (rr) => setBattleRoom(rr))
                          ;(window as any).__tv_unsubBattleMsgs?.()
                          ;(window as any).__tv_unsubBattleMsgs = subscribeBattleMessages(battleRoomId, { kind: 'global' }, (m: any) => setBattleMsgs(m))
                        } catch (err) {
                          console.error('Error uniéndose a batalla:', err)
                          setError('Error al unirse a la batalla. Verifica el código.')
                        }
                      }}
                    >
                      Unirme
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-slate-300/70">Las salas abiertas aparecen arriba con el botón "Salas Abiertas"</div>
                </div>
              </>
            ) : null}

              {battleRoom && battleRoom.status === 'open' ? (
                <div className="rounded-3xl bg-slate-950/30 p-4 ring-1 ring-white/10">
                  <div className="text-sm font-extrabold">Tu sala</div>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex-1 rounded-2xl bg-black/30 px-3 py-2 text-xs font-black text-[#FFC800] text-center sm:text-left">{battleRoom.id}</div>
                    <div className="flex gap-2 justify-center">
                      <button
                        className="shrink-0 rounded-xl bg-[#FFC800] px-3 py-2 text-xs font-black text-slate-900"
                        onClick={() => { navigator.clipboard.writeText(battleRoom.id).catch(() => {}) }}
                      >
                        📋 Copiar
                      </button>
                      <button
                        className="shrink-0 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-black text-white flex items-center gap-1"
                        onClick={() => { 
                          const msg = encodeURIComponent(`¡Únete a mi batalla en Triviverso! 🎮\n\nCódigo: ${battleRoom.id}\n\nhttps://mbcx07.github.io/triviaverse/?room=${battleRoom.id}`)
                          window.open(`https://wa.me/?text=${msg}`, '_blank')
                        }}
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.512-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.884 9.884M8.914 21.674l-.256-.15-.374.1-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.512-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.884 9.884"/>
                        </svg>
                        WhatsApp
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 rounded-2xl bg-[#FFC800]/20 p-2 text-xs text-[#FFC800]">
                      💡 Compartí este código para que otros se unan
                    </div>

                  {/* Info de configuración de la sala */}
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    <div className="rounded-xl bg-black/20 p-2 text-center">
                      <div className="text-[10px] text-slate-400">Timer</div>
                      <div className="text-sm font-black">{battleRoom.timerSeconds || 120}s</div>
                    </div>
                    <div className="rounded-xl bg-black/20 p-2 text-center">
                      <div className="text-[10px] text-slate-400">Equipos</div>
                      <div className="text-sm font-black">{battleRoom.teamCount || 2}</div>
                    </div>
                    <div className="rounded-xl bg-black/20 p-2 text-center">
                      <div className="text-[10px] text-slate-400">Jug/Eq</div>
                      <div className="text-sm font-black">{battleRoom.maxPerTeam || 1}</div>
                    </div>
                    <div className="rounded-xl bg-black/20 p-2 text-center">
                      <div className="text-[10px] text-slate-400">Pregs</div>
                      <div className="text-sm font-black">{battleRoom.questionCount || 10}</div>
                    </div>
                  </div>

                  {/* Indicador de host */}
                  {user?.id === battleRoom.hostUserId ? (
                    <div className="mt-2 inline-block rounded-full bg-[#FFC800]/20 px-3 py-1 text-xs font-black text-[#FFC800]">👑 Eres el HOST</div>
                  ) : null}

                  {/* Selección de equipo estilo Mario Kart */}
                  {battleRoom.status === 'open' ? (
                    <div className="mt-4 rounded-2xl bg-black/20 p-3 ring-1 ring-white/10">
                      <div className="text-xs font-extrabold uppercase tracking-widest text-slate-200/80 mb-2">
                        Elige tu equipo ({battleRoom.teamCount || 2} equipos)
                      </div>
                      <div className={`grid gap-2 ${battleRoom.teamCount === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                        {['A', 'B', 'C', 'D'].slice(0, battleRoom.teamCount || 2).map((t) => {
                          const members = (battleRoom.teams as any)?.[t]?.members || []
                          const maxPerTeam = battleRoom.maxPerTeam || 1
                          const isFull = members.length >= maxPerTeam
                          const isSelected = selectedTeamKey === t
                          const teamColors: Record<string, string> = { A: '#FF4B4B', B: '#4B9DFF', C: '#4BFF7A', D: '#FFB84B' }
                          const teamNames: Record<string, string> = { A: 'Rojos', B: 'Azules', C: 'Verdes', D: 'Naranjas' }
                          return (
                            <button
                              key={t}
                              className={`rounded-2xl p-3 text-center ring-2 transition-all ${isSelected ? 'ring-white bg-white/10 scale-105' : isFull ? 'ring-slate-700 bg-slate-800/50 opacity-50' : 'ring-white/20 hover:ring-white/50 hover:bg-white/5'}`}
                              style={{ borderColor: isSelected ? teamColors[t] : 'transparent' }}
                              disabled={isFull && !isSelected}
                              onClick={async () => {
                                if (!user || isFull) return
                                setSelectedTeamKey(t as any)
                                try {
                                  await joinBattleRoom({ roomId: battleRoom.id, userId: user.id, teamId: t, teamKey: t as any })
                                } catch (err) {
                                  console.error('Error joining team:', err)
                                }
                              }}
                            >
                              <div className="text-xl">{t === 'A' ? '🔴' : t === 'B' ? '🔵' : t === 'C' ? '🟢' : '🟠'}</div>
                              <div className="text-xs font-black truncate" style={{ color: teamColors[t] }}>{teamNames[t]}</div>
                              <div className="text-xs text-slate-400">{members.length}/{maxPerTeam}</div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Votar líder de equipo */}
                  {battleRoom.status === 'open' ? (
                    <div className="mt-4 rounded-2xl bg-black/20 p-3 ring-1 ring-white/10">
                      <div className="text-xs font-extrabold uppercase tracking-widest text-slate-200/80 mb-2">🗳️ Votar líder de equipo</div>
                      {(() => {
                        const myTeamKey: string | undefined = Object.entries(battleRoom.teams || {}).find(([, td]: [string, any]) => (td?.members || []).includes(user?.id || ''))?.[0]
                        const myTeamMembers: string[] = myTeamKey ? (battleRoom.teams as any)?.[myTeamKey]?.members || [] : []
                        const myVote = leaderVotes[user?.id || '']
                        const votesInTeam = Object.entries(leaderVotes).filter(([, v]) => v.teamKey === myTeamKey)
                        // Count votes per candidate
                        const voteCounts: Record<string, number> = {}
                        votesInTeam.forEach(([, v]) => { voteCounts[v.candidateId] = (voteCounts[v.candidateId] || 0) + 1 })
                        const leaderCandidate = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
                        return (
                          <div className="grid grid-cols-2 gap-2">
                            {myTeamMembers.map((uid) => {
                              const isMe = user?.id === uid
                              const voteCount = voteCounts[uid] || 0
                              const isCurrentLeader = leaderCandidate === uid
                              const iVotedForThis = myVote?.candidateId === uid
                              return (
                                <button
                                  key={uid}
                                  className={`rounded-xl p-2 text-center text-xs ring-1 transition-all ${iVotedForThis ? 'ring-[#FFC800] bg-[#FFC800]/10' : 'ring-white/10 hover:ring-white/30 hover:bg-white/5'} ${isCurrentLeader ? 'ring-2 ring-[#FFC800]' : ''}`}
                                  onClick={async () => {
                                    if (!user || !battleRoomId || !myTeamKey) return
                                    await voteTeamLeader({ roomId: battleRoomId, userId: user.id, teamKey: myTeamKey, candidateId: uid })
                                  }}
                                >
                                  <div className="flex items-center justify-center gap-1">
                                    {isCurrentLeader ? '👑' : ''}
                                    <span className={`font-black ${isCurrentLeader ? 'text-[#FFC800]' : 'text-white'}`}>{isMe ? 'Tú' : `User-${uid.slice(0, 6)}`}</span>
                                  </div>
                                  <div className="mt-1 text-slate-400">{voteCount} voto{voteCount !== 1 ? 's' : ''}</div>
                                </button>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </div>
                  ) : null}

                  {/* Botones de acción */}
                  <div className="mt-3 flex gap-2">
                    {user?.id === battleRoom.hostUserId ? (
                      <>
                        <button
                          className="flex-1 rounded-2xl border-b-4 border-[#be123c] bg-gradient-to-b from-rose-500 to-rose-600 py-2 text-xs font-black text-white active:border-b-0 active:translate-y-1"
                          onClick={async () => {
                            if (!battleRoomId) return
                            if (confirm('¿Cancelar la sala?')) {
                              await cancelBattleRoom({ roomId: battleRoomId })
                              setBattleRoom(null)
                              setBattleRoomId('')
                              ;(window as any).__tv_unsubBattle?.()
                            }
                          }}
                        >
                          ❌ Cancelar
                        </button>
                        <button
                          className="flex-1 rounded-2xl border-b-4 border-[#0e6e94] bg-gradient-to-b from-[#35C6FF] to-[#1CB0F6] py-2 text-xs font-black text-white active:border-b-0 active:translate-y-1"
                          onClick={async () => {
                            if (!battleRoomId) return
                            await startBattleMatch({ roomId: battleRoomId })
                          }}
                        >
                          🚀 INICIAR
                        </button>
                      </>
                    ) : (
                      <button
                        className="w-full rounded-2xl border-b-4 border-[#be123c] bg-gradient-to-b from-rose-500 to-rose-600 py-2 text-xs font-black text-white active:border-b-0 active:translate-y-1"
                        onClick={async () => {
                          if (!battleRoomId || !user) return
                          await leaveBattleRoom({ roomId: battleRoomId, userId: user.id })
                          setBattleRoom(null)
                          setBattleRoomId('')
                          ;(window as any).__tv_unsubBattle?.()
                        }}
                      >
                        ❌ Salir de la sala
                      </button>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-slate-300/80">Estado: <span className="font-black text-white">{battleRoom.status || 'open'}</span></div>
                  <div className="mt-2 text-xs text-slate-300/80">
                    Host: <span className="font-black text-white">{battleRoom.hostTeamId || '-'}</span> vs Guest:{' '}
                    <span className="font-black text-white">{battleRoom.guestTeamId || '—'}</span>
                  </div>

                  <div className="mt-3 rounded-2xl bg-black/20 p-3 ring-1 ring-white/10">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-slate-200/80 mb-2">Chat</div>

                    <div className="max-h-60 space-y-2 overflow-auto rounded-xl bg-black/30 p-2" id="battle-chat-scroll">
                      {battleMsgs.map((m) => (
                        <div key={m.id} className={`rounded-2xl px-3 py-2 text-sm ring-1 ring-white/10 ${m.userId === user?.id ? 'bg-[#1CB0F6]/20' : 'bg-white/5'}`}>
                          <div className="text-[10px] font-black text-slate-200/70">{m.userId === user?.id ? 'Tú' : m.userId}</div>
                          {/* Detectar emoji/sticker por longitud y contenido */}
                          {m.text.length <= 4 && /\p{Emoji}/u.test(m.text) ? (
                            <div className="text-4xl">{m.text}</div>
                          ) : (
                            <div className="font-bold text-white">{m.text}</div>
                          )}
                        </div>
                      ))}
                      {!battleMsgs.length ? <div className="text-xs text-slate-300/70">Sin mensajes aún.</div> : null}
                    </div>

                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-2">
                      <input
                        className="w-full rounded-2xl bg-slate-950/60 px-3 py-3 text-base font-black text-white ring-1 ring-white/10"
                        value={battleMsgText}
                        onChange={(e) => setBattleMsgText(e.target.value)}
                        placeholder="Escribe un mensaje..."
                      />
                      <div className="flex gap-2">
                        <button
                          className={`shrink-0 rounded-2xl px-3 py-3 text-2xl ring-1 ring-white/10 ${showEmojiPicker ? 'bg-[#FFC800] ring-[#FF9600]' : 'bg-white/10 hover:bg-white/20'}`}
                          onClick={() => {
                            setShowEmojiPicker((v) => !v)
                            setShowStickers(false)
                          }}
                        >
                          😊
                        </button>
                        <button
                          className={`shrink-0 rounded-2xl px-3 py-3 text-2xl ring-1 ring-white/10 ${showStickers ? 'bg-[#7C4DFF] ring-[#5A35C7]' : 'bg-white/10 hover:bg-white/20'}`}
                          onClick={() => {
                            setShowStickers((v) => !v)
                            setShowEmojiPicker(false)
                          }}
                        >
                          🎨
                        </button>
                        <button
                          className="shrink-0 rounded-2xl bg-[#58CC02] px-4 py-3 text-sm font-black text-white flex-1 sm:flex-none"
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

                    {/* Emoji picker */}
                    {showEmojiPicker ? (
                      <div className="mt-2 rounded-2xl bg-slate-950/90 p-3 ring-1 ring-white/20">
                        <div className="mb-2 text-xs font-bold text-white">Emojis</div>
                        <div className="grid grid-cols-8 gap-2">
                          {EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              className="rounded-xl bg-white/5 p-2 text-2xl hover:bg-white/10"
                              onClick={() => sendEmoji(emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Sticker picker */}
                    {showStickers ? (
                      <div className="mt-2 rounded-2xl bg-slate-950/90 p-3 ring-1 ring-white/20">
                        <div className="mb-2 text-xs font-bold text-white">Stickers</div>
                        <div className="grid grid-cols-4 gap-2">
                          {STICKERS.map((s) => (
                            <button
                              key={s.emoji}
                              className="rounded-xl bg-white/5 p-3 text-4xl hover:bg-white/10"
                              onClick={() => sendSticker(s.emoji)}
                            >
                              {s.emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
            {/* Battle ready system */}
            {battleRoom && battleRoom.status === 'open' && battleRoom.teams?.A && battleRoom.teams?.B ? (
              <div className="mt-4 rounded-3xl bg-slate-950/40 p-4 ring-1 ring-white/10">
                <div className="text-sm font-extrabold">Listos para empezar</div>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  {/* Team A */}
                  <div>
                    <div className="text-xs font-bold text-slate-300/80">Equipo {battleRoom.teams.A?.teamId || 'A'}</div>
                    <div className="mt-2 space-y-1">
                      {(battleRoom.teams.A?.members || []).map((uid: string) => {
                        const isMe = user?.id === uid
                        const isReady = battleRoom.readyUsers?.[uid]
                        return (
                          <div key={uid} className="flex items-center justify-between rounded-xl bg-black/20 px-2 py-1 text-xs">
                            <span className={isMe ? 'font-bold text-white' : ''}>
                              {isMe ? 'Tú' : `User-${uid.slice(0, 6)}`}
                            </span>
                            {isMe ? (
                              <button
                                className={`rounded-lg px-2 py-1 text-[10px] font-black ${isReady ? 'bg-[#58CC02]/80 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-300'}`}
                                onClick={async () => {
                                  if (!user || !battleRoomId) return
                                  const next = !isReady
                                  await toggleBattleReady({ roomId: battleRoomId, userId: user.id, ready: next })
                                }}
                              >
                                {isReady ? 'LISTO' : 'LISTO'}
                              </button>
                            ) : (
                              <span className={`rounded-lg px-2 py-1 text-[10px] font-black ${isReady ? 'bg-[#58CC02]/80 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                {isReady ? '✓' : '…'}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  {/* Team B */}
                  <div>
                    <div className="text-xs font-bold text-slate-300/80">Equipo {battleRoom.teams.B?.teamId || 'B'}</div>
                    <div className="mt-2 space-y-1">
                      {(battleRoom.teams.B?.members || []).map((uid: string) => {
                        const isMe = user?.id === uid
                        const isReady = battleRoom.readyUsers?.[uid]
                        return (
                          <div key={uid} className="flex items-center justify-between rounded-xl bg-black/20 px-2 py-1 text-xs">
                            <span className={isMe ? 'font-bold text-white' : ''}>
                              {isMe ? 'Tú' : `User-${uid.slice(0, 6)}`}
                            </span>
                            {isMe ? (
                              <button
                                className={`rounded-lg px-2 py-1 text-[10px] font-black ${isReady ? 'bg-[#58CC02]/80 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-300'}`}
                                onClick={async () => {
                                  if (!user || !battleRoomId) return
                                  const next = !isReady
                                  await toggleBattleReady({ roomId: battleRoomId, userId: user.id, ready: next })
                                }}
                              >
                                {isReady ? 'LISTO' : 'LISTO'}
                              </button>
                            ) : (
                              <span className={`rounded-lg px-2 py-1 text-[10px] font-black ${isReady ? 'bg-[#58CC02]/80 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                {isReady ? '✓' : '…'}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                {/* Start countdown button (host only) */}
                {user?.id === battleRoom.hostUserId ? (
                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-black/20 px-3 py-2">
                    <div className="text-xs font-bold text-slate-300/80">Todos listos para iniciar</div>
                    <button
                      className="rounded-xl bg-[#58CC02] px-3 py-2 text-xs font-black text-white hover:bg-[#4AA000]"
                      onClick={async () => {
                        if (!battleRoomId) return
                        await startBattleCountdown({ roomId: battleRoomId })
                      }}
                    >
                      ¡EMPEZAR!
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Countdown overlay */}
            {battleRoom && battleRoom.status === 'open' && battleRoom.countdownStarted && battleCountdown !== null ? (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="text-9xl font-black text-white animate-pulse">{battleCountdown || '¡YA!'}</div>
              </div>
            ) : null}

            {/* Battle in progress — ya manejado arriba en el condicional principal */}

            {/* Post-match results */}
            {battleRoom && battleRoom.status === 'finished' ? (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="w-full max-w-md overflow-hidden rounded-[32px] bg-white/95 text-slate-900 shadow-2xl ring-1 ring-white/20">
                  <div className="bg-gradient-to-br from-[#FF9600] to-[#FFC800] p-6 text-center">
                    <div className="text-4xl">🏆</div>
                    <div className="mt-2 text-lg font-black">¡Batalla terminada!</div>
                    <div className="mt-1 text-sm font-bold">
                      {Object.entries(battleRoom.scores || {}).reduce((a, [uid, s]: any) => a + ((battleRoom.teams.A?.members?.includes(uid)) ? (s.correct || 0) : 0), 0) === Object.entries(battleRoom.scores || {}).reduce((a, [uid, s]: any) => a + ((battleRoom.teams.B?.members?.includes(uid)) ? (s.correct || 0) : 0), 0) ? '¡EMPATE!' : 'Equipo ' + battleRoom.winnerTeamId + ' gana'}
                      {' — '}
                      {Object.entries(battleRoom.scores || {}).reduce((a, [uid, s]: any) => a + ((battleRoom.teams.A?.members?.includes(uid)) ? (s.correct || 0) : 0), 0)}
                      {' a '}
                      {Object.entries(battleRoom.scores || {}).reduce((a, [uid, s]: any) => a + ((battleRoom.teams.B?.members?.includes(uid)) ? (s.correct || 0) : 0), 0)}
                    </div>
                  </div>
                  <div className="space-y-3 p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-slate-100 px-3 py-3 text-center">
                        <div className="text-xs font-bold text-slate-500">Equipo {battleRoom.teams.A?.teamId || 'A'}</div>
                        <div className="mt-2 text-3xl font-black">
                          {Object.entries(battleRoom.scores || {}).reduce((a, [uid, s]: any) => a + ((battleRoom.teams.A?.members?.includes(uid)) ? (s.correct || 0) : 0), 0)}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-3 text-center">
                        <div className="text-xs font-bold text-slate-500">Equipo {battleRoom.teams.B?.teamId || 'B'}</div>
                        <div className="mt-2 text-3xl font-black">
                          {Object.entries(battleRoom.scores || {}).reduce((a, [uid, s]: any) => a + ((battleRoom.teams.B?.members?.includes(uid)) ? (s.correct || 0) : 0), 0)}
                        </div>
                      </div>
                    </div>
                    <button
                      className="w-full rounded-2xl border-b-4 border-[#0e6e94] bg-gradient-to-b from-[#35C6FF] to-[#1CB0F6] py-4 text-sm font-black uppercase tracking-widest text-white active:border-b-0 active:translate-y-1"
                      onClick={async () => {
                        if (!user || !battleRoomId) return
                        const maxPerTeam = Number(battleRoom?.maxPerTeam || 4)
                        const subject = battleRoom?.subject || 'esp'
                        const r = await createBattleRoom({ userId: user.id, teamId: user.teamId || 'belas', subject, maxPerTeam, visibility: battleRoom.visibility || 'open' })
                        setBattleRoomId(r.id)
                        setBattleRoom(null)
                        ;(window as any).__tv_unsubBattle?.()
                        ;(window as any).__tv_unsubBattle = subscribeBattleRoom(r.id, (rr) => setBattleRoom(rr))
                        ;(window as any).__tv_unsubBattleMsgs?.()
                        ;(window as any).__tv_unsubBattleMsgs = subscribeBattleMessages(r.id, { kind: 'global' }, (m: any) => setBattleMsgs(m))
                      }}
                    >
                      Revancha
                    </button>
                    <button
                      className="w-full rounded-2xl bg-slate-900 px-3 py-3 text-sm font-black text-white"
                      onClick={() => {
                        setBattleRoomId(''); setBattleRoom(null)
                        ;(window as any).__tv_unsubBattle?.()
                        ;(window as any).__tv_unsubBattleMsgs?.()
                      }}
                    >
                      Salir al menú
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <footer className="py-6 text-center text-xs text-slate-500">Triviverso · 5° y 6° Primaria</footer>

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
                <button className="rounded-2xl bg-white/10 px-3 py-3 text-sm font-black" onClick={() => { setTab('friends'); setMenuOpen(false) }}>Amigos</button>
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

        {/* Celebration / Failed Modal */}
        {celebration ? (
          <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-[32px] bg-white/95 text-slate-900 shadow-2xl ring-1 ring-white/20">
              <div className={`p-7 text-center ${celebration.failed ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-[#58CC02] to-[#FFC800]'} text-slate-900`}>
                <div className="text-sm font-extrabold uppercase tracking-widest opacity-80">
                  {celebration.failed ? '¡Fallaste!' : '¡Completada!'}
                </div>
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

                {!celebration.failed && <div className="mt-2 text-sm font-bold">+{celebration.xpDelta} XP</div>}
                <div className="mt-1 text-xs font-black">Score: {correctAnswered}/{totalAnswered}</div>
                {celebration.failed && <div className="mt-2 text-sm font-bold">Necesitas al menos 1 estrella para avanzar</div>}
              </div>
              <div className="space-y-3 p-6">
                <button
                  className={`w-full rounded-2xl py-4 text-lg font-black uppercase tracking-widest transition-all ${celebration.failed ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'border-b-4 border-[#d07a00] bg-gradient-to-b from-[#FFC800] to-[#FF9600] text-slate-900 hover:brightness-110 active:border-b-0 active:translate-y-1'}`}
                  onClick={() => {
                    if (celebration.failed) {
                      // Si falló, salir al menú
                      setCelebration(null)
                      setLessonId('')
                      setQuestions([])
                      setResults({})
                      setIdx(0)
                      setTab('mode')
                    } else {
                      // Si pasó, ir a la siguiente lección
                      if (!lesson) return
                      const currentLesson = lesson
                      const currentWorld = currentLesson.subject || 'esp'
                      const currentOrder = currentLesson.order || 0
                      const nextLesson = lessons
                        .filter((l) => l.subject === currentWorld)
                        .find((l) => (l.order || 0) > currentOrder)
                      if (nextLesson) {
                        setLessonId(nextLesson.id)
                        setCelebration(null)
                        setResults({})
                        setIdx(0)
                        setFeedback(null)
                        setAnswerText('')
                        setOrderSelected([])
                        setMatchLeft(null)
                        setMatchMap({})
                        setMatchRightsUsed(new Set())
                      } else {
                        setCelebration(null)
                      }
                    }
                  }}
                >
                  {celebration.failed ? 'Salir' : 'Continuar'}
                </button>

                {!celebration.failed && (
                <button
                  onClick={async () => {
                    if (!user) return
                    await resetLessonProgress({ userId: user.id, lessonId })
                    setCelebration(null)
                    setResults({})
                    setIdx(0)
                    setFeedback(null)
                    setAnswerText('')
                    setOrderSelected([])
                    setMatchLeft(null)
                    setMatchMap({})
                    setMatchRightsUsed(new Set())
                    isAnsweringRef.current = false
                    const pm = await loadProgressMap(user.id)
                    setProgressMap(pm)
                    setTab('play')
                  }}
                  className="w-full rounded-2xl bg-slate-900 px-3 py-3 text-sm font-black text-white ring-1 ring-white/10 hover:bg-slate-800"
                >
                  Reintentar
                </button>
                )}

                {celebration.failed && (
                <button
                  onClick={async () => {
                    if (!user) return
                    await resetLessonProgress({ userId: user.id, lessonId })
                    setCelebration(null)
                    setResults({})
                    setIdx(0)
                    setFeedback(null)
                    setAnswerText('')
                    setOrderSelected([])
                    setMatchLeft(null)
                    setMatchMap({})
                    setMatchRightsUsed(new Set())
                    isAnsweringRef.current = false
                    const pm = await loadProgressMap(user.id)
                    setProgressMap(pm)
                  }}
                  className="w-full rounded-2xl border-b-4 border-[#d07a00] bg-gradient-to-b from-[#FFC800] to-[#FF9600] py-3 text-sm font-black text-slate-900 hover:brightness-110 active:border-b-0 active:translate-y-1"
                >
                  Reintentar
                </button>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Exit confirm */}
        {exitConfirm ? (
          <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-[32px] bg-white/95 text-slate-900 shadow-2xl ring-1 ring-white/20">
              <div className="bg-gradient-to-br from-[#FF9600] to-[#FFC800] p-6 text-center">
                <div className="text-lg font-black">¿Salir de la misión?</div>
                <div className="mt-2 text-sm font-bold">
                  Si te sales, <b>no podrás continuar</b> desde donde ibas. Podrás volver a empezar la misión cuando quieras.
                </div>
              </div>
              <div className="space-y-3 p-6">
                <button
                  className="w-full rounded-2xl border-b-4 border-[#0e6e94] bg-gradient-to-b from-[#35C6FF] to-[#1CB0F6] py-4 text-sm font-black uppercase tracking-widest text-white active:border-b-0 active:translate-y-1"
                  onClick={() => {
                    setExitConfirm(false)
                    setTab('home')
                    setWorld(null)
                  }}
                >
                  Salir
                </button>
                <button className="w-full rounded-2xl bg-slate-900 px-3 py-3 text-sm font-black text-white" onClick={() => setExitConfirm(false)}>
                  Seguir jugando
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
                <div className="mt-2 text-sm font-bold opacity-90">{isLessonCompleted(startModalLesson.id) ? '¿Volver a jugar?' : '¿Listo para jugar?'}</div>
              </div>

              <div className="space-y-3 p-6">
                <button
                  onClick={async () => {
                    // Si es reintento, primero limpiar intentos en Firestore
                    if (isLessonCompleted(startModalLesson.id)) {
                      await resetLessonProgress({ userId: user!.id, lessonId: startModalLesson.id })
                    }
                    // Luego limpiar estado local y cargar preguntas frescas
                    setResults({})
                    setLessonId(startModalLesson.id)
                    setTab('play')
                    setStartModalLesson(null)
                  }}
                  className="w-full rounded-2xl border-b-4 border-[#0e6e94] bg-gradient-to-b from-[#35C6FF] to-[#1CB0F6] py-4 text-lg font-black uppercase tracking-widest text-white transition-all hover:brightness-110 active:border-b-0 active:translate-y-1"
                >
                  {isLessonCompleted(startModalLesson.id) ? '¡REINTENTAR!' : '¡EMPEZAR!'}
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
