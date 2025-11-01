import React, { createContext, useContext, useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://realtimecollaborationapp-fb.onrender.com'
const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState(0)

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('collabUser')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        localStorage.removeItem('collabUser')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (userData) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userData.name, email: userData.email, color: userData.color })
      })
      const saved = await res.json()
      const userWithId = {
        ...userData,
        id: saved._id,
        loginTime: new Date().toISOString()
      }
      setUser(userWithId)
      localStorage.setItem('collabUser', JSON.stringify(userWithId))
    } catch (e) {
      console.error('Login/upsert failed', e)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('collabUser')
  }

  const updateUser = (updates) => {
    if (!user) return
    
    const updatedUser = {
      ...user,
      ...updates,
      lastUpdated: new Date().toISOString()
    }
    setUser(updatedUser)
    localStorage.setItem('collabUser', JSON.stringify(updatedUser))
  }

  const value = {
    user,
    login,
    logout,
    updateUser,
    isLoading,
    isAuthenticated: !!user,
    onlineUsers,
    setOnlineUsers
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}