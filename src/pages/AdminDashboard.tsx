import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

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

export default function AdminDashboard() {
  const { user: adminUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'orders' | 'users'>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<OrderStatus>('Order Placed')
  const [updating, setUpdating] = useState(false)
  const [search, setSearch] = useState('')

  const fetchAll = async () => {
    try {
      const [ordersRes, usersRes] = await Promise.all([
        axios.get('http://localhost:3000/api/orders'),
        axios.get('http://localhost:3000/api/users')
      ])
      setOrders(ordersRes.data)
      setUsers(usersRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleOpenOrder = (order: Order) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
  }

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return
    setUpdating(true)
    try {
      await axios.patch(`http://localhost:3000/api/orders/${selectedOrder.id}/status`, { status: newStatus })
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o))
      setSelectedOrder({ ...selectedOrder, status: newStatus })
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

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
        <div className="p-4 flex-1 space-y-2">
          {(['orders', 'users'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearch('') }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-label-sm uppercase tracking-widest transition-colors cursor-pointer border-none ${
                activeTab === tab ? 'bg-primary text-on-primary' : 'text-secondary hover:bg-surface-variant/50 bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab === 'orders' ? 'shopping_cart' : 'group'}</span>
              {tab === 'orders' ? `Orders (${orders.length})` : `Users (${users.length})`}
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
          {/* Header */}
          <div className="flex justify-between items-end flex-wrap gap-4">
            <div>
              <h1 className="font-headline-lg text-[32px] text-primary">
                {activeTab === 'orders' ? 'Order Management' : 'User Directory'}
              </h1>
              <p className="font-body-md text-secondary">
                {activeTab === 'orders' ? 'Click any order to update its status.' : 'All users who have signed in via Google.'}
              </p>
            </div>
            <button onClick={fetchAll} className="flex items-center gap-2 border border-outline-variant/30 px-4 py-2 rounded-lg font-label-sm uppercase tracking-widest text-secondary hover:text-primary transition-colors cursor-pointer bg-transparent">
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Refresh
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
            <input
              type="text"
              placeholder={activeTab === 'orders' ? 'Search by order #, name, or email...' : 'Search by name or email...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-11 pr-4 py-3 font-body-md text-primary placeholder:text-secondary focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Table */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-[16px] shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-16 text-center text-secondary font-body-md">Loading...</div>
            ) : activeTab === 'orders' ? (
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
                        <td className="p-4">{order.productType}</td>
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
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30 bg-surface-container-highest/20">
                      {['User', 'Email', 'Card Type', 'Total Orders', 'Joined'].map(h => (
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
            )}
          </div>
        </div>
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-[24px] p-8 w-full max-w-[560px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="font-mono text-sm text-secondary mb-1">{selectedOrder.orderNumber}</p>
                <h2 className="font-headline-lg text-[26px] text-primary">{selectedOrder.productType}</h2>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-secondary hover:text-primary cursor-pointer bg-transparent border-none">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-highest/30 rounded-xl p-4">
                  <p className="font-label-sm uppercase tracking-widest text-secondary mb-1">Customer</p>
                  <p className="font-body-md text-primary font-medium">{selectedOrder.customerName}</p>
                  <p className="font-body-md text-secondary text-sm">{selectedOrder.customerEmail}</p>
                  {selectedOrder.customerPhone && <p className="font-body-md text-secondary text-sm">{selectedOrder.customerPhone}</p>}
                </div>
                <div className="bg-surface-container-highest/30 rounded-xl p-4">
                  <p className="font-label-sm uppercase tracking-widest text-secondary mb-1">Order Total</p>
                  <p className="font-headline-lg text-[22px] text-primary">{selectedOrder.totalPrice}</p>
                  <p className="font-body-md text-secondary text-sm">{new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              {selectedOrder.shippingAddress && (
                <div className="bg-surface-container-highest/30 rounded-xl p-4">
                  <p className="font-label-sm uppercase tracking-widest text-secondary mb-1">Shipping Address</p>
                  <p className="font-body-md text-primary whitespace-pre-line">{selectedOrder.shippingAddress}</p>
                </div>
              )}

              <div className="bg-surface-container-highest/30 rounded-xl p-4">
                <p className="font-label-sm uppercase tracking-widest text-secondary mb-3">Update Status</p>
                <div className="grid grid-cols-1 gap-2">
                  {ALL_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => setNewStatus(s)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer font-body-md text-left ${
                        newStatus === s
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-outline-variant/20 text-secondary hover:border-outline-variant bg-transparent'
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
    </div>
  )
}
