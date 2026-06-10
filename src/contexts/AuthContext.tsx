import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import axios from 'axios'
import API_URL from '../lib/api'

axios.defaults.withCredentials = true

const ADMIN_EMAIL = 'brandeasytools@gmail.com'

interface User {
  id: string
  name: string
  email: string
  picture?: string
  cardType: string
  isAdmin: boolean
  createdAt: string
  firebaseUid: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  signInWithGoogle: async () => {},
  logout: async () => {},
  refetch: async () => {}
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const syncUserWithBackend = async (firebaseUser: FirebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken()
      const res = await axios.post(`${API_URL}/api/auth/firebase`, { idToken })
      setUser(res.data)
    } catch {
      // Backend might be down — create a minimal user from Firebase data
      setUser({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        picture: firebaseUser.photoURL || undefined,
        cardType: 'Standard',
        isAdmin: firebaseUser.email === ADMIN_EMAIL,
        createdAt: new Date().toISOString(),
        firebaseUid: firebaseUser.uid
      })
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserWithBackend(firebaseUser)
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })
    return () => unsub()
  }, [])

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider)
    // onAuthStateChanged will fire and handle the rest
  }

  const logout = async () => {
    await signOut(auth)
    try {
      await axios.get(`${API_URL}/api/auth/logout`)
    } catch {}
    setUser(null)
    window.location.href = '/'
  }

  const refetch = async () => {
    const firebaseUser = auth.currentUser
    if (firebaseUser) await syncUserWithBackend(firebaseUser)
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAdmin: user?.isAdmin ?? false,
      signInWithGoogle,
      logout,
      refetch
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
