import React, { createContext, useContext, useState, useEffect } from 'react'
import api from './api'

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
  const [loading, setLoading] = useState(true)

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken')
      if (token) {
        // Set the token in axios defaults
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        try {
          const response = await api.get('/api/admin/auth/profile')
          setAdmin(response.data.data)
        } catch (error) {
          // If profile check fails, try to refresh token
          if (error.response?.status === 401) {
            try {
              const refreshResponse = await api.post('/api/admin/auth/refresh', {}, {
                headers: { Authorization: `Bearer ${token}` }
              })
              
              const { token: newToken } = refreshResponse.data.data
              localStorage.setItem('adminToken', newToken)
              api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
              
              // Try profile check again
              const profileResponse = await api.get('/api/admin/auth/profile')
              setAdmin(profileResponse.data.data)
            } catch (refreshError) {
              localStorage.removeItem('adminToken')
              delete api.defaults.headers.common['Authorization']
            }
          } else {
            localStorage.removeItem('adminToken')
            delete api.defaults.headers.common['Authorization']
          }
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/admin/auth/login', {
        email,
        password
      })
      
      const { token, admin: adminData } = response.data.data
      
      localStorage.setItem('adminToken', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
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
      await api.post('/api/admin/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('adminToken')
      delete api.defaults.headers.common['Authorization']
      setAdmin(null)
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/admin/auth/profile', profileData)
      setAdmin(response.data.data)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed'
      }
    }
  }

  const updateAdmin = (adminData) => {
    setAdmin(adminData)
  }

  const value = {
    admin,
    loading,
    login,
    logout,
    updateProfile,
    updateAdmin,
    isAuthenticated: !!admin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 