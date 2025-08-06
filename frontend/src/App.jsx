import React from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import NotFound from './components/NotFound'
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
          <Route path="dashboard" element={<AdminDashboard />} />
          {/* Add more admin routes here as we implement them */}
        </Route>
        
        {/* Unimplemented admin routes - standalone 404 pages */}
        <Route path="/admin/users" element={<NotFound />} />
        <Route path="/admin/rides" element={<NotFound />} />
        <Route path="/admin/analytics" element={<NotFound />} />
        <Route path="/admin/reports" element={<NotFound />} />
        <Route path="/admin/localization" element={<NotFound />} />
        <Route path="/admin/settings" element={<NotFound />} />
        <Route path="/admin/security" element={<NotFound />} />
        
        {/* 404 - Catch all unmatched routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}

export default App 