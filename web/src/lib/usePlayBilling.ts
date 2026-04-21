import { useEffect, useState, useCallback } from 'react'
import { Purchases, type PurchasesOffering, type PurchasesPackage } from '@revenuecat/purchases-capacitor'

const REVENUECAT_API_KEY = '' // Will be set from environment or hardcoded for Android

export interface PurchasePlan {
  id: string
  title: string
  price: string
  priceAmountMicros: number
  currencyCode: string
  period?: string
  freeTrialPeriodDays?: number
}

export function usePlayBilling() {
  const [isReady, setIsReady] = useState(false)
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null)
  const [activeEntitlements, setActiveEntitlements] = useState<string[]>([])
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(false)

  // Initialize RevenueCat
  useEffect(() => {
    const init = async () => {
      try {
        // Only initialize on Android
        if (!(window as any).Capacitor?.isNativePlatform?.()) {
          console.log('[Billing] Not running on Android, skipping init')
          return
        }

        if (!REVENUECAT_API_KEY) {
          console.warn('[Billing] No RevenueCat API key configured')
          return
        }

        await Purchases.configure({
          apiKey: REVENUECAT_API_KEY,
          appUserID: undefined, // Let RevenueCat generate anonymous ID
        })

        const { customerInfo } = await Purchases.getCustomerInfo()
        const entitlements = customerInfo.entitlements.active
        const activeIds = Object.keys(entitlements)
        setActiveEntitlements(activeIds)
        setIsPremium(activeIds.includes('premium') || activeIds.includes('premium_lifetime'))

        const { current } = await Purchases.getOfferings()
        if (current) {
          setOfferings(current)
        }

        setIsReady(true)
        console.log('[Billing] Initialized successfully')
      } catch (err) {
        console.error('[Billing] Init error:', err)
      }
    }

    init()
  }, [])

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    setLoading(true)
    try {
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
      const activeIds = Object.keys(customerInfo.entitlements.active)
      setActiveEntitlements(activeIds)
      setIsPremium(activeIds.includes('premium') || activeIds.includes('premium_lifetime'))
      return true
    } catch (err: any) {
      if (err?.code === '1' || err?.userCancelled) {
        // User cancelled
        return false
      }
      console.error('[Billing] Purchase error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const restorePurchases = useCallback(async () => {
    try {
      const { customerInfo } = await Purchases.restorePurchases()
      const activeIds = Object.keys(customerInfo.entitlements.active)
      setActiveEntitlements(activeIds)
      setIsPremium(activeIds.includes('premium') || activeIds.includes('premium_lifetime'))
      return activeIds.length > 0
    } catch (err) {
      console.error('[Billing] Restore error:', err)
      return false
    }
  }, [])

  const getPlans = useCallback((): PurchasePlan[] => {
    if (!offerings) return []

    const plans: PurchasePlan[] = []

    // Weekly subscription
    const weekly = offerings.availablePackages.find((p: any) =>
      p.identifier === 'premium_weekly' || p.product.identifier === 'premium_weekly'
    )
    if (weekly) {
      plans.push({
        id: weekly.product.identifier,
        title: 'Semanal',
        price: weekly.product.priceString,
        priceAmountMicros: weekly.product.price,
        currencyCode: weekly.product.currencyCode,
        period: 'weekly',
        freeTrialPeriodDays: 7,
      })
    }

    // Monthly subscription
    const monthly = offerings.availablePackages.find((p: any) =>
      p.identifier === 'premium_monthly' || p.product.identifier === 'premium_monthly'
    )
    if (monthly) {
      plans.push({
        id: monthly.product.identifier,
        title: 'Mensual',
        price: monthly.product.priceString,
        priceAmountMicros: monthly.product.price,
        currencyCode: monthly.product.currencyCode,
        period: 'monthly',
        freeTrialPeriodDays: 7,
      })
    }

    // Lifetime purchase
    const lifetime = offerings.availablePackages.find((p: any) =>
      p.identifier === 'premium_lifetime' || p.product.identifier === 'premium_lifetime'
    )
    if (lifetime) {
      plans.push({
        id: lifetime.product.identifier,
        title: 'Definitivo',
        price: lifetime.product.priceString,
        priceAmountMicros: lifetime.product.price,
        currencyCode: lifetime.product.currencyCode,
        period: 'lifetime',
      })
    }

    // Fallback: if no specific packages found, list all available
    if (plans.length === 0) {
      offerings.availablePackages.forEach((pkg: any) => {
        plans.push({
          id: pkg.product.identifier,
          title: pkg.product.title || pkg.identifier,
          price: pkg.product.priceString,
          priceAmountMicros: pkg.product.price,
          currencyCode: pkg.product.currencyCode,
        })
      })
    }

    return plans
  }, [offerings])

  const purchaseByPlanId = useCallback(async (planId: string): Promise<boolean> => {
    if (!offerings) return false
    const pkg = offerings.availablePackages.find((p: any) =>
      p.product.identifier === planId || p.identifier === planId
    )
    if (!pkg) {
      console.error('[Billing] Package not found:', planId)
      return false
    }
    return purchasePackage(pkg)
  }, [offerings, purchasePackage])

  return {
    isReady,
    isPremium,
    activeEntitlements,
    loading,
    getPlans,
    purchasePackage,
    purchaseByPlanId,
    restorePurchases,
  }
}