import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  MapPin,
  User,
  DollarSign,
  Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const RideManagement = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    min_distance: '',
    max_distance: '',
    min_fare: '',
    max_fare: '',
    date_from: '',
    date_to: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchRides();
  }, [pagination.page, filters, activeTab]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      let endpoint = '/api/admin/rides';
      if (activeTab === 'active') {
        endpoint = '/api/admin/rides/active';
      } else if (activeTab === 'completed') {
        endpoint = '/api/admin/rides/completed';
      } else if (activeTab === 'cancelled') {
        endpoint = '/api/admin/rides/cancelled';
      }

      const response = await axios.get(`${endpoint}?${params}`);
      
      if (response.data.success) {
        if (activeTab === 'all') {
          setRides(response.data.data.data);
          setPagination(prev => ({
            ...prev,
            total: response.data.data.pagination.total,
            totalPages: response.data.data.pagination.totalPages
          }));
        } else {
          setRides(response.data.data);
          setPagination(prev => ({
            ...prev,
            total: response.data.data.length,
            totalPages: 1
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching rides:', error);
      toast.error('Failed to fetch rides');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRideAction = async (rideId, action, data = {}) => {
    try {
      let response;
      
      switch (action) {
        case 'update_status':
          response = await axios.put(`/api/admin/rides/${rideId}/status`, data);
          break;
        case 'delete':
          response = await axios.delete(`/api/admin/rides/${rideId}`);
          break;
        default:
          return;
      }

      if (response.data.success) {
        toast.success(response.data.message);
        fetchRides();
      }
    } catch (error) {
      console.error(`Error ${action} ride:`, error);
      toast.error(`Failed to ${action} ride`);
    }
  };

  const exportRides = async (format = 'json') => {
    try {
      const params = new URLSearchParams({
        format,
        ...filters
      });

      if (format === 'csv') {
        const response = await axios.get(`/api/admin/rides/export?${params}`, {
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `rides_export.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const response = await axios.get(`/api/admin/rides/export?${params}`);
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'rides_export.json');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      
      toast.success(`Rides exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting rides:', error);
      toast.error('Failed to export rides');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      started: { color: 'bg-green-100 text-green-800', icon: Play },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
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

  const getRatingStars = (rating) => {
         if (!rating || typeof rating !== 'number') return <span className="text-gray-500">No rating</span>;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    
    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="text-sm text-gray-400 ml-1">({rating && typeof rating === 'number' ? rating.toFixed(1) : 'N/A'})</span>
      </div>
    );
  };

  const tabs = [
    { id: 'all', label: 'All Rides', icon: Car },
    { id: 'active', label: 'Active', icon: Play },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
    { id: 'cancelled', label: 'Cancelled', icon: XCircle }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Ride Management</h1>
          <p className="text-gray-400 mt-1">Monitor and manage ride operations</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportRides('json')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          <button
            onClick={() => exportRides('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex gap-4 items-end">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="started">Started</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Min Distance (km)</label>
              <input
                type="number"
                step="0.1"
                placeholder="0"
                value={filters.min_distance}
                onChange={(e) => handleFilterChange('min_distance', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Distance (km)</label>
              <input
                type="number"
                step="0.1"
                placeholder="100"
                value={filters.max_distance}
                onChange={(e) => handleFilterChange('max_distance', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Min Fare ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={filters.min_fare}
                onChange={(e) => handleFilterChange('min_fare', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Fare ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="1000"
                value={filters.max_fare}
                onChange={(e) => handleFilterChange('max_fare', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date From</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Rides Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Ride Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Distance & Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Fare & Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-400">
                    Loading rides...
                  </td>
                </tr>
              ) : rides.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-400">
                    No rides found
                  </td>
                </tr>
              ) : (
                rides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">
                          Ride #{ride.ride_id?.slice(0, 8) || ride.id?.slice(0, 8)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {ride.user_first_name} {ride.user_last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(ride.created_at).toLocaleDateString()} at {new Date(ride.created_at).toLocaleTimeString()}
                        </div>
                        {ride.pickup_location && (
                          <div className="text-xs text-gray-400 mt-1">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {ride.pickup_location}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(ride.status)}
                      {ride.cancellation_reason && (
                        <div className="text-xs text-red-400 mt-1">
                          {ride.cancellation_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {ride.distance_km ? `${ride.distance_km} km` : 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ride.duration_minutes ? `${ride.duration_minutes} min` : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${ride.fare_amount || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400">
                          Commission: ${ride.commission_amount || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRatingStars(ride.rating)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.location.href = `/admin/rides/${ride.ride_id || ride.id}`}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {ride.status === 'pending' && (
                          <button
                            onClick={() => handleRideAction(ride.ride_id || ride.id, 'update_status', { status: 'confirmed' })}
                            className="p-1 text-green-400 hover:text-green-300 transition-colors"
                            title="Confirm Ride"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {ride.status === 'confirmed' && (
                          <button
                            onClick={() => handleRideAction(ride.ride_id || ride.id, 'update_status', { status: 'started' })}
                            className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                            title="Start Ride"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        
                        {['pending', 'confirmed', 'started'].includes(ride.status) && (
                          <button
                            onClick={() => handleRideAction(ride.ride_id || ride.id, 'update_status', { 
                              status: 'cancelled',
                              cancellation_reason: 'Cancelled by admin'
                            })}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            title="Cancel Ride"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleRideAction(ride.ride_id || ride.id, 'delete')}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Ride"
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
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} rides
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

export default RideManagement; 