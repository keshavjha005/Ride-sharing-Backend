import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Shield,
  UserCheck,
  UserX,
  Crown,
  Settings,
  BarChart3,
  FileText,
  Globe,
  Lock
} from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select, SelectItem } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { useAuth } from '../../utils/AuthContext'

const AdminManagement = () => {
  const { admin } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    is_active: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'admin',
    permissions: {},
    language_code: 'en',
    timezone: 'UTC'
  })

  // Fetch admins data
  const fetchAdmins = async () => {
    try {
      setLoading(true)
      // Filter out empty values
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => value !== '')
      )
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...cleanFilters
      })

      const response = await api.get(`/api/admin/admin-management?${params}`)
      
      setAdmins(response.data.data.admins)
      setPagination(response.data.data.pagination)
    } catch (error) {
      console.error('Error fetching admins:', error.response?.data || error.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch admin statistics
  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/admin-management/stats')
      setStats(response.data.data)
    } catch (error) {
      console.error('Error fetching stats:', error.response?.data || error.message)
    }
  }

  // Fetch roles and permissions
  const fetchRolesAndPermissions = async () => {
    try {
      const response = await api.get('/api/admin/admin-management/roles-permissions')
      setRoles(response.data.data.roles)
      setPermissions(response.data.data.permissions)
    } catch (error) {
      console.error('Error fetching roles and permissions:', error.response?.data || error.message)
    }
  }

  useEffect(() => {
    if (admin) {
      fetchAdmins()
      fetchStats()
      fetchRolesAndPermissions()
    }
  }, [pagination.page, filters, admin])

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Handle pagination
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }))
  }

  // Handle admin status toggle
  const handleToggleStatus = async (adminId) => {
    try {
      const response = await fetch(`/api/admin/admin-management/${adminId}/toggle-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })

      if (response.ok) {
        fetchAdmins()
        fetchStats()
      }
    } catch (error) {
      console.error('Error toggling admin status:', error)
    }
  }

  // Handle admin deletion
  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return

    try {
      const response = await fetch(`/api/admin/admin-management/${selectedAdmin.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })

      if (response.ok) {
        setShowDeleteModal(false)
        setSelectedAdmin(null)
        fetchAdmins()
        fetchStats()
      }
    } catch (error) {
      console.error('Error deleting admin:', error)
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = showCreateModal 
        ? '/api/admin/admin-management'
        : `/api/admin/admin-management/${selectedAdmin.id}`
      
      const method = showCreateModal ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowCreateModal(false)
        setShowEditModal(false)
        setSelectedAdmin(null)
        setFormData({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          role: 'admin',
          permissions: {},
          language_code: 'en',
          timezone: 'UTC'
        })
        fetchAdmins()
        fetchStats()
      }
    } catch (error) {
      console.error('Error saving admin:', error)
    }
  }

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />
      case 'moderator':
        return <Settings className="w-4 h-4 text-green-500" />
      case 'support':
        return <Users className="w-4 h-4 text-purple-500" />
      default:
        return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
      case 'admin':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
      case 'moderator':
        return 'bg-green-500/20 text-green-500 border-green-500/30'
      case 'support':
        return 'bg-purple-500/20 text-purple-500 border-purple-500/30'
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Management</h1>
          <p className="text-text-secondary mt-1">Manage admin users, roles, and permissions</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary-dark text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Admin
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Total Admins</p>
              <p className="text-2xl font-bold text-text-primary">{stats.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Active Admins</p>
              <p className="text-2xl font-bold text-text-primary">{stats.active || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Inactive Admins</p>
              <p className="text-2xl font-bold text-text-primary">{stats.inactive || 0}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <UserX className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Super Admins</p>
              <p className="text-2xl font-bold text-text-primary">{stats.byRole?.super_admin || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </Card>
      </div>

            {/* Admin Users Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Admin Users</h2>
            <p className="text-text-secondary mt-1">Manage admin users and their access</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  placeholder="Search admins..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Role</label>
              <Select
                value={filters.role}
                onValueChange={(value) => handleFilterChange('role', value)}
                placeholder="All Roles"
              >
                <SelectItem value="">
                  All Roles
                </SelectItem>
                <SelectItem value="super_admin">
                  Super Admin
                </SelectItem>
                <SelectItem value="admin">
                  Admin
                </SelectItem>
                <SelectItem value="moderator">
                  Moderator
                </SelectItem>
                <SelectItem value="support">
                  Support
                </SelectItem>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Status</label>
              <Select
                value={filters.is_active}
                onValueChange={(value) => handleFilterChange('is_active', value)}
                placeholder="All Status"
              >
                <SelectItem value="">
                  All Status
                </SelectItem>
                <SelectItem value="true">
                  Active
                </SelectItem>
                <SelectItem value="false">
                  Inactive
                </SelectItem>
              </Select>
            </div>
          </div>
        </Card>

        {/* Admins Table */}
        <Card className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">Admin</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">Role</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">Last Login</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-text-secondary">
                        No admin users found
                      </td>
                    </tr>
                  ) : (
                    admins.map((adminUser) => (
                      <tr key={adminUser.id} className="border-b border-border hover:bg-background-tertiary">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-text-primary">{adminUser.email}</p>
                            <p className="text-sm text-text-secondary">
                              {adminUser.first_name} {adminUser.last_name}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(adminUser.role)}
                            <Badge className={getRoleBadgeColor(adminUser.role)}>
                              {adminUser.role.replace('_', ' ')}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            className={adminUser.is_active 
                              ? 'bg-green-500/20 text-green-500 border-green-500/30'
                              : 'bg-red-500/20 text-red-500 border-red-500/30'
                            }
                          >
                            {adminUser.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-text-secondary">
                          {adminUser.last_login_at 
                            ? new Date(adminUser.last_login_at).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAdmin(adminUser)
                                setFormData({
                                  email: adminUser.email,
                                  password: '',
                                  first_name: adminUser.first_name || '',
                                  last_name: adminUser.last_name || '',
                                  role: adminUser.role,
                                  permissions: adminUser.permissions || {},
                                  language_code: adminUser.language_code || 'en',
                                  timezone: adminUser.timezone || 'UTC'
                                })
                                setShowEditModal(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(adminUser.id)}
                              disabled={adminUser.role === 'super_admin'}
                            >
                              {adminUser.is_active ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAdmin(adminUser)
                                setShowDeleteModal(true)
                              }}
                              disabled={adminUser.role === 'super_admin' || adminUser.id === admin?.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-text-secondary">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="text-text-secondary">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Roles & Permissions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Roles & Permissions</h2>
            <p className="text-text-secondary mt-1">View and understand system roles and permissions</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              onClick={() => window.open('/admin/roles', '_blank')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Advanced Management
            </Button>
          </div>
        </div>

          {/* Role Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Total Roles</p>
                  <p className="text-2xl font-bold text-text-primary">{roles.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Total Permissions</p>
                  <p className="text-2xl font-bold text-text-primary">{permissions.length}</p>
                </div>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">System Roles</p>
                  <p className="text-2xl font-bold text-text-primary">{roles.filter(r => r.value.includes('admin')).length}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Custom Roles</p>
                  <p className="text-2xl font-bold text-text-primary">0</p>
                </div>
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
              </div>
            </Card>
          </div>

          {/* Interactive Role Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {roles.map((role) => (
              <Card key={role.value} className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-background-tertiary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      {getRoleIcon(role.value)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-primary text-lg group-hover:text-primary transition-colors">
                        {role.label}
                      </h4>
                      <p className="text-text-secondary text-sm">{role.description}</p>
                    </div>
                  </div>
                  <Badge className={`${getRoleBadgeColor(role.value)} group-hover:scale-105 transition-transform`}>
                    {role.value.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-text-secondary mb-3 flex items-center">
                      <Lock className="w-4 h-4 mr-2" />
                      Permissions ({role.permissions.length})
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission) => (
                        <Badge 
                          key={permission} 
                          className="bg-primary/10 text-primary border-primary/20 text-xs hover:bg-primary/20 transition-colors"
                        >
                          {permission === '*' ? 'All Permissions' : permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center space-x-4 text-sm text-text-secondary">
                      <span className="flex items-center">
                        <Shield className="w-3 h-3 mr-1" />
                        System Role
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Crown className="w-3 h-3 mr-1" />
                        Predefined
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          alert(`Viewing details for ${role.label}`)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          alert(`Copying role: ${role.label}`)
                        }}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Interactive Permissions Guide */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Permissions Guide</h3>
                <p className="text-text-secondary mt-1">Click on permissions to learn more about their usage</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert('Opening permissions documentation')}
              >
                <Globe className="w-4 h-4 mr-2" />
                Documentation
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {permissions.map((permission) => (
                <div 
                  key={permission.key} 
                  className="border border-border rounded-lg p-4 hover:bg-background-tertiary hover:border-primary/30 transition-all duration-200 cursor-pointer group"
                  onClick={() => alert(`Permission: ${permission.label}\n\n${permission.description}`)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Lock className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-text-primary text-sm mb-1 group-hover:text-primary transition-colors">
                        {permission.label}
                      </h4>
                      <p className="text-text-secondary text-xs leading-relaxed">{permission.description}</p>
                      <div className="mt-2">
                        <Badge className="bg-background-tertiary text-text-secondary text-xs group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {permission.key}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-secondary border border-border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              {showCreateModal ? 'Create Admin' : 'Edit Admin'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  readOnly={showEditModal}
                  className={showEditModal ? 'bg-background-tertiary cursor-not-allowed' : ''}
                />
              </div>
              
              {showCreateModal && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">First Name</label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Last Name</label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Role</label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  placeholder="Select a role"
                >
                  {roles.map((role) => (
                    <SelectItem 
                      key={role.value} 
                      value={role.value}
                    >
                      {role.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setShowEditModal(false)
                    setSelectedAdmin(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary-dark text-white">
                  {showCreateModal ? 'Create' : 'Update'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-secondary border border-border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Delete Admin</h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete {selectedAdmin?.email}? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedAdmin(null)
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteAdmin}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminManagement 