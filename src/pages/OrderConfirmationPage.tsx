import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

type OrderStatus = 'Order Placed' | 'Processing' | 'Laser Engraving' | 'Shipped' | 'Delivered'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  productType: string
  totalPrice: string
  status: OrderStatus
  shippingAddress?: string
  createdAt: string
}

const STATUS_STEPS: OrderStatus[] = ['Order Placed', 'Processing', 'Laser Engraving', 'Shipped', 'Delivered']

export default function OrderConfirmationPage() {
  const location = useLocation()
  const order: Order | null = location.state?.order ?? null

  useEffect(() => {
    const el = document.getElementById('confirmation-container')
    if (el) {
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    }
  }, [])

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : 0

  return (
    <div className="bg-surface text-on-surface min-h-screen font-sans">
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 py-4 transition-all duration-500">
        <div className="flex justify-between items-center max-w-[1440px] mx-auto px-6">
          <Link to="/" className="font-headline-lg text-[24px] font-black tracking-tighter text-tertiary">BrandEazy</Link>
          <Link to="/dashboard" className="font-label-sm text-label-sm uppercase tracking-widest text-secondary hover:text-primary transition-colors duration-300">
            My Orders
          </Link>
        </div>
      </nav>

      <section className="pt-32 pb-24 px-6 md:px-10 min-h-screen bg-surface flex flex-col items-center justify-center">
        <div
          id="confirmation-container"
          className="max-w-[800px] w-full space-y-10 opacity-0 translate-y-12 transition-all duration-1000 ease-out"
        >
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 text-emerald-500 mb-2 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <span className="material-symbols-outlined text-[48px]">check_circle</span>
            </div>
            <h1 className="font-headline-lg text-[40px] md:text-[56px] text-primary leading-tight tracking-tight">
              Order Confirmed.
            </h1>
            <p className="font-body-md text-secondary max-w-lg mx-auto">
              Your premium NFC card is being prepared for manufacturing. We will notify you once it ships.
            </p>
            {order && (
              <div className="inline-block px-6 py-2 rounded-full border border-outline-variant/50 bg-surface-container-low font-mono text-sm text-secondary tracking-widest mt-4">
                {order.orderNumber}
              </div>
            )}
          </div>

          {/* Live Tracking Timeline */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-[24px] p-8 md:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
            <h3 className="font-headline-lg text-[24px] text-primary mb-8 border-b border-outline-variant/30 pb-6 relative z-10">
              Track Your Order
            </h3>
            <div className="relative z-10">
              {STATUS_STEPS.map((step, index) => {
                const done = index < currentStep
                const active = index === currentStep
                return (
                  <div key={index} className="flex gap-6 relative">
                    {index !== STATUS_STEPS.length - 1 && (
                      <div className={`absolute top-8 left-3 w-0.5 h-full -ml-px ${done ? 'bg-emerald-500' : 'bg-outline-variant'}`} />
                    )}
                    <div className={`relative flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-1 border-2 z-10 ${done ? 'border-emerald-500 bg-emerald-500' : active ? 'border-blue-500 bg-surface-container-low' : 'border-outline-variant/50 bg-surface-container-low'}`}>
                      {done && <span className="material-symbols-outlined text-[14px] text-white">check</span>}
                      {active && <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-pulse" />}
                      {!done && !active && <div className="w-2 h-2 rounded-full bg-outline-variant/50" />}
                    </div>
                    <div className="pb-10">
                      <h4 className={`font-headline-lg text-[18px] mb-1 ${!done && !active ? 'text-secondary' : 'text-primary'}`}>
                        {step}
                      </h4>
                      <p className="font-body-md text-sm text-secondary opacity-80">
                        {done ? 'Completed' : active ? 'In Progress' : 'Pending'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order Details */}
          {order && (
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-[16px] p-8 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-label-sm uppercase tracking-widest text-secondary mb-3">Shipping To</h4>
                  <p className="font-body-md text-primary leading-relaxed whitespace-pre-line">
                    {order.customerName}{'\n'}{order.shippingAddress}
                  </p>
                </div>
                <div>
                  <h4 className="font-label-sm uppercase tracking-widest text-secondary mb-3">Order Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between font-body-md text-primary">
                      <span>1x {order.productType}</span>
                      <span>{order.totalPrice}</span>
                    </div>
                    <div className="flex justify-between font-body-md text-secondary">
                      <span>Express Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="flex justify-between font-body-md font-semibold text-primary pt-2 border-t border-outline-variant/30">
                      <span>Total Paid</span>
                      <span>{order.totalPrice}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 justify-center mt-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-primary text-on-primary px-8 py-3 rounded-xl font-label-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">track_changes</span>
              Track in My Orders
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-transparent border border-outline-variant text-primary px-8 py-3 rounded-xl font-label-sm uppercase tracking-widest hover:bg-surface-container-highest transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
