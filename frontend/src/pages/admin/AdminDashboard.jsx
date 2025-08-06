import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Car, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Clock,
  MapPin,
  AlertCircle,
  Settings
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRides: 0,
    totalRevenue: 0,
    growthRate: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Mock data for now - replace with actual API calls
      const mockStats = {
        totalUsers: 1247,
        activeRides: 23,
        totalRevenue: 45678.90,
        growthRate: 12.5
      }
      
      const mockActivity = [
        {
          id: 1,
          type: 'user_registration',
          message: 'New user registered: john.doe@example.com',
          time: '2 minutes ago',
          icon: Users
        },
        {
          id: 2,
          type: 'ride_completed',
          message: 'Ride completed: Trip #12345',
          time: '5 minutes ago',
          icon: Car
        },
        {
          id: 3,
          type: 'payment_received',
          message: 'Payment received: $25.50',
          time: '10 minutes ago',
          icon: DollarSign
        },
        {
          id: 4,
          type: 'system_alert',
          message: 'System maintenance scheduled for tonight',
          time: '1 hour ago',
          icon: AlertCircle
        }
      ]

      setStats(mockStats)
      setRecentActivity(mockActivity)
      
    } catch (error) {
      toast.error('Failed to load dashboard data')
      console.error('Dashboard data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {typeof value === 'number' && title.includes('Revenue') 
              ? `$${value.toLocaleString()}`
              : value.toLocaleString()
            }
          </p>
          {change && (
            <p className={`text-sm mt-1 ${change > 0 ? 'text-success' : 'text-error'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  const ActivityItem = ({ activity }) => {
    const Icon = activity.icon
    return (
      <div className="flex items-start space-x-3 p-4 hover:bg-background-tertiary rounded-lg transition-colors duration-200">
        <div className="p-2 bg-background-tertiary rounded-lg">
          <Icon className="w-4 h-4 text-text-secondary" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-text-primary">{activity.message}</p>
          <p className="text-xs text-text-muted mt-1">{activity.time}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="loading h-8 w-24 mb-2"></div>
              <div className="loading h-6 w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">
          Overview of your platform's performance and activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="bg-primary"
          change={stats.growthRate}
        />
        <StatCard
          title="Active Rides"
          value={stats.activeRides}
          icon={Car}
          color="bg-info"
        />
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          icon={DollarSign}
          color="bg-success"
          change={8.2}
        />
        <StatCard
          title="Growth Rate"
          value={`${stats.growthRate}%`}
          icon={TrendingUp}
          color="bg-warning"
        />
      </div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full btn-secondary text-left flex items-center">
                <Users className="w-4 h-4 mr-3" />
                Manage Users
              </button>
              <button className="w-full btn-secondary text-left flex items-center">
                <Car className="w-4 h-4 mr-3" />
                View Active Rides
              </button>
              <button className="w-full btn-secondary text-left flex items-center">
                <DollarSign className="w-4 h-4 mr-3" />
                Financial Reports
              </button>
              <button className="w-full btn-secondary text-left flex items-center">
                <Settings className="w-4 h-4 mr-3" />
                System Settings
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                Recent Activity
              </h3>
              <button className="text-sm text-primary hover:text-primary-light transition-colors duration-200">
                View All
              </button>
            </div>
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="card">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <span className="text-text-secondary">API Server</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <span className="text-text-secondary">Database</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <span className="text-text-secondary">Payment Gateway</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard 