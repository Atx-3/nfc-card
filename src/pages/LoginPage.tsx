import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { user, isLoading, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoading && user) {
      navigate(user.isAdmin ? '/admin' : '/dashboard', { replace: true })
    }
  }, [user, isLoading, navigate])

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Sign-in failed. Please try again.')
      }
    } finally {
      setSigningIn(false)
    }
  }

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

        {error && (
          <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-xl text-error font-body-md text-sm text-center relative z-10">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={signingIn || isLoading}
          className="w-full bg-white text-black border border-outline-variant/30 py-4 rounded-xl font-label-sm uppercase tracking-widest hover:bg-gray-50 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 relative z-10 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {signingIn ? (
            <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          ) : (
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          )}
          {signingIn ? 'Signing in...' : 'Continue with Google'}
        </button>

        <p className="text-center font-body-md text-xs text-secondary mt-6 relative z-10">
          By signing in, you agree to our Terms of Service. Your orders and data are securely stored.
        </p>
      </div>
    </div>
  )
}
