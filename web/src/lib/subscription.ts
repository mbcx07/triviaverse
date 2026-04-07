/**
 * Subscription management for Triviverso
 * 
 * Plans:
 * - Free: Basic access, limited features
 * - Premium Weekly: $40 MXN/week, 7-day free trial
 * - Premium Monthly: $120 MXN/month, 7-day free trial
 * 
 * Premium features:
 * - Unlimited battles
 * - All subjects unlocked
 * - No ads
 * - Exclusive avatars
 * - Progress stats
 */

import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'

export type SubscriptionPlan = 'free' | 'premium_weekly' | 'premium_monthly'
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'cancelled'

export interface Subscription {
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  startedAt: Timestamp | null
  expiresAt: Timestamp | null
  trialEndsAt: Timestamp | null
  purchaseToken?: string
  orderId?: string
  updatedAt: Timestamp | null
}

// Premium features
export const PREMIUM_FEATURES = {
  unlimitedBattles: true,
  allSubjects: true,
  noAds: true,
  exclusiveAvatars: true,
  progressStats: true,
  customThemes: true,
}

// Pricing (MXN)
export const PRICING = {
  premium_weekly: {
    price: 40, // MXN
    currency: 'MXN',
    trialDays: 7,
  },
  premium_monthly: {
    price: 120, // MXN
    currency: 'MXN',
    trialDays: 7,
  },
}

export async function hasPremiumAccess(userId: string): Promise<boolean> {
  if (!db) return false
  
  const subRef = doc(db, 'subscriptions', userId)
  const snap = await getDoc(subRef)
  
  if (!snap.exists()) return false
  
  const sub = snap.data() as Subscription
  
  if (sub.status === 'cancelled') {
    // Check if still in grace period
    if (sub.expiresAt && sub.expiresAt.toDate() > new Date()) {
      return true
    }
    return false
  }
  
  if (sub.status === 'trial') {
    // Check if trial is still valid
    if (sub.trialEndsAt && sub.trialEndsAt.toDate() > new Date()) {
      return true
    }
    return false
  }
  
  return sub.status === 'active'
}

/**
 * Get user's subscription details
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  if (!db) return null
  
  const subRef = doc(db, 'subscriptions', userId)
  const snap = await getDoc(subRef)
  
  if (!snap.exists()) return null
  
  return snap.data() as Subscription
}

/**
 * Create or update subscription after Google Play purchase
 */
export async function updateSubscriptionFromPurchase(
  userId: string,
  purchase: {
    productId: string
    purchaseToken: string
    orderId: string
  }
): Promise<void> {
  if (!db) return
  
  const plan = purchase.productId === 'premium_weekly' ? 'premium_weekly' : 'premium_monthly'
  const trialDays = PRICING[plan as keyof typeof PRICING].trialDays
  
  const now = Timestamp.now()
  const trialEndsAt = Timestamp.fromMillis(now.toMillis() + trialDays * 24 * 60 * 60 * 1000)
  const expiresAt = plan === 'premium_weekly'
    ? Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000)
    : Timestamp.fromMillis(now.toMillis() + 30 * 24 * 60 * 60 * 1000)
  
  const subRef = doc(db, 'subscriptions', userId)
  
  await setDoc(subRef, {
    userId,
    plan,
    status: 'trial',
    startedAt: now,
    expiresAt,
    trialEndsAt,
    purchaseToken: purchase.purchaseToken,
    orderId: purchase.orderId,
    updatedAt: now,
  }, { merge: true })
}

/**
 * Update subscription status from Google Play notification
 */
export async function updateSubscriptionStatus(
  userId: string,
  status: SubscriptionStatus,
  expiresAt?: Timestamp
): Promise<void> {
  if (!db) return
  
  const subRef = doc(db, 'subscriptions', userId)
  
  const update: Partial<Subscription> = {
    status,
    updatedAt: Timestamp.now(),
  }
  
  if (expiresAt) {
    update.expiresAt = expiresAt
  }
  
  await updateDoc(subRef, update)
}

/**
 * Cancel subscription (at period end)
 */
export async function cancelSubscription(userId: string): Promise<void> {
  if (!db) return
  
  const subRef = doc(db, 'subscriptions', userId)
  await updateDoc(subRef, {
    status: 'cancelled',
    updatedAt: Timestamp.now(),
  })
}

/**
 * Check feature access for free tier limits
 */
export const FREE_TIER_LIMITS = {
  battlesPerDay: 3,
  subjectsUnlocked: ['esp'], // Only Spanish free
}

export async function canStartBattle(userId: string): Promise<boolean> {
  const hasPremium = await hasPremiumAccess(userId)
  if (hasPremium) return true
  
  // TODO: Check daily battle count for free users
  // For now, allow all battles during beta
  return true
}

export function getUnlockedSubjects(subscription: Subscription | null): string[] {
  if (!subscription || subscription.status === 'expired') {
    return FREE_TIER_LIMITS.subjectsUnlocked
  }
  
  if (subscription.status === 'active' || subscription.status === 'trial') {
    return ['all'] // All subjects unlocked
  }
  
  return FREE_TIER_LIMITS.subjectsUnlocked
}

// Export for use in components
export const SUBSCRIPTION_PLANS = {
  premium_weekly: {
    id: 'premium_weekly',
    price: 40,
    currency: 'MXN',
    trialDays: 7,
  },
  premium_monthly: {
    id: 'premium_monthly',
    price: 120,
    currency: 'MXN',
    trialDays: 7,
  },
} as const