import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    verification_status: '',
    min_rides: '',
    max_risk_score: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await api.get(`/api/admin/users?${params}`);
      
      if (response.data.success) {
        setUsers(response.data.data.users);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          totalPages: response.data.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleUserAction = async (userId, action, data = {}) => {
    try {
      let response;
      
      switch (action) {
        case 'block':
          response = await api.post(`/api/admin/users/${userId}/block`, { is_active: false });
          break;
        case 'unblock':
          response = await api.post(`/api/admin/users/${userId}/block`, { is_active: true });
          break;
        case 'verify':
          response = await api.post(`/api/admin/users/${userId}/verify`, { verification_status: 'verified' });
          break;
        case 'reject':
          response = await api.post(`/api/admin/users/${userId}/verify`, { verification_status: 'rejected' });
          break;
        case 'delete':
          response = await api.delete(`/api/admin/users/${userId}`);
          break;
        default:
          return;
      }

      if (response.data.success) {
        toast.success(response.data.message);
        fetchUsers();
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      toast.error(`Failed to ${action} user`);
    }
  };

  const exportUsers = async (format = 'json') => {
    try {
      const params = new URLSearchParams({
        format,
        ...filters
      });

      if (format === 'csv') {
        const response = await api.get(`/api/admin/users/export?${params}`, {
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `users_export.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const response = await api.get(`/api/admin/users/export?${params}`);
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'users_export.json');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      
      toast.success(`Users exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    }
  };

  const getStatusBadge = (isActive) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-success/20 text-success border border-success/30' 
        : 'bg-error/20 text-error border border-error/30'
    }`}>
      {isActive ? 'Active' : 'Blocked'}
    </span>
  );

  const getVerificationBadge = (status) => {
    if (!status) return <span className="text-gray-500">N/A</span>;
    
    const badges = {
      verified: { color: 'bg-success/20 text-success border border-success/30', icon: CheckCircle },
      pending: { color: 'bg-warning/20 text-warning border border-warning/30', icon: AlertTriangle },
      rejected: { color: 'bg-error/20 text-error border border-error/30', icon: XCircle }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRiskScoreBadge = (score) => {
    if (!score || typeof score !== 'number') return <span className="text-gray-500">N/A</span>;
    
    const color = score <= 0.3 ? 'text-success' : score <= 0.7 ? 'text-warning' : 'text-error';
    return <span className={`font-medium ${color}`}>{(score * 100).toFixed(0)}%</span>;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">Manage and monitor user accounts</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportUsers('json')}
            className="flex items-center gap-2 px-4 py-2 bg-background-secondary hover:bg-background-tertiary text-text-primary rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          <button
            onClick={() => exportUsers('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-background-secondary hover:bg-background-tertiary text-text-primary rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">Search Users</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by email, name, or phone..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-background-secondary hover:bg-background-tertiary text-text-primary rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          
          <button
            type="submit"
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Verification</label>
              <select
                value={filters.verification_status}
                onChange={(e) => handleFilterChange('verification_status', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Verification</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Min Rides</label>
              <input
                type="number"
                placeholder="0"
                value={filters.min_rides}
                onChange={(e) => handleFilterChange('min_rides', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Risk Score</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                placeholder="1.0"
                value={filters.max_risk_score}
                onChange={(e) => handleFilterChange('max_risk_score', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Verification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Analytics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Reports
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-400">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                        {user.phone && (
                          <div className="text-sm text-gray-400">{user.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.is_active)}
                    </td>
                    <td className="px-6 py-4">
                      {getVerificationBadge(user.verification_status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        <div>Rides: {user.total_rides || 0}</div>
                        <div>Spent: ${user.total_spent || 0}</div>
                        <div>Rating: {user.average_rating && typeof user.average_rating === 'number' ? user.average_rating.toFixed(1) : 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRiskScoreBadge(user.risk_score)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">
                        {user.report_count || 0} reports
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => user.id && navigate(`/admin/users/${user.id}`)}
                          className="p-1 text-info hover:text-info/80 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {user.is_active !== null && user.is_active !== undefined && user.is_active && (
                          <button
                            onClick={() => user.id && handleUserAction(user.id, 'block')}
                            className="p-1 text-error hover:text-error/80 transition-colors"
                            title="Block User"
                          >
                            <ShieldOff className="w-4 h-4" />
                          </button>
                        )}
                        
                        {user.is_active !== null && user.is_active !== undefined && !user.is_active && (
                          <button
                            onClick={() => user.id && handleUserAction(user.id, 'unblock')}
                            className="p-1 text-success hover:text-success/80 transition-colors"
                            title="Unblock User"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        
                        {user.verification_status && user.verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => user.id && handleUserAction(user.id, 'verify')}
                              className="p-1 text-success hover:text-success/80 transition-colors"
                              title="Verify User"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => user.id && handleUserAction(user.id, 'reject')}
                              className="p-1 text-error hover:text-error/80 transition-colors"
                              title="Reject User"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => user.id && handleUserAction(user.id, 'delete')}
                          className="p-1 text-error hover:text-error/80 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            
            <span className="text-sm text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 