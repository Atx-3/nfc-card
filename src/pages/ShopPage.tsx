import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import CartSidebar from '../components/CartSidebar'
import API_URL from '../lib/api'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image?: string
  badge?: string
  inStock: boolean
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { addItem, count, openCart } = useCart()
  const [addedId, setAddedId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then(r => r.json())
      .then(data => {
        // If no products in DB yet, show defaults
        if (!Array.isArray(data) || data.length === 0) {
          setProducts([
            { id: 'standard', name: 'Standard NFC Card', description: 'Matte plastic, heavy duty. Perfect for everyday networking.', price: 999, badge: 'Popular', inStock: true },
            { id: 'metal', name: 'Metal NFC Card', description: 'Laser-etched industrial steel. Premium feel, lasting impression.', price: 2499, badge: 'Premium', inStock: true }
          ])
        } else {
          setProducts(data)
        }
      })
      .catch(() => {
        setProducts([
          { id: 'standard', name: 'Standard NFC Card', description: 'Matte plastic, heavy duty.', price: 999, badge: 'Popular', inStock: true },
          { id: 'metal', name: 'Metal NFC Card', description: 'Laser-etched industrial steel.', price: 2499, badge: 'Premium', inStock: true }
        ])
      })
      .finally(() => setIsLoading(false))
  }, [])

  const handleAddToCart = (product: Product) => {
    addItem({ id: product.id, name: product.name, price: product.price, image: product.image, badge: product.badge })
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1500)
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen font-sans">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-30 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 py-4">
        <div className="flex justify-between items-center max-w-[1440px] mx-auto px-6 md:px-12">
          <Link to="/" className="font-headline-lg text-[24px] font-black tracking-tighter text-primary">BrandEazy</Link>
          <div className="flex items-center gap-6">
            <Link to="/" className="font-label-sm uppercase tracking-widest text-secondary hover:text-primary transition-colors hidden md:block">Home</Link>
            <button
              onClick={openCart}
              className="relative flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-label-sm uppercase tracking-widest hover:opacity-90 transition-opacity cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
              Cart
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-error text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <CartSidebar />

      <section className="pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="mb-12">
            <p className="font-label-sm uppercase tracking-widest text-secondary mb-3">Our Products</p>
            <h1 className="font-headline-lg text-[40px] md:text-[56px] text-primary leading-tight tracking-tight">
              NFC Business Cards
            </h1>
            <p className="font-body-md text-secondary mt-4 max-w-lg">
              Tap to share your profile, Google reviews, social links, or any URL — instantly.
            </p>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="bg-surface-container-low border border-outline-variant/20 rounded-[24px] p-8 animate-pulse">
                  <div className="h-40 bg-surface-container-highest/30 rounded-xl mb-6" />
                  <div className="h-4 bg-surface-container-highest/30 rounded mb-3 w-3/4" />
                  <div className="h-3 bg-surface-container-highest/20 rounded mb-6 w-full" />
                  <div className="h-10 bg-surface-container-highest/30 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div
                  key={product.id}
                  className={`group bg-surface-container-low border rounded-[24px] p-8 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    !product.inStock ? 'opacity-60 border-outline-variant/20' : 'border-outline-variant/30 hover:border-primary/30'
                  }`}
                >
                  {/* Image / Icon */}
                  <div className="w-full h-44 rounded-xl bg-primary/5 flex items-center justify-center mb-6 overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-primary/30 text-[72px]">credit_card</span>
                    )}
                  </div>

                  {/* Badge */}
                  {product.badge && (
                    <span className="self-start mb-3 text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                      {product.badge}
                    </span>
                  )}

                  <h3 className="font-headline-lg text-[22px] text-primary mb-2">{product.name}</h3>
                  <p className="font-body-md text-secondary text-sm flex-1 mb-6">{product.description}</p>

                  <div className="flex items-center justify-between mb-6">
                    <span className="font-headline-lg text-[28px] text-primary">₹{product.price.toLocaleString()}</span>
                    {!product.inStock && (
                      <span className="text-xs font-semibold text-error bg-error/10 px-3 py-1 rounded-full">Out of Stock</span>
                    )}
                  </div>

                  <button
                    disabled={!product.inStock}
                    onClick={() => handleAddToCart(product)}
                    className={`w-full py-4 rounded-xl font-label-sm uppercase tracking-widest transition-all duration-300 cursor-pointer border-none flex items-center justify-center gap-2 ${
                      addedId === product.id
                        ? 'bg-emerald-500 text-white'
                        : product.inStock
                        ? 'bg-primary text-on-primary hover:opacity-90'
                        : 'bg-surface-container-highest text-secondary cursor-not-allowed'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {addedId === product.id ? 'check_circle' : 'add_shopping_cart'}
                    </span>
                    {addedId === product.id ? 'Added!' : product.inStock ? 'Add to Cart' : 'Unavailable'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Features strip */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: 'bolt', title: 'Instant Share', desc: 'One tap to share your profile — no app needed.' },
              { icon: 'local_shipping', title: 'Free Shipping', desc: 'Express delivery across India at no extra cost.' },
              { icon: 'edit', title: 'Update Anytime', desc: 'Change your link anytime from your dashboard.' }
            ].map(f => (
              <div key={f.title} className="flex gap-4 items-start p-6 bg-surface-container-low border border-outline-variant/20 rounded-2xl">
                <span className="material-symbols-outlined text-primary text-[28px] mt-0.5">{f.icon}</span>
                <div>
                  <p className="font-body-md font-semibold text-primary mb-1">{f.title}</p>
                  <p className="font-body-md text-secondary text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
