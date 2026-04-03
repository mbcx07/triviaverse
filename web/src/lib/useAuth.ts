import { useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { auth } from '../firebase'

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!auth) {
      setState({ user: null, loading: false, error: 'Firebase no está configurado' })
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({ user, loading: false, error: null })
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = useCallback(async (): Promise<UserCredential | null> => {
    if (!auth) {
      setState((prev) => ({ ...prev, error: 'Firebase no está configurado' }))
      return null
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      return result
    } catch (error: any) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }))
      return null
    }
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<UserCredential | null> => {
    if (!auth) {
      setState((prev) => ({ ...prev, error: 'Firebase no está configurado' }))
      return null
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result
    } catch (error: any) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }))
      return null
    }
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<UserCredential | null> => {
    if (!auth) {
      setState((prev) => ({ ...prev, error: 'Firebase no está configurado' }))
      return null
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const result = await createUserWithEmailAndPassword(auth, email, password)
      return result
    } catch (error: any) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }))
      return null
    }
  }, [])

  const signOut = useCallback(async (): Promise<void> => {
    if (!auth) return

    try {
      await firebaseSignOut(auth)
      setState((prev) => ({ ...prev, user: null, error: null }))
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message }))
    }
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    clearError,
  }
}