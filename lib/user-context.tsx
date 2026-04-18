"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  username: string
  role: "admin" | "tracker"
}

interface UserContextType {
  user: User | null
  login: (username: string, password: string) => boolean
  logout: () => void
  isAdmin: boolean
  isTracker: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    } else {
      router.push("/login")
    }
  }, [router])

  const login = (username: string, password: string): boolean => {
    if (username === "admin" && password === "admin123") {
      const userData = { username: "admin", role: "admin" as const }
      localStorage.setItem("user", JSON.stringify(userData))
      setUser(userData)
      return true
    } else if (username === "tracker" && password === "tracker123") {
      const userData = { username: "tracker", role: "tracker" as const }
      localStorage.setItem("user", JSON.stringify(userData))
      setUser(userData)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem("user")
    setUser(null)
    router.push("/login")
  }

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        isAdmin: user?.role === "admin",
        isTracker: user?.role === "tracker",
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
