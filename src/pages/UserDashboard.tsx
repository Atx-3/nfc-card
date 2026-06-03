import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import API_URL from '../lib/api'

axios.defaults.withCredentials = true

type OrderStatus = 'Order Placed' | 'Processing' | 'Laser Engraving' | 'Shipped' | 'Delivered'

interface Order {
  id: string
  orderNumber: string
  productType: string
  totalPrice: string
  status: OrderStatus
  shippingAddress: string
  createdAt: string
}

const STATUS_STEPS: OrderStatus[] = ['Order Placed', 'Processing', 'Laser Engraving', 'Shipped', 'Delivered']

const STATUS_ICONS: Record<OrderStatus, string> = {
  'Order Placed': 'receipt_long',
  'Processing': 'settings',
  'Laser Engraving': 'auto_fix',
  'Shipped': 'local_shipping',
  'Delivered': 'check_circle'
}

export default function UserDashboard() {
  const { user, logout } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders/my`)
      setOrders(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    // Poll for status updates every 30s
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStepIndex = (status: OrderStatus) => STATUS_STEPS.indexOf(status)

  return (
    <div className="bg-surface text-on-surface min-h-screen font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 py-4">
        <div className="flex justify-between items-center max-w-[1200px] mx-auto px-6">
          <Link to="/" className="font-headline-lg text-[22px] font-black tracking-tighter text-primary">BrandEazy</Link>
          <div className="flex items-center gap-4">
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full border border-outline-variant/40" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="font-body-md text-secondary hidden md:block">{user?.name}</span>
            <button
              onClick={logout}
              className="font-label-sm uppercase tracking-widest text-secondary hover:text-error transition-colors cursor-pointer bg-transparent border-none"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-6 max-w-[1000px] mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-headline-lg text-[36px] text-primary mb-2">
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="font-body-md text-secondary">Here are your NFC card orders and their live status.</p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-10 flex-wrap">
          <Link
            to="/buy"
            className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-label-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Order New Card
          </Link>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/30 text-secondary px-6 py-3 rounded-xl font-label-sm uppercase tracking-widest hover:text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh Status
          </button>
        </div>

        {/* Orders */}
        {isLoading ? (
          <div className="text-center py-20 text-secondary font-body-md">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-[20px] p-16 text-center">
            <span className="material-symbols-outlined text-[64px] text-secondary mb-4 block">inbox</span>
            <h2 className="font-headline-lg text-[24px] text-primary mb-3">No orders yet</h2>
            <p className="font-body-md text-secondary mb-8">You haven't placed any NFC card orders. Get yours today!</p>
            <Link to="/buy" className="inline-flex items-center gap-2 bg-primary text-on-primary px-8 py-3 rounded-xl font-label-sm uppercase tracking-widest hover:opacity-90 transition-opacity">
              Shop Now →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => {
              const currentStep = getStepIndex(order.status)
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                  className="bg-surface-container-low border border-outline-variant/30 rounded-[20px] p-6 cursor-pointer hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
                >
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
                    <div>
                      <p className="font-mono text-sm text-secondary mb-1">{order.orderNumber}</p>
                      <h3 className="font-headline-lg text-[20px] text-primary">{order.productType}</h3>
                      <p className="font-body-md text-secondary text-sm mt-1">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-headline-lg text-[22px] text-primary">{order.totalPrice}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                        order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                        order.status === 'Shipped' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="relative">
                    <div className="flex items-center justify-between relative">
                      {/* Progress bar */}
                      <div className="absolute top-4 left-0 right-0 h-0.5 bg-outline-variant/30">
                        <div
                          className="h-full bg-primary transition-all duration-700"
                          style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
                        />
                      </div>

                      {STATUS_STEPS.map((step, i) => {
                        const done = i < currentStep
                        const active = i === currentStep
                        return (
                          <div key={step} className="flex flex-col items-center gap-2 relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                              done ? 'bg-emerald-500 text-white' :
                              active ? 'bg-primary text-on-primary shadow-[0_0_20px_rgba(var(--color-primary)/0.4)] animate-pulse' :
                              'bg-surface-container-low border-2 border-outline-variant/30 text-secondary'
                            }`}>
                              <span className="material-symbols-outlined text-[14px]">
                                {done ? 'check' : STATUS_ICONS[step]}
                              </span>
                            </div>
                            <p className={`font-label-sm text-[10px] uppercase tracking-widest text-center max-w-[60px] ${active ? 'text-primary' : done ? 'text-emerald-400' : 'text-secondary'}`}>
                              {step}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedOrder?.id === order.id && (
                    <div className="mt-6 pt-6 border-t border-outline-variant/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-label-sm uppercase tracking-widest text-secondary mb-2">Shipping Address</h4>
                          <p className="font-body-md text-primary whitespace-pre-line">{order.shippingAddress || 'N/A'}</p>
                        </div>
                        <div>
                          <h4 className="font-label-sm uppercase tracking-widest text-secondary mb-2">Order Info</h4>
                          <p className="font-body-md text-primary">Product: {order.productType}</p>
                          <p className="font-body-md text-primary">Total: {order.totalPrice}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
