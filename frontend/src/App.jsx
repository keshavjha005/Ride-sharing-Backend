import React from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import UserReports from './pages/admin/UserReports'
import UserReportDetail from './pages/admin/UserReportDetail'
import RideManagement from './pages/admin/RideManagement'
import RideDisputes from './pages/admin/RideDisputes'
import LocalizationManagement from './pages/admin/LocalizationManagement'
import Settings from './pages/admin/Settings'
import SystemMonitoring from './pages/admin/SystemMonitoring'
import Analytics from './pages/admin/Analytics'
import Reports from './pages/admin/Reports'
import AdminManagement from './pages/admin/AdminManagement'
import AdminProfile from './pages/admin/AdminProfile'
import UserDetail from './pages/admin/UserDetail'
import RideDetail from './pages/admin/RideDetail'
import DocumentVerification from './pages/admin/DocumentVerification'
import PricingManagement from './pages/admin/PricingManagement'
import VehicleManagement from './pages/admin/VehicleManagement'
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
          <Route path="users" element={<UserManagement />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="user-reports" element={<UserReports />} />
          <Route path="user-reports/:id" element={<UserReportDetail />} />
          <Route path="document-verification" element={<DocumentVerification />} />
          <Route path="rides" element={<RideManagement />} />
          <Route path="rides/:id" element={<RideDetail />} />
          <Route path="ride-disputes" element={<RideDisputes />} />
          <Route path="localization" element={<LocalizationManagement />} />
          <Route path="admin-management" element={<AdminManagement />} />
          <Route path="pricing" element={<PricingManagement />} />
          <Route path="vehicles" element={<VehicleManagement />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="system-monitoring" element={<SystemMonitoring />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          {/* Add more admin routes here as we implement them */}
        </Route>
        
        {/* Unimplemented admin routes - standalone 404 pages */}
        <Route path="/admin/security" element={<NotFound />} />
        
        {/* 404 - Catch all unmatched routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}

export default App 