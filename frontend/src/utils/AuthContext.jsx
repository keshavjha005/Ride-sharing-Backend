import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(false) // Set to false for now to avoid loading issues

  // Set up axios defaults
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [])

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken')
      if (token) {
        try {
          const response = await axios.get('/api/admin/auth/profile')
          setAdmin(response.data.data)
        } catch (error) {
          localStorage.removeItem('adminToken')
          delete axios.defaults.headers.common['Authorization']
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/admin/auth/login', {
        email,
        password
      })
      
      const { token, admin: adminData } = response.data.data
      
      localStorage.setItem('adminToken', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setAdmin(adminData)
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      }
    }
  }

  const logout = async () => {
    try {
      await axios.post('/api/admin/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('adminToken')
      delete axios.defaults.headers.common['Authorization']
      setAdmin(null)
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/admin/auth/profile', profileData)
      setAdmin(response.data.data)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed'
      }
    }
  }

  const value = {
    admin,
    loading,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!admin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 