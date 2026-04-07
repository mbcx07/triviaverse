import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import * as admin from 'firebase-admin'

// Initialize Firebase Admin
admin.initializeApp()

const db = admin.firestore()

/**
 * Send FCM notification when a battle invite is created
 * Triggered when a document is added to battleInvites collection
 */
export const sendBattleInviteNotification = onDocumentCreated(
  'battleInvites/{inviteId}',
  async (event) => {
    const inviteData = event.data?.data()
    
    if (!inviteData) {
      console.log('No invite data')
      return null
    }

    const { toUid, fromUid, fromNickname, roomCode } = inviteData as {
      toUid?: string
      fromUid?: string
      fromNickname?: string
      roomCode?: string
    }

    if (!toUid) {
      console.log('No recipient UID')
      return null
    }

    try {
      // Get recipient's FCM token
      const userDoc = await db.collection('users').doc(toUid).get()
      
      if (!userDoc.exists) {
        console.log('User document not found:', toUid)
        return null
      }

      const userData = userDoc.data()
      const fcmToken = userData?.fcmToken

      if (!fcmToken) {
        console.log('User has no FCM token:', toUid)
        return null
      }

      // Get sender's nickname if not provided
      let senderName = fromNickname || 'Alguien'
      if (!fromNickname && fromUid) {
        const senderDoc = await db.collection('users').doc(fromUid).get()
        if (senderDoc.exists) {
          senderName = senderDoc.data()?.nickname || 'Alguien'
        }
      }

      // Send FCM message
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title: '¡Invitación a Batalla!',
          body: `${senderName} te invita a una batalla. ¡Únete ahora!`,
        },
        data: {
          type: 'battle_invite',
          inviteId: event.params.inviteId,
          roomCode: roomCode || '',
          fromUid: fromUid || '',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#1CB0F6',
            sound: 'default',
            channelId: 'battle_invites',
          },
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      }

      const response = await admin.messaging().send(message)
      console.log('FCM message sent:', response)

      return { success: true, messageId: response }
    } catch (error) {
      console.error('Error sending FCM notification:', error)
      return { success: false, error: String(error) }
    }
  }
)

/**
 * Clean up FCM token when user logs out
 * Call this from client when user signs out
 */
export const removeFCMTokenOnLogout = onDocumentUpdated(
  'users/{uid}',
  async (event) => {
    const beforeData = event.data?.before.data()
    const afterData = event.data?.after.data()

    if (!beforeData || !afterData) return null

    // If fcmToken was removed, it's a logout
    if (beforeData.fcmToken && !afterData.fcmToken) {
      console.log('FCM token removed for user:', event.params.uid)
    }

    return null
  }
)

/**
 * Send notification when friend request is accepted
 */
export const sendFriendAcceptedNotification = onDocumentCreated(
  'users/{uid}/friends/{friendId}',
  async (event) => {
    const friendData = event.data?.data() as {
      status?: string
    } | undefined
    
    if (!friendData || friendData.status !== 'accepted') {
      return null
    }

    const { uid, friendId } = event.params

    try {
      // Get friend's FCM token
      const friendDoc = await db.collection('users').doc(friendId).get()
      
      if (!friendDoc.exists) {
        return null
      }

      const friendToken = friendDoc.data()?.fcmToken
      
      if (!friendToken) {
        return null
      }

      // Get user's nickname
      const userDoc = await db.collection('users').doc(uid).get()
      const userNickname = userDoc.data()?.nickname || 'Alguien'

      const message: admin.messaging.Message = {
        token: friendToken,
        notification: {
          title: '¡Nueva amistad!',
          body: `${userNickname} aceptó tu solicitud de amistad.`,
        },
        data: {
          type: 'friend_accepted',
          friendId: uid,
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#25D366',
            sound: 'default',
          },
          priority: 'high',
        },
      }

      await admin.messaging().send(message)
      console.log('Friend accepted notification sent')
      return null
    } catch (error) {
      console.error('Error sending friend notification:', error)
      return null
    }
  }
)