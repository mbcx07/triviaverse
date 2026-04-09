import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

export async function setupNativePushNotifications(): Promise<string | null> {
  const isNative = Capacitor.isNativePlatform()
  
  if (!isNative) {
    console.log('[NativePush] Not a native platform, skipping setup')
    return null
  }

  try {
    // Request permission
    const permResult = await PushNotifications.requestPermissions()
    
    if (permResult.receive !== 'granted') {
      console.log('[NativePush] Push notification permission denied')
      return null
    }

    // Register for push notifications
    await PushNotifications.register()
    
    // Get the FCM token
    const token = await new Promise<string | null>((resolve) => {
      PushNotifications.addListener('registration', (token) => {
        console.log('[NativePush] FCM token received:', token.value)
        resolve(token.value)
      })
      
      PushNotifications.addListener('registrationError', (error) => {
        console.error('[NativePush] Registration error:', error)
        resolve(null)
      })
    })
    
    // Listen for foreground notifications
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[NativePush] Push received:', notification)
    })
    
    // Listen for notification tap
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[NativePush] Push action:', action)
    })
    
    return token
  } catch (error) {
    console.error('[NativePush] Setup error:', error)
    return null
  }
}

export async function getNativePushToken(): Promise<string | null> {
  const isNative = Capacitor.isNativePlatform()
  if (!isNative) return null
  
  try {
    await PushNotifications.register()
    return null // Token is received via 'registration' listener
  } catch {
    return null
  }
}