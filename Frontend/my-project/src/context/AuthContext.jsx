import React, { createContext, useContext, useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
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
        const parsedUser = JSON.parse(savedUser)
        // Verify user still exists in database
        verifyUser(parsedUser)
      } catch (error) {
        localStorage.removeItem('collabUser')
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  // Verify user from database
  const verifyUser = async (savedUser) => {
    try {
      // You might want to add a GET endpoint to fetch user by ID
      // For now, we'll just trust localStorage but refresh on login
      setUser(savedUser)
    } catch (error) {
      localStorage.removeItem('collabUser')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (userData) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: userData.name, 
          email: userData.email, 
          color: userData.color 
        })
      })
      
      if (!res.ok) {
        throw new Error('Login failed')
      }
      
      const savedUser = await res.json()
      
      // ✅ FIX: Use database response, NOT user input
      const userWithLoginTime = {
        id: savedUser._id,
        name: savedUser.name,        // From database
        email: savedUser.email,      // From database
        color: savedUser.color,      // From database
        loginTime: new Date().toISOString()
      }
      
      setUser(userWithLoginTime)
      localStorage.setItem('collabUser', JSON.stringify(userWithLoginTime))
      
      return { success: true }
    } catch (e) {
      console.error('Login/upsert failed', e)
      return { success: false, error: e.message }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('collabUser')
  }

  const updateUser = async (updates) => {
    if (!user) return
    
    try {
      // Update in database first
      const res = await fetch(`${API_BASE}/api/users/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email,
          ...updates
        })
      })
      
      if (!res.ok) {
        throw new Error('Update failed')
      }
      
      const updatedFromDb = await res.json()
      
      // Use database response
      const updatedUser = {
        id: updatedFromDb._id,
        name: updatedFromDb.name,
        email: updatedFromDb.email,
        color: updatedFromDb.color,
        loginTime: user.loginTime,
        lastUpdated: new Date().toISOString()
      }
      
      setUser(updatedUser)
      localStorage.setItem('collabUser', JSON.stringify(updatedUser))
      
      return { success: true }
    } catch (e) {
      console.error('Update failed', e)
      return { success: false, error: e.message }
    }
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