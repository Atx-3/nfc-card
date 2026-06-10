import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import API_URL from '../lib/api'

export default function BuyNowPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, total, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    businessName: '',
    googleLink: ''
  })

  useEffect(() => {
    if (user) {
      const parts = user.name.split(' ')
      setFormData(prev => ({
        ...prev,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        email: user.email
      }))
    }
  }, [user])

  // Redirect to shop if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/shop')
    }
  }, [items, navigate])

  const handleCheckout = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.address) {
      alert('Please fill in all required shipping details.')
      return
    }

    setIsSubmitting(true)
    try {
      const productType = items.map(i => `${i.name} x${i.quantity}`).join(', ')
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          productType,
          totalPrice: `₹${total.toLocaleString()}`,
          shippingAddress: formData.address,
          cartItems: items
        })
      })

      if (response.ok) {
        const order = await response.json()
        clearCart()
        navigate('/confirmation', { state: { order } })
      } else {
        alert('Failed to place order. Please try again.')
      }
    } catch {
      alert('Network error. Is the backend running?')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen font-sans">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 py-4">
        <div className="flex justify-between items-center max-w-[1440px] mx-auto px-6 md:px-12">
          <Link to="/" className="font-headline-lg text-[24px] font-black tracking-tighter text-tertiary">BrandEazy</Link>
          <Link to="/shop" className="font-label-sm text-label-sm uppercase tracking-widest text-secondary hover:text-primary transition-colors">
            ← Back to Shop
          </Link>
        </div>
      </nav>

      <section className="pt-32 pb-24 px-6 md:px-12 min-h-screen">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* LEFT: Checkout Form */}
          <div className="lg:col-span-7 space-y-10">
            <div>
              <h1 className="font-headline-lg text-[40px] md:text-[52px] text-primary leading-tight tracking-tight mb-3">
                Complete your order.
              </h1>
              <p className="font-body-md text-secondary">Tell us where to ship your card. Takes under two minutes.</p>
            </div>

            <form className="space-y-8" onSubmit={e => e.preventDefault()}>
              {/* Shipping Details */}
              <div className="space-y-4">
                <h3 className="font-label-sm uppercase tracking-widest text-primary">1. Shipping Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    type="text" placeholder="First Name *"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors font-body-md"
                    required
                  />
                  <input
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    type="text" placeholder="Last Name *"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors font-body-md"
                    required
                  />
                  <input
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    type="email" placeholder="Email Address *"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors font-body-md"
                    required
                  />
                  <input
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    type="tel" placeholder="Phone Number"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors font-body-md"
                  />
                  <textarea
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full Shipping Address *" rows={3}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors font-body-md md:col-span-2 resize-none"
                    required
                  />
                </div>
              </div>

              {/* Digital Setup */}
              <div className="space-y-4">
                <h3 className="font-label-sm uppercase tracking-widest text-primary">2. Digital Setup</h3>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    value={formData.businessName}
                    onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                    type="text" placeholder="Business Name (Optional)"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors font-body-md"
                  />
                  <input
                    value={formData.googleLink}
                    onChange={e => setFormData({ ...formData, googleLink: e.target.value })}
                    type="text" placeholder="Google Review / Profile Link (Optional)"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors font-body-md"
                  />
                  <p className="font-body-md text-sm text-secondary">
                    You can update your destination link anytime from your dashboard.
                  </p>
                </div>
              </div>
            </form>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-32 bg-surface-container-low border border-outline-variant/30 rounded-[24px] p-8 shadow-xl">
              <h3 className="font-headline-lg text-[22px] text-primary mb-6 border-b border-outline-variant/30 pb-5">
                Order Summary
              </h3>

              {/* Cart Items */}
              <div className="space-y-3 mb-6">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-[18px]">credit_card</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body-md text-primary text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-secondary">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-body-md text-primary font-medium whitespace-nowrap">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 pt-4 border-t border-outline-variant/20">
                <div className="flex justify-between font-body-md text-sm">
                  <span className="text-secondary">Shipping</span>
                  <span className="text-primary font-medium">Free</span>
                </div>
                <div className="flex justify-between font-body-md text-sm">
                  <span className="text-secondary">Dashboard Access</span>
                  <span className="text-primary font-medium">Included</span>
                </div>
              </div>

              <div className="border-t border-outline-variant/30 pt-5 mb-6">
                <div className="flex justify-between items-end">
                  <span className="font-label-sm uppercase tracking-widest text-secondary">Total</span>
                  <span className="font-headline-lg text-[32px] text-primary leading-none">₹{total.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting}
                className={`w-full bg-primary text-on-primary py-4 rounded-xl font-label-sm uppercase tracking-widest hover:opacity-90 transition-opacity cursor-pointer border-none ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Processing...' : 'Place Order'}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-secondary font-label-sm opacity-60">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                SECURE 256-BIT ENCRYPTION
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}
