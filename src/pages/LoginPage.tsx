import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && user) {
      navigate(user.isAdmin ? '/admin' : '/dashboard', { replace: true })
    }
  }, [user, isLoading, navigate])

  return (
    <div className="bg-surface text-on-surface min-h-screen font-sans flex items-center justify-center p-4">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-secondary hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        <span className="font-label-sm uppercase tracking-widest">Back to Home</span>
      </Link>

      <div className="w-full max-w-[440px] bg-surface-container-low border border-outline-variant/30 rounded-[24px] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[64px] pointer-events-none translate-x-1/2 -translate-y-1/2" />

        <div className="text-center mb-8 relative z-10">
          <div className="text-[48px] mb-4">✦</div>
          <h1 className="font-headline-lg text-[32px] text-primary mb-2">Welcome to BrandEazy</h1>
          <p className="font-body-md text-secondary">Sign in with Google to manage your NFC card, track orders, and more.</p>
        </div>

        <a
          href="http://localhost:3000/api/auth/google"
          className="w-full bg-white text-black border border-outline-variant/30 py-4 rounded-xl font-label-sm uppercase tracking-widest hover:bg-gray-50 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 relative z-10 cursor-pointer no-underline"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" className="w-5 h-5" />
          Continue with Google
        </a>

        <p className="text-center font-body-md text-xs text-secondary mt-6 relative z-10">
          By signing in, you agree to our Terms of Service. Your orders and data are securely stored.
        </p>
      </div>
    </div>
  )
}
