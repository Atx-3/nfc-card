import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import axios from 'axios'
import API_URL from '../lib/api'

axios.defaults.withCredentials = true

interface User {
  id: string
  name: string
  email: string
  picture?: string
  cardType: string
  isAdmin: boolean
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  refetch: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  refetch: async () => {},
  logout: async () => {}
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchMe = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`)
      setUser(res.data)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await axios.get(`${API_URL}/api/auth/logout`)
    } catch {}
    setUser(null)
    window.location.href = '/'
  }

  useEffect(() => {
    fetchMe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin: user?.isAdmin ?? false, refetch: fetchMe, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
