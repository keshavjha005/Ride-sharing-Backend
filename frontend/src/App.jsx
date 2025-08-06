import React from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import { AuthProvider } from './utils/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Landing page - root route */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Admin login - separate from protected routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Admin protected routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          {/* Add more admin routes here as we implement them */}
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App 