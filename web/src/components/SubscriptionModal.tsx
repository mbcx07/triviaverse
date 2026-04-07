import { useState } from 'react'

interface SubscriptionModalProps {
  onClose: () => void
  onPurchase: (productId: string) => Promise<void>
}

export function SubscriptionModal({ onClose, onPurchase }: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'premium_weekly' | 'premium_monthly' | null>(null)
  
  const handlePurchase = async () => {
    if (!selectedPlan) return
    
    setLoading(true)
    try {
      await onPurchase(selectedPlan)
      onClose()
    } catch (error) {
      console.error('Purchase failed:', error)
      alert('Error al procesar la compra. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1a1a2e] to-[#16213e] p-6 ring-2 ring-white/20">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">👑</div>
          <h2 className="text-2xl font-black text-white">Triviverso Premium</h2>
          <p className="text-slate-400 mt-2">Desbloquea todo el contenido</p>
        </div>
        
        {/* Features */}
        <div className="bg-white/5 rounded-2xl p-4 mb-6">
          <h3 className="font-bold text-white mb-3">Beneficios Premium:</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-white">
              <span className="text-green-400">✓</span> Batallas ilimitadas
            </li>
            <li className="flex items-center gap-2 text-white">
              <span className="text-green-400">✓</span> Todas las materias desbloqueadas
            </li>
            <li className="flex items-center gap-2 text-white">
              <span className="text-green-400">✓</span> Sin publicidad
            </li>
            <li className="flex items-center gap-2 text-white">
              <span className="text-green-400">✓</span> Avatares exclusivos
            </li>
            <li className="flex items-center gap-2 text-white">
              <span className="text-green-400">✓</span> Estadísticas de progreso
            </li>
          </ul>
        </div>
        
        {/* Plans */}
        <div className="space-y-3 mb-6">
          {/* Weekly */}
          <button
            onClick={() => setSelectedPlan('premium_weekly')}
            className={`w-full rounded-2xl p-4 text-left transition-all ${
              selectedPlan === 'premium_weekly'
                ? 'bg-gradient-to-r from-[#FFD700]/30 to-[#FFA500]/20 ring-2 ring-[#FFD700]'
                : 'bg-white/5 ring-1 ring-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-white text-lg">Semanal</div>
                <div className="text-slate-400 text-sm">7 días gratis, luego $40 MXN/semana</div>
              </div>
              <div className="text-2xl font-black text-white">$40</div>
            </div>
          </button>
          
          {/* Monthly - Best Value */}
          <button
            onClick={() => setSelectedPlan('premium_monthly')}
            className={`w-full rounded-2xl p-4 text-left transition-all relative ${
              selectedPlan === 'premium_monthly'
                ? 'bg-gradient-to-r from-[#1CB0F6]/30 to-[#0078D7]/20 ring-2 ring-[#1CB0F6]'
                : 'bg-white/5 ring-1 ring-white/10 hover:bg-white/10'
            }`}
          >
            <div className="absolute -top-2 left-4 bg-[#1CB0F6] text-white text-xs font-bold px-2 py-1 rounded-full">
              MEJOR VALOR
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-white text-lg">Mensual</div>
                <div className="text-slate-400 text-sm">7 días gratis, luego $120 MXN/mes</div>
              </div>
              <div className="text-2xl font-black text-white">$120</div>
            </div>
            <div className="text-green-400 text-sm mt-1">¡Ahorra $40 vs semanal!</div>
          </button>
        </div>
        
        {/* Trial notice */}
        <div className="text-center text-slate-400 text-sm mb-4">
          🎁 <span className="text-white font-bold">7 días gratis</span> — Cancela cuando quieras
        </div>
        
        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="rounded-2xl bg-slate-800 py-3 text-sm font-bold text-white ring-1 ring-white/10 hover:bg-slate-700"
          >
            Cerrar
          </button>
          <button
            onClick={handlePurchase}
            disabled={!selectedPlan || loading}
            className={`rounded-2xl py-3 text-sm font-bold text-white transition-all ${
              selectedPlan && !loading
                ? 'bg-gradient-to-b from-[#1CB0F6] to-[#0078D7] ring-2 ring-[#0078D7] active:scale-95'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Procesando...' : 'Suscribirse'}
          </button>
        </div>
        
        {/* Terms */}
        <div className="text-center text-xs text-slate-500 mt-4">
          Al suscribirte, aceptas los términos de Google Play.
          Cancela en cualquier momento desde Play Store.
        </div>
      </div>
    </div>
  )
}