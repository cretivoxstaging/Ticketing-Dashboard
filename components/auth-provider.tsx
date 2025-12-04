"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

type AuthUser = {
  email: string
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = "ticket-sales-dashboard:user"
const EMAIL = process.env.NEXT_PUBLIC_AUTH_EMAIL 
const PASSWORD = process.env.NEXT_PUBLIC_AUTH_PASSWORD 

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 400))

    if (email === EMAIL && password === PASSWORD) {
      const nextUser: AuthUser = { email }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
      setUser(nextUser)
      return
    }

    throw new Error("Email atau kata sandi tidak valid.")
  }

  const logout = () => {
    window.localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth hanya bisa dipakai di dalam AuthProvider.")
  }
  return context
}

