import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import API_URL from '../lib/api'

axios.defaults.withCredentials = true

type OrderStatus = 'Order Placed' | 'Processing' | 'Laser Engraving' | 'Shipped' | 'Delivered'
const ALL_STATUSES: OrderStatus[] = ['Order Placed', 'Processing', 'Laser Engraving', 'Shipped', 'Delivered']

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  productType: string
  totalPrice: string
  status: OrderStatus
  shippingAddress?: string
  cartItems?: string
  createdAt: string
  user?: { name: string; email: string; picture?: string }
}

interface User {
  id: string
  name: string
  email: string
  picture?: string
  cardType: string
  createdAt: string
  orders: Order[]
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  image?: string
  badge?: string
  inStock: boolean
}

interface Stats {
  totalOrders: number
  totalUsers: number
  totalRevenue: number
  statusCounts: Record<string, number>
  recentOrders: number
}

const EMPTY_PRODUCT = { name: '', description: '', price: '', image: '', badge: '', inStock: true }

export default function AdminDashboard() {
  const { user: adminUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'products' | 'users'>('stats')
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<OrderStatus>('Order Placed')
  const [updating, setUpdating] = useState(false)
  const [search, setSearch] = useState('')

  // Product modal
  const [productModal, setProductModal] = useState<'create' | 'edit' | null>(null)
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [savingProduct, setSavingProduct] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  const fetchAll = async () => {
    try {
      const [ordersRes, usersRes, productsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/orders`),
        axios.get(`${API_URL}/api/users`),
        axios.get(`${API_URL}/api/products`),
        axios.get(`${API_URL}/api/stats`)
      ])
      setOrders(ordersRes.data)
      setUsers(usersRes.data)
      setProducts(productsRes.data)
      setStats(statsRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 15000)
    return () => clearInterval(interval)
  }, [])

  // ── Order helpers ────────────────────────────────────────────────────────
  const handleOpenOrder = (order: Order) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
  }

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return
    setUpdating(true)
    try {
      await axios.patch(`${API_URL}/api/orders/${selectedOrder.id}/status`, { status: newStatus })
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o))
      setSelectedOrder({ ...selectedOrder, status: newStatus })
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  // ── Product helpers ──────────────────────────────────────────────────────
  const openCreateProduct = () => {
    setProductForm(EMPTY_PRODUCT)
    setEditingProductId(null)
    setProductModal('create')
  }

  const openEditProduct = (p: Product) => {
    setProductForm({ name: p.name, description: p.description, price: String(p.price), image: p.image || '', badge: p.badge || '', inStock: p.inStock })
    setEditingProductId(p.id)
    setProductModal('edit')
  }

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) return
    setSavingProduct(true)
    try {
      if (productModal === 'create') {
        const res = await axios.post(`${API_URL}/api/products`, productForm)
        setProducts(prev => [...prev, res.data])
      } else if (editingProductId) {
        const res = await axios.patch(`${API_URL}/api/products/${editingProductId}`, productForm)
        setProducts(prev => prev.map(p => p.id === editingProductId ? res.data : p))
      }
      setProductModal(null)
    } catch (e) {
      console.error(e)
    } finally {
      setSavingProduct(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return
    setDeletingProductId(id)
    try {
      await axios.delete(`${API_URL}/api/products/${id}`)
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingProductId(null)
    }
  }

  // ── Filters ──────────────────────────────────────────────────────────────
  const statusColor = (s: string) => {
    if (s === 'Delivered') return 'bg-emerald-500/10 text-emerald-400'
    if (s === 'Shipped') return 'bg-blue-500/10 text-blue-400'
    if (s === 'Laser Engraving') return 'bg-purple-500/10 text-purple-400'
    if (s === 'Processing') return 'bg-yellow-500/10 text-yellow-400'
    return 'bg-primary/10 text-primary'
  }

  const filteredOrders = orders.filter(o =>
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.customerEmail.toLowerCase().includes(search.toLowerCase())
  )

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const NAV = [
    { id: 'stats', label: 'Dashboard', icon: 'dashboard' },
    { id: 'orders', label: `Orders (${orders.length})`, icon: 'shopping_cart' },
    { id: 'products', label: `Products (${products.length})`, icon: 'inventory_2' },
    { id: 'users', label: `Users (${users.length})`, icon: 'group' }
  ] as const

  return (
    <div className="bg-surface text-on-surface min-h-screen font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-surface-container-low border-r border-outline-variant/30 flex flex-col h-auto md:h-screen sticky top-0 z-40">
        <div className="p-6 border-b border-outline-variant/30">
          <Link to="/" className="font-headline-lg text-[22px] font-black tracking-tighter text-primary">
            BrandEazy <span className="text-secondary font-medium text-[14px]">Admin</span>
          </Link>
        </div>

        {/* Admin Profile */}
        <div className="p-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-highest/30">
            {adminUser?.picture ? (
              <img src={adminUser.picture} alt={adminUser.name} className="w-9 h-9 rounded-full" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {adminUser?.name?.[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-body-md text-sm text-primary font-semibold truncate">{adminUser?.name}</p>
              <p className="font-body-md text-xs text-secondary truncate">{adminUser?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="p-4 flex-1 space-y-1.5">
          {NAV.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSearch('') }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-label-sm uppercase tracking-widest transition-colors cursor-pointer border-none ${
                activeTab === id ? 'bg-primary text-on-primary' : 'text-secondary hover:bg-surface-variant/50 bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-outline-variant/30">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-label-sm uppercase tracking-widest text-error hover:bg-error-container/20 transition-colors cursor-pointer bg-transparent border-none"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto min-h-screen">
        <div className="max-w-[1100px] mx-auto space-y-6">

          {/* ── STATS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-headline-lg text-[32px] text-primary">Dashboard</h1>
                <p className="font-body-md text-secondary">Welcome back, {adminUser?.name?.split(' ')[0]}.</p>
              </div>

              {isLoading || !stats ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 animate-pulse h-28" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: 'payments', color: 'text-emerald-400' },
                      { label: 'Total Orders', value: stats.totalOrders, icon: 'shopping_cart', color: 'text-blue-400' },
                      { label: 'Total Users', value: stats.totalUsers, icon: 'group', color: 'text-purple-400' },
                      { label: 'Orders (30d)', value: stats.recentOrders, icon: 'trending_up', color: 'text-primary' }
                    ].map(card => (
                      <div key={card.label} className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6">
                        <div className="flex justify-between items-start mb-4">
                          <p className="font-label-sm uppercase tracking-widest text-secondary text-xs">{card.label}</p>
                          <span className={`material-symbols-outlined text-[20px] ${card.color}`}>{card.icon}</span>
                        </div>
                        <p className="font-headline-lg text-[28px] text-primary">{card.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Status Breakdown */}
                  <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6">
                    <h2 className="font-headline-lg text-[20px] text-primary mb-5">Orders by Status</h2>
                    <div className="space-y-3">
                      {ALL_STATUSES.map(s => {
                        const count = stats.statusCounts[s] || 0
                        const pct = stats.totalOrders > 0 ? (count / stats.totalOrders) * 100 : 0
                        return (
                          <div key={s}>
                            <div className="flex justify-between mb-1">
                              <span className="font-body-md text-sm text-primary">{s}</span>
                              <span className="font-body-md text-sm text-secondary">{count}</span>
                            </div>
                            <div className="w-full bg-surface-container-highest/30 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-primary transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-5">
                      <h2 className="font-headline-lg text-[20px] text-primary">Recent Orders</h2>
                      <button onClick={() => setActiveTab('orders')} className="font-label-sm uppercase tracking-widest text-secondary hover:text-primary text-xs cursor-pointer bg-transparent border-none">
                        View All →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {orders.slice(0, 5).map(order => (
                        <div key={order.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container-highest/20 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-primary text-[18px]">receipt</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-body-md text-sm text-primary font-medium">{order.customerName}</p>
                            <p className="text-xs text-secondary">{order.orderNumber} · {order.productType}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-body-md text-sm text-primary font-medium">{order.totalPrice}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor(order.status)}`}>{order.status}</span>
                          </div>
                        </div>
                      ))}
                      {orders.length === 0 && <p className="text-secondary text-sm text-center py-4">No orders yet.</p>}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── ORDERS TAB ────────────────────────────────────────────── */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end flex-wrap gap-4">
                <div>
                  <h1 className="font-headline-lg text-[32px] text-primary">Order Management</h1>
                  <p className="font-body-md text-secondary">Click any order to update its status.</p>
                </div>
                <button onClick={fetchAll} className="flex items-center gap-2 border border-outline-variant/30 px-4 py-2 rounded-lg font-label-sm uppercase tracking-widest text-secondary hover:text-primary transition-colors cursor-pointer bg-transparent">
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Refresh
                </button>
              </div>

              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
                <input
                  type="text" placeholder="Search by order #, name, or email..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-11 pr-4 py-3 font-body-md text-primary placeholder:text-secondary focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="bg-surface-container-low border border-outline-variant/30 rounded-[16px] overflow-hidden">
                {isLoading ? (
                  <div className="p-16 text-center text-secondary">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/30 bg-surface-container-highest/20">
                          {['Order #', 'Customer', 'Product', 'Total', 'Date', 'Status', 'Action'].map(h => (
                            <th key={h} className="p-4 font-label-sm uppercase tracking-widest text-secondary whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="font-body-md text-primary">
                        {filteredOrders.map(order => (
                          <tr key={order.id} className="border-b border-outline-variant/10 hover:bg-surface-variant/20 transition-colors">
                            <td className="p-4 font-mono text-sm">{order.orderNumber}</td>
                            <td className="p-4">
                              <div className="font-medium">{order.customerName}</div>
                              <div className="text-sm text-secondary">{order.customerEmail}</div>
                              {order.customerPhone && <div className="text-xs text-secondary">{order.customerPhone}</div>}
                            </td>
                            <td className="p-4 max-w-[160px]">
                              <p className="truncate text-sm">{order.productType}</p>
                            </td>
                            <td className="p-4 font-medium">{order.totalPrice}</td>
                            <td className="p-4 text-secondary whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => handleOpenOrder(order)}
                                className="flex items-center gap-1 text-primary hover:underline font-label-sm uppercase tracking-widest cursor-pointer bg-transparent border-none whitespace-nowrap"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                Update
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredOrders.length === 0 && <div className="p-12 text-center text-secondary">No orders found.</div>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PRODUCTS TAB ──────────────────────────────────────────── */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end flex-wrap gap-4">
                <div>
                  <h1 className="font-headline-lg text-[32px] text-primary">Products</h1>
                  <p className="font-body-md text-secondary">Manage what appears in your shop.</p>
                </div>
                <button
                  onClick={openCreateProduct}
                  className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-label-sm uppercase tracking-widest hover:opacity-90 transition-opacity cursor-pointer border-none"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Product
                </button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1,2].map(i => <div key={i} className="bg-surface-container-low border border-outline-variant/20 rounded-2xl h-36 animate-pulse" />)}
                </div>
              ) : products.length === 0 ? (
                <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-16 text-center">
                  <span className="material-symbols-outlined text-[48px] text-secondary/30 block mb-3">inventory_2</span>
                  <p className="font-body-md text-secondary mb-4">No products yet.</p>
                  <button onClick={openCreateProduct} className="font-label-sm uppercase tracking-widest text-primary border border-primary/30 px-6 py-2 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer bg-transparent border-none">
                    Add your first product
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map(p => (
                    <div key={p.id} className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 flex gap-5">
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <span className="material-symbols-outlined text-primary text-[28px]">credit_card</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-body-md font-semibold text-primary">{p.name}</p>
                            {p.badge && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{p.badge}</span>}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => openEditProduct(p)} className="p-1.5 rounded-lg hover:bg-surface-container-highest/40 text-secondary hover:text-primary transition-colors cursor-pointer bg-transparent border-none">
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button onClick={() => handleDeleteProduct(p.id)} disabled={deletingProductId === p.id} className="p-1.5 rounded-lg hover:bg-error/10 text-secondary hover:text-error transition-colors cursor-pointer bg-transparent border-none">
                              <span className="material-symbols-outlined text-[18px]">{deletingProductId === p.id ? 'hourglass_empty' : 'delete'}</span>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-secondary mt-1 line-clamp-2">{p.description}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-headline-lg text-[20px] text-primary">₹{p.price.toLocaleString()}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.inStock ? 'bg-emerald-500/10 text-emerald-400' : 'bg-error/10 text-error'}`}>
                            {p.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── USERS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-headline-lg text-[32px] text-primary">User Directory</h1>
                <p className="font-body-md text-secondary">All users who have signed in via Google.</p>
              </div>

              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
                <input
                  type="text" placeholder="Search by name or email..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-11 pr-4 py-3 font-body-md text-primary placeholder:text-secondary focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="bg-surface-container-low border border-outline-variant/30 rounded-[16px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/30 bg-surface-container-highest/20">
                        {['User', 'Email', 'Card Type', 'Orders', 'Joined'].map(h => (
                          <th key={h} className="p-4 font-label-sm uppercase tracking-widest text-secondary whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="font-body-md text-primary">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="border-b border-outline-variant/10 hover:bg-surface-variant/20 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {u.picture ? (
                                <img src={u.picture} alt={u.name} className="w-8 h-8 rounded-full" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">{u.name[0]}</div>
                              )}
                              <span className="font-medium">{u.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-secondary">{u.email}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.cardType === 'Metal' ? 'bg-primary text-on-primary' : 'bg-surface-variant text-primary'}`}>
                              {u.cardType}
                            </span>
                          </td>
                          <td className="p-4 text-center">{u.orders?.length ?? 0}</td>
                          <td className="p-4 text-secondary">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && <div className="p-12 text-center text-secondary">No users found.</div>}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── ORDER STATUS MODAL ─────────────────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-[24px] p-8 w-full max-w-[560px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="font-mono text-sm text-secondary mb-1">{selectedOrder.orderNumber}</p>
                <h2 className="font-headline-lg text-[24px] text-primary">{selectedOrder.customerName}</h2>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-secondary hover:text-primary cursor-pointer bg-transparent border-none">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-highest/30 rounded-xl p-4">
                  <p className="font-label-sm uppercase tracking-widest text-secondary mb-1 text-xs">Customer</p>
                  <p className="font-body-md text-primary font-medium">{selectedOrder.customerName}</p>
                  <p className="font-body-md text-secondary text-sm">{selectedOrder.customerEmail}</p>
                  {selectedOrder.customerPhone && <p className="font-body-md text-secondary text-sm">{selectedOrder.customerPhone}</p>}
                </div>
                <div className="bg-surface-container-highest/30 rounded-xl p-4">
                  <p className="font-label-sm uppercase tracking-widest text-secondary mb-1 text-xs">Total</p>
                  <p className="font-headline-lg text-[22px] text-primary">{selectedOrder.totalPrice}</p>
                  <p className="font-body-md text-secondary text-sm">{new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="bg-surface-container-highest/30 rounded-xl p-4">
                <p className="font-label-sm uppercase tracking-widest text-secondary mb-1 text-xs">Product</p>
                <p className="font-body-md text-primary">{selectedOrder.productType}</p>
              </div>

              {selectedOrder.shippingAddress && (
                <div className="bg-surface-container-highest/30 rounded-xl p-4">
                  <p className="font-label-sm uppercase tracking-widest text-secondary mb-1 text-xs">Shipping Address</p>
                  <p className="font-body-md text-primary whitespace-pre-line">{selectedOrder.shippingAddress}</p>
                </div>
              )}

              <div className="bg-surface-container-highest/30 rounded-xl p-4">
                <p className="font-label-sm uppercase tracking-widest text-secondary mb-3 text-xs">Update Status</p>
                <div className="grid grid-cols-1 gap-2">
                  {ALL_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => setNewStatus(s)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer font-body-md text-left ${
                        newStatus === s ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/20 text-secondary hover:border-outline-variant bg-transparent'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${newStatus === s ? 'border-primary' : 'border-outline-variant'}`}>
                        {newStatus === s && <span className="w-2 h-2 rounded-full bg-primary block" />}
                      </span>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpdateStatus}
                disabled={updating || newStatus === selectedOrder.status}
                className="flex-1 bg-primary text-on-primary py-4 rounded-xl font-label-sm uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer border-none"
              >
                {updating ? 'Saving...' : 'Save Status'}
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 bg-surface-container-highest border border-outline-variant/30 text-secondary py-4 rounded-xl font-label-sm uppercase tracking-widest hover:text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCT MODAL ─────────────────────────────────────────────────── */}
      {productModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setProductModal(null)}>
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-[24px] p-8 w-full max-w-[500px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="font-headline-lg text-[24px] text-primary">
                {productModal === 'create' ? 'Add Product' : 'Edit Product'}
              </h2>
              <button onClick={() => setProductModal(null)} className="text-secondary hover:text-primary cursor-pointer bg-transparent border-none">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <input
                value={productForm.name}
                onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Product Name *"
                className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 font-body-md text-primary focus:outline-none focus:border-primary/50"
              />
              <textarea
                value={productForm.description}
                onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Description"
                rows={3}
                className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 font-body-md text-primary focus:outline-none focus:border-primary/50 resize-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  value={productForm.price}
                  onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="Price (₹) *"
                  type="number"
                  className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 font-body-md text-primary focus:outline-none focus:border-primary/50"
                />
                <input
                  value={productForm.badge}
                  onChange={e => setProductForm({ ...productForm, badge: e.target.value })}
                  placeholder="Badge (e.g. Popular)"
                  className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 font-body-md text-primary focus:outline-none focus:border-primary/50"
                />
              </div>
              <input
                value={productForm.image}
                onChange={e => setProductForm({ ...productForm, image: e.target.value })}
                placeholder="Image URL (optional)"
                className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 font-body-md text-primary focus:outline-none focus:border-primary/50"
              />
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={productForm.inStock}
                  onChange={e => setProductForm({ ...productForm, inStock: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="font-body-md text-primary">In Stock</span>
              </label>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSaveProduct}
                disabled={savingProduct || !productForm.name || !productForm.price}
                className="flex-1 bg-primary text-on-primary py-4 rounded-xl font-label-sm uppercase tracking-widest hover:opacity-90 disabled:opacity-40 cursor-pointer border-none"
              >
                {savingProduct ? 'Saving...' : productModal === 'create' ? 'Create Product' : 'Save Changes'}
              </button>
              <button onClick={() => setProductModal(null)} className="px-6 border border-outline-variant/30 text-secondary py-4 rounded-xl font-label-sm uppercase tracking-widest hover:text-primary transition-colors cursor-pointer bg-transparent">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
