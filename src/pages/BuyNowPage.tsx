import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import API_URL from '../lib/api'

export default function BuyNowPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [productType, setProductType] = useState<'standard' | 'premium'>('premium')
  const [isHovering, setIsHovering] = useState(false)

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

  // Auto-fill from Google auth
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

  // Subtle entrance animation on load
  useEffect(() => {
    const el = document.getElementById('checkout-container')
    if (el) {
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    }
  }, [])

  const price = productType === 'standard' ? 999 : 2499
  
  const handleCheckout = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.address) {
      alert("Please fill in all required shipping details.")
      return
    }
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          productType: productType === 'standard' ? 'Standard Card' : 'Metal Card',
          totalPrice: `₹${price.toLocaleString()}`,
          shippingAddress: formData.address
        })
      })
      
      if (response.ok) {
        const order = await response.json()
        navigate('/confirmation', { state: { order } })
      } else {
        alert("Failed to place order. Please try again.")
      }
    } catch (e) {
      alert("Network error. Is the backend running?")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen font-sans">
      {/* Top Navigation Shell */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 py-4 transition-all duration-500">
        <div className="flex justify-between items-center max-w-[1440px] mx-auto px-margin-desktop">
          <Link to="/" className="font-headline-lg text-[24px] font-black tracking-tighter text-tertiary">BrandEazy</Link>
          <div className="hidden md:flex gap-10 items-center">
             <Link to="/" className="font-label-sm text-label-sm uppercase tracking-widest text-secondary hover:text-primary transition-colors duration-300">Back to Home</Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-24 px-margin-mobile md:px-margin-desktop min-h-screen bg-surface flex items-center justify-center">
        <div 
          id="checkout-container"
          className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-12 gap-12 opacity-0 translate-y-12 transition-all duration-1000 ease-out"
        >
          {/* LEFT: Checkout Form */}
          <div className="lg:col-span-7 space-y-12">
            <div>
              <h1 className="font-headline-lg text-[40px] md:text-[56px] text-primary leading-tight tracking-tight mb-4">Complete your setup.</h1>
              <p className="font-body-md text-secondary max-w-lg">Tell us where to ship your card and link your Google Business profile. It takes less than two minutes.</p>
            </div>

            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
              {/* Product Selection */}
              <div className="space-y-4">
                <h3 className="font-label-sm uppercase tracking-widest text-primary mb-2">1. Select Finish</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    onClick={() => setProductType('standard')}
                    className={`p-6 rounded-xl border cursor-pointer transition-all duration-300 ${productType === 'standard' ? 'border-primary bg-surface-container-low shadow-xl' : 'border-outline-variant/30 hover:border-outline bg-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="material-symbols-outlined text-primary text-[32px]">credit_card</span>
                      {productType === 'standard' && <span className="material-symbols-outlined text-primary">check_circle</span>}
                    </div>
                    <h4 className="font-headline-lg text-[20px] mb-1">Standard Card</h4>
                    <p className="font-body-md text-secondary text-sm mb-4">Matte plastic, heavy duty.</p>
                    <div className="font-headline-lg text-[24px]">₹999</div>
                  </div>

                  <div 
                    onClick={() => setProductType('premium')}
                    className={`p-6 rounded-xl border cursor-pointer transition-all duration-300 relative overflow-hidden ${productType === 'premium' ? 'border-primary bg-tertiary text-on-tertiary shadow-2xl scale-[1.02]' : 'border-outline-variant/30 hover:border-outline bg-transparent'}`}
                  >
                    {/* Metal sheen effect */}
                    {productType === 'premium' && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>}
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <span className={`material-symbols-outlined text-[32px] ${productType === 'premium' ? 'text-white' : 'text-primary'}`}>workspace_premium</span>
                      {productType === 'premium' && <span className="material-symbols-outlined text-white">check_circle</span>}
                    </div>
                    <h4 className={`font-headline-lg text-[20px] mb-1 relative z-10 ${productType === 'premium' ? 'text-white' : 'text-primary'}`}>Metal Card</h4>
                    <p className={`font-body-md text-sm mb-4 relative z-10 ${productType === 'premium' ? 'text-white/60' : 'text-secondary'}`}>Laser-etched industrial steel.</p>
                    <div className={`font-headline-lg text-[24px] relative z-10 ${productType === 'premium' ? 'text-white' : 'text-primary'}`}>₹2,499</div>
                  </div>
                </div>
              </div>

              {/* Shipping Details */}
              <div className="space-y-4">
                <h3 className="font-label-sm uppercase tracking-widest text-primary mb-2">2. Shipping Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} type="text" placeholder="First Name" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors font-body-md" required />
                  <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} type="text" placeholder="Last Name" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors font-body-md" required />
                  <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" placeholder="Email Address" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors font-body-md" required />
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} type="tel" placeholder="Phone Number" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors font-body-md" />
                  <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full Shipping Address" rows={3} className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors font-body-md md:col-span-2 resize-none" required></textarea>
                </div>
              </div>

              {/* Business Config */}
              <div className="space-y-4">
                <h3 className="font-label-sm uppercase tracking-widest text-primary mb-2">3. Digital Setup</h3>
                <div className="grid grid-cols-1 gap-4">
                  <input value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} type="text" placeholder="Business Name" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors font-body-md" />
                  <input value={formData.googleLink} onChange={e => setFormData({...formData, googleLink: e.target.value})} type="text" placeholder="Google Review Link (Optional)" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors font-body-md" />
                  <p className="font-body-md text-sm text-secondary">You can always update your destination link later in your dashboard.</p>
                </div>
              </div>
            </form>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-32 bg-surface-container-low border border-outline-variant/30 rounded-[24px] p-8 shadow-xl">
              
              <h3 className="font-headline-lg text-[24px] text-primary mb-8 border-b border-outline-variant/30 pb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center font-body-md">
                  <span className="text-secondary">{productType === 'standard' ? 'Standard Card' : 'Premium Metal Card'}</span>
                  <span className="text-primary font-medium">₹{price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center font-body-md">
                  <span className="text-secondary">Dashboard Lifetime Access</span>
                  <span className="text-primary font-medium">Included</span>
                </div>
                <div className="flex justify-between items-center font-body-md">
                  <span className="text-secondary">Express Shipping</span>
                  <span className="text-primary font-medium">Free</span>
                </div>
              </div>

              <div className="border-t border-outline-variant/30 pt-6 mb-8">
                <div className="flex justify-between items-end">
                  <span className="font-label-sm uppercase tracking-widest text-secondary">Total Due</span>
                  <span className="font-headline-lg text-[32px] text-primary leading-none">₹{price.toLocaleString()}</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className={`w-full bg-primary text-on-primary py-4 rounded-xl font-label-sm text-label-sm uppercase tracking-widest transition-all duration-300 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute inset-0 bg-white/20 transform transition-transform duration-500 ease-out ${isHovering && !isSubmitting ? 'translate-x-0' : '-translate-x-full'}`}></div>
                <span className="relative z-10">{isSubmitting ? 'Processing...' : 'Proceed to Payment'}</span>
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-secondary font-label-sm opacity-60">
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
