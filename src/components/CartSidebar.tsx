import { useCart } from '../contexts/CartContext'
import { useNavigate } from 'react-router-dom'

export default function CartSidebar() {
  const { items, removeItem, updateQty, total, count, isOpen, closeCart } = useCart()
  const navigate = useNavigate()

  const handleCheckout = () => {
    closeCart()
    navigate('/buy')
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-[420px] bg-surface border-l border-outline-variant/30 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">shopping_cart</span>
            <h2 className="font-headline-lg text-[22px] text-primary">Your Cart</h2>
            {count > 0 && (
              <span className="bg-primary text-on-primary text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>
            )}
          </div>
          <button onClick={closeCart} className="text-secondary hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-1">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-20">
              <span className="material-symbols-outlined text-[64px] text-secondary/30">shopping_cart</span>
              <p className="font-body-md text-secondary">Your cart is empty</p>
              <button
                onClick={closeCart}
                className="font-label-sm uppercase tracking-widest text-primary border border-primary/30 px-6 py-2 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer bg-transparent"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl p-4">
                {/* Product icon / image */}
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span className="material-symbols-outlined text-primary text-[28px]">credit_card</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-body-md font-semibold text-primary truncate">{item.name}</p>
                      {item.badge && (
                        <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{item.badge}</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-secondary hover:text-error transition-colors cursor-pointer bg-transparent border-none flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 bg-surface-container-highest/30 rounded-lg p-1">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-secondary hover:text-primary hover:bg-surface transition-all cursor-pointer bg-transparent border-none"
                      >
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                      </button>
                      <span className="font-body-md font-semibold text-primary w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-secondary hover:text-primary hover:bg-surface transition-all cursor-pointer bg-transparent border-none"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>
                    <p className="font-headline-lg text-[18px] text-primary">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-outline-variant/30 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-label-sm uppercase tracking-widest text-secondary">Total</span>
              <span className="font-headline-lg text-[28px] text-primary">₹{total.toLocaleString()}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-label-sm uppercase tracking-widest hover:opacity-90 transition-opacity cursor-pointer border-none"
            >
              Proceed to Checkout
            </button>
            <p className="text-center font-label-sm text-secondary/60 uppercase tracking-widest text-xs">
              Free shipping · Secure checkout
            </p>
          </div>
        )}
      </div>
    </>
  )
}
