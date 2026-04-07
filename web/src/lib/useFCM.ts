import { useEffect, useCallback, useState } from 'react'
import { messaging, requestFCMToken, onForegroundMessage } from '../firebase'
import { saveUserFCMToken, removeUserFCMToken } from '../lib/auth'
import type { MessagePayload } from 'firebase/messaging'
import type { User } from 'firebase/auth'

export interface FCMState {
  token: string | null
  permission: NotificationPermission | 'unsupported'
  error: string | null
}

/**
 * Hook to manage Firebase Cloud Messaging
 * - Requests notification permission
 * - Gets FCM token
 * - Saves token to user profile
 * - Listens for foreground messages
 */
export function useFCM(user: User | null) {
  const [state, setState] = useState<FCMState>({
    token: null,
    permission: 'notification' in window ? Notification.permission : 'unsupported',
    error: null,
  })

  // Request permission and get token
  const requestPermission = useCallback(async () => {
    if (!messaging) {
      setState((prev) => ({ ...prev, error: 'FCM no está disponible' }))
      return null
    }

    try {
      const token = await requestFCMToken()
      if (token) {
        setState((prev) => ({ ...prev, token, permission: 'granted' }))
        
        // Save token to user profile if logged in
        if (user) {
          await saveUserFCMToken(user.uid, token)
        }
        return token
      } else {
        setState((prev) => ({ ...prev, permission: 'denied' }))
        return null
      }
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message }))
      return null
    }
  }, [user])

  // Clear token on logout
  const clearToken = useCallback(async () => {
    if (user && state.token) {
      try {
        await removeUserFCMToken(user.uid)
      } catch (e) {
        console.error('Error clearing FCM token:', e)
      }
    }
    setState((prev) => ({ ...prev, token: null }))
  }, [user, state.token])

  // Auto-request permission when user logs in (if not already granted)
  useEffect(() => {
    if (!user || !messaging) return

    // Check if permission already granted
    if (Notification.permission === 'granted') {
      // Get token if we don't have it
      if (!state.token) {
        requestPermission()
      }
    }
  }, [user, state.token, requestPermission])

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging) return

    const unsubscribe = onForegroundMessage((payload: MessagePayload) => {
      console.log('[FCM] Foreground message:', payload)
      
      // Show in-app notification or update state
      // For now, we just log it
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  return {
    ...state,
    requestPermission,
    clearToken,
  }
}