import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import LandingPage from './pages/LandingPage'
import ShopPage from './pages/ShopPage'
import BuyNowPage from './pages/BuyNowPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import LoginPage from './pages/LoginPage'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <div className="min-h-screen bg-surface flex items-center justify-center text-primary font-headline-lg text-[24px]">Loading...</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth()
  const location = useLocation()
  if (isLoading) return <div className="min-h-screen bg-surface flex items-center justify-center text-primary font-headline-lg text-[24px]">Loading...</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/buy" element={<ProtectedRoute><BuyNowPage /></ProtectedRoute>} />
      <Route path="/confirmation" element={<ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}
