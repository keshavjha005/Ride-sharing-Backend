import React, { useState } from 'react'
import { Bell, User, Settings, ChevronDown } from 'lucide-react'
import { useAuth } from '../../utils/AuthContext'

const Header = ({ admin }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="bg-background-secondary border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Breadcrumb or title */}
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            Admin Dashboard
          </h1>
          <p className="text-sm text-text-secondary">
            Welcome back, {admin?.first_name || 'Admin'}
          </p>
        </div>

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded-lg transition-colors duration-200">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
          </button>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 p-2 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded-lg transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-text-primary">
                  {admin?.first_name} {admin?.last_name}
                </p>
                <p className="text-xs text-text-secondary">
                  {admin?.role}
                </p>
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card-bg border border-card-border rounded-lg shadow-modal z-50">
                <div className="py-2">
                  <button className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors duration-200">
                    <User className="w-4 h-4 mr-3" />
                    Profile
                  </button>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors duration-200">
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </button>
                  <hr className="border-border my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-error hover:bg-background-tertiary transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 