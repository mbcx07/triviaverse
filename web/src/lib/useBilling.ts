/**
 * Google Play Billing hook for Triviverso
 * Handles subscriptions via Google Play Billing API
 */

import { useState, useCallback } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { updateSubscriptionFromPurchase, getSubscription, hasPremiumAccess } from './subscription'

// Product IDs defined in Google Play Console
export const PRODUCT_IDS = {
  premium_weekly: 'premium_weekly',
  premium_monthly: 'premium_monthly',
} as const

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS]

interface PurchaseResult {
  success: boolean
  plan?: string
  expiresAt?: string
  error?: string
}

// Mock Google Play Billing for web development
// In production Android app, this uses the actual Google Play Billing Library
const mockPurchase = async (_productId: ProductId): Promise<{ purchaseToken: string; orderId: string }> => {
  // Simulate purchase flow
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  return {
    purchaseToken: `mock_token_${Date.now()}`,
    orderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  }
}

export function useBilling(userId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)

  // Check premium status
  const checkPremiumStatus = useCallback(async () => {
    try {
      const premium = await hasPremiumAccess(userId)
      setIsPremium(premium)
      return premium
    } catch (err) {
      console.error('Error checking premium status:', err)
      return false
    }
  }, [userId])

  // Purchase subscription
  const purchaseSubscription = useCallback(async (productId: ProductId): Promise<PurchaseResult> => {
    setLoading(true)
    setError(null)

    try {
      // Step 1: Initiate purchase via Google Play (or mock for web)
      // In production, use window.gp.purchase() or similar
      const { purchaseToken, orderId } = await mockPurchase(productId)

      // Step 2: Validate purchase with backend
      if (!functions) {
        throw new Error('Firebase functions not initialized')
      }
      
      const validatePurchase = httpsCallable(functions, 'validateGooglePurchase')
      const result = await validatePurchase({
        productId,
        purchaseToken,
        orderId,
      })

      const data = result.data as PurchaseResult

      if (data.success) {
        // Step 3: Update local subscription state
        await updateSubscriptionFromPurchase(userId, {
          productId,
          purchaseToken,
          orderId,
        })

        setIsPremium(true)
        return data
      } else {
        throw new Error(data.error || 'Purchase validation failed')
      }
    } catch (err: any) {
      console.error('Purchase error:', err)
      const errorMessage = err.message || 'Error al procesar la compra'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Get current subscription
  const getCurrentSubscription = useCallback(async () => {
    try {
      return await getSubscription(userId)
    } catch (err) {
      console.error('Error getting subscription:', err)
      return null
    }
  }, [userId])

  return {
    loading,
    error,
    isPremium,
    checkPremiumStatus,
    purchaseSubscription,
    getCurrentSubscription,
    PRODUCT_IDS,
  }
}