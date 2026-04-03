import { useState } from 'react'
import { useAuth } from './useAuth'
import {
  createProfileFromFirebase,
  migratePinUserToFirebase,
  getProfileByUid,
} from './auth'
import type { UserProfile } from './auth'

interface LoginFirebaseProps {
  onLogin: (profile: UserProfile) => void
}

export function LoginFirebase({ onLogin }: LoginFirebaseProps) {
  const { user, loading, error, signInWithGoogle, clearError } = useAuth()
  const [mode, setMode] = useState<'choose' | 'new' | 'migrate'>('choose')
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // When Firebase auth completes, get/create profile
  if (user && !loading && mode !== 'choose') {
    ;(async () => {
      try {
        let profile: UserProfile | null = null

        if (mode === 'new') {
          profile = await createProfileFromFirebase(user, nickname)
        } else if (mode === 'migrate') {
          profile = await migratePinUserToFirebase(user, nickname, pin)
        }

        if (profile) {
          onLogin(profile)
        }
      } catch (err: any) {
        setLocalError(err.message)
        setSubmitting(false)
      }
    })()
  }

  const handleGoogleSignIn = async () => {
    clearError()
    setLocalError(null)
    const result = await signInWithGoogle()
    if (result) {
      // Check if user already has a profile
      const existingProfile = await getProfileByUid(result.user.uid)
      if (existingProfile) {
        onLogin(existingProfile)
      } else {
        // New user, need to choose nickname
        setMode('new')
      }
    }
  }

  const handleNewUser = async () => {
    if (!nickname.trim()) {
      setLocalError('Ingresa un nickname.')
      return
    }
    setSubmitting(true)
    setLocalError(null)
    // The profile will be created when user becomes available
  }

  const handleMigrate = async () => {
    if (!nickname.trim()) {
      setLocalError('Ingresa tu nickname existente.')
      return
    }
    if (!pin.match(/^\d{4}$/)) {
      setLocalError('El PIN debe ser 4 dígitos.')
      return
    }
    setSubmitting(true)
    setLocalError(null)
    // The migration will happen when user becomes available
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-lg text-slate-300">Cargando...</div>
      </div>
    )
  }

  // Already logged in via Firebase but need to complete profile
  if (user && (mode === 'new' || mode === 'migrate') && !submitting) {
    return (
      <div className="rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
        <div className="mb-4 text-center text-lg font-bold">
          {mode === 'new' ? 'Elige tu nickname' : 'Vincula tu cuenta'}
        </div>

        {mode === 'migrate' && (
          <div className="mb-3 text-center text-sm text-slate-300">
            Ingresa tu nickname y PIN existentes para migrar tu progreso.
          </div>
        )}

        {localError && (
          <div className="mb-3 rounded-xl bg-rose-950/40 p-3 text-sm text-rose-200">
            {localError}
          </div>
        )}

        <label className="mb-3 block">
          <div className="mb-1 text-xs text-slate-300">Nickname</div>
          <input
            className="w-full rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="TuNombre"
            maxLength={20}
          />
        </label>

        {mode === 'migrate' && (
          <label className="mb-3 block">
            <div className="mb-1 text-xs text-slate-300">PIN (4 dígitos)</div>
            <input
              className="w-full rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
              inputMode="numeric"
              maxLength={4}
            />
          </label>
        )}

        <div className="flex gap-2">
          <button
            className="flex-1 rounded-xl bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
            onClick={() => {
              setMode('choose')
              setLocalError(null)
            }}
          >
            Cancelar
          </button>
          <button
            className="flex-1 rounded-xl bg-[#1CB0F6] px-4 py-2 font-semibold hover:bg-[#35C6FF]"
            onClick={mode === 'new' ? handleNewUser : handleMigrate}
          >
            {mode === 'new' ? 'Crear perfil' : 'Vincular'}
          </button>
        </div>
      </div>
    )
  }

  // Choose login method
  return (
    <div className="space-y-4">
      {(error || localError) && (
        <div className="rounded-xl bg-rose-950/40 p-3 text-sm text-rose-200">
          {error || localError}
        </div>
      )}

      <button
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-slate-900 transition-all hover:bg-slate-100"
        onClick={handleGoogleSignIn}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="font-semibold">Continuar con Google</span>
      </button>

      <div className="text-center text-sm text-slate-400">— o —</div>

      <button
        className="w-full rounded-2xl bg-slate-800 px-4 py-3 font-semibold text-white hover:bg-slate-700"
        onClick={() => setMode('migrate')}
      >
        Migrar cuenta existente (PIN)
      </button>

      <button
        className="w-full rounded-2xl bg-slate-800 px-4 py-3 font-semibold text-white hover:bg-slate-700"
        onClick={() => setMode('new')}
      >
        Crear cuenta nueva (Google)
      </button>
    </div>
  )
}