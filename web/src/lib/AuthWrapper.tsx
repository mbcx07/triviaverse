import { useEffect, useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { getProfileByUid, migratePinUserToFirebase } from './auth'
import type { User } from '../firestore'

interface AuthWrapperProps {
  children: React.ReactNode
  onLogin: (user: User) => void
}

export function AuthWrapper({ children, onLogin }: AuthWrapperProps) {
  const { user: firebaseUser, loading, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<'login' | 'migrate' | 'loggedin'>('login')
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Check if Firebase user has a profile
  useEffect(() => {
    if (!firebaseUser) return
    
    ;(async () => {
      const profile = await getProfileByUid(firebaseUser.uid)
      if (profile) {
        onLogin({
          id: profile.id,
          nickname: profile.nickname,
          nicknameNorm: profile.nicknameNorm,
          xpTotal: profile.xpTotal,
          streakCount: profile.streakCount,
          teamId: profile.teamId,
          avatar: profile.avatar,
          displayName: profile.displayName,
        })
        setMode('loggedin')
      }
    })()
  }, [firebaseUser, onLogin])

  const handleGoogleSignIn = useCallback(async () => {
    setError(null)
    const result = await signInWithGoogle()
    if (!result) {
      setError('No se pudo iniciar sesión con Google.')
    }
  }, [signInWithGoogle])

  const handleMigrate = useCallback(async () => {
    if (!firebaseUser) return
    if (!nickname.trim()) {
      setError('Ingresa tu nickname existente.')
      return
    }
    if (!pin.match(/^\d{4}$/)) {
      setError('El PIN debe ser 4 dígitos.')
      return
    }
    
    setSubmitting(true)
    setError(null)
    
    try {
      const profile = await migratePinUserToFirebase(firebaseUser, nickname, pin)
      onLogin({
        id: profile.id,
        nickname: profile.nickname,
        nicknameNorm: profile.nicknameNorm,
        xpTotal: profile.xpTotal,
        streakCount: profile.streakCount,
        teamId: profile.teamId,
        avatar: profile.avatar,
        displayName: profile.displayName,
      })
      setMode('loggedin')
    } catch (err: any) {
      setError(err.message || 'Error al migrar cuenta.')
    } finally {
      setSubmitting(false)
    }
  }, [firebaseUser, nickname, pin, onLogin])

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-lg text-slate-300">Cargando...</div>
      </div>
    )
  }

  if (firebaseUser && mode === 'migrate') {
    return (
      <div className="rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
        <div className="text-sm font-bold">Vincular cuenta existente</div>
        <div className="mt-1 text-xs text-slate-300/80">Conecta tu cuenta Google para mantener tu progreso.</div>
        
        {error && (
          <div className="mt-3 rounded-xl bg-rose-950/40 p-3 text-sm text-rose-200">{error}</div>
        )}

        <div className="mt-4 space-y-3">
          <label className="block">
            <div className="mb-1 text-xs text-slate-300">Tu nickname actual</div>
            <input
              className="w-full rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="tuNickname"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-xs text-slate-300">Tu PIN actual</div>
            <input
              className="w-full rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
              inputMode="numeric"
            />
          </label>

          <button
            className="w-full rounded-xl bg-[#1CB0F6] px-3 py-2 font-semibold hover:bg-[#35C6FF] disabled:opacity-50"
            onClick={handleMigrate}
            disabled={submitting}
          >
            {submitting ? 'Vinculando...' : 'Vincular mi cuenta'}
          </button>

          <button
            className="w-full rounded-xl bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
            onClick={() => setMode('login')}
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-rose-950/40 p-3 text-sm text-rose-200">{error}</div>
      )}

      <button
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 font-semibold text-slate-900 transition-all hover:bg-slate-100"
        onClick={handleGoogleSignIn}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continuar con Google
      </button>

      <div className="text-center text-xs text-slate-400">— o —</div>

      <button
        className="w-full rounded-2xl bg-slate-800 px-4 py-3 font-semibold hover:bg-slate-700"
        onClick={() => setMode('migrate')}
      >
        Ya tengo cuenta (migrar)
      </button>

      {children}
    </div>
  )
}