import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  BarChart3, 
  Settings, 
  Globe, 
  FileText,
  Shield,
  LogOut,
  Cog
} from 'lucide-react'
import { useAuth } from '../../utils/AuthContext'

const Sidebar = () => {
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  const navItems = [
    {
      path: '/admin',
      icon: LayoutDashboard,
      label: 'Dashboard',
      exact: true
    },
    {
      path: '/admin/users',
      icon: Users,
      label: 'User Management'
    },
    {
      path: '/admin/rides',
      icon: Car,
      label: 'Ride Management'
    },
    {
      path: '/admin/analytics',
      icon: BarChart3,
      label: 'Analytics'
    },
    {
      path: '/admin/reports',
      icon: FileText,
      label: 'Reports'
    },
    {
      path: '/admin/localization',
      icon: Globe,
      label: 'Localization'
    },
    {
      path: '/admin/settings',
      icon: Cog,
      label: 'System Configuration'
    },
    {
      path: '/admin/security',
      icon: Shield,
      label: 'Security'
    }
  ]

  return (
    <div className="w-64 bg-background-secondary border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
            <Car className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Mate Admin</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded-lg transition-colors duration-200"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  )
}

export default Sidebar 