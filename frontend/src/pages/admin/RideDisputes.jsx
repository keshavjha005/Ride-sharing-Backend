import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Car,
  DollarSign,
  Shield,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const RideDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    dispute_type: '',
    ride_id: '',
    date_from: '',
    date_to: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDisputes, setSelectedDisputes] = useState([]);

  useEffect(() => {
    fetchDisputes();
  }, [pagination.page, filters]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await axios.get(`/api/admin/ride-disputes?${params}`);
      
      if (response.data.success) {
        setDisputes(response.data.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          totalPages: response.data.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast.error('Failed to fetch disputes');
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

  const handleDisputeAction = async (disputeId, action, data = {}) => {
    try {
      let response;
      
      switch (action) {
        case 'investigate':
          response = await axios.put(`/api/admin/ride-disputes/${disputeId}/resolve`, { 
            status: 'investigating',
            resolution_en: data.resolution_en || 'Investigation started'
          });
          break;
        case 'resolve':
          response = await axios.put(`/api/admin/ride-disputes/${disputeId}/resolve`, { 
            status: 'resolved',
            resolution_en: data.resolution_en || 'Dispute resolved',
            resolution_ar: data.resolution_ar
          });
          break;
        case 'close':
          response = await axios.put(`/api/admin/ride-disputes/${disputeId}/resolve`, { 
            status: 'closed',
            resolution_en: data.resolution_en || 'Dispute closed',
            resolution_ar: data.resolution_ar
          });
          break;
        default:
          return;
      }

      if (response.data.success) {
        toast.success(response.data.message);
        fetchDisputes();
      }
    } catch (error) {
      console.error(`Error ${action} dispute:`, error);
      toast.error(`Failed to ${action} dispute`);
    }
  };

  const exportDisputes = async (format = 'json') => {
    try {
      const params = new URLSearchParams({
        format,
        ...filters
      });

      if (format === 'csv') {
        const response = await axios.get(`/api/admin/ride-disputes/export?${params}`, {
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `ride_disputes_export.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const response = await axios.get(`/api/admin/ride-disputes/export?${params}`);
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'ride_disputes_export.json');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      
      toast.success(`Disputes exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting disputes:', error);
      toast.error('Failed to export disputes');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      investigating: { color: 'bg-blue-100 text-blue-800', icon: AlertTriangle },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      closed: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const badge = badges[status] || badges.open;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getDisputeTypeBadge = (type) => {
    const colors = {
      payment: 'bg-red-100 text-red-800',
      service: 'bg-orange-100 text-orange-800',
      safety: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    };
    
    const icons = {
      payment: DollarSign,
      service: Car,
      safety: Shield,
      other: MessageSquare
    };
    
    const Icon = icons[type] || MessageSquare;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type] || colors.other}`}>
        <Icon className="w-3 h-3 mr-1" />
        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const handleSelectDispute = (disputeId) => {
    setSelectedDisputes(prev => 
      prev.includes(disputeId) 
        ? prev.filter(id => id !== disputeId)
        : [...prev, disputeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDisputes.length === disputes.length) {
      setSelectedDisputes([]);
    } else {
      setSelectedDisputes(disputes.map(dispute => dispute.id));
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Ride Disputes</h1>
          <p className="text-gray-400 mt-1">Manage and resolve ride-related disputes</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportDisputes('json')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          <button
            onClick={() => exportDisputes('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
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
          <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Dispute Type</label>
              <select
                value={filters.dispute_type}
                onChange={(e) => handleFilterChange('dispute_type', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Types</option>
                <option value="payment">Payment</option>
                <option value="service">Service</option>
                <option value="safety">Safety</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ride ID</label>
              <input
                type="text"
                placeholder="Enter ride ID"
                value={filters.ride_id}
                onChange={(e) => handleFilterChange('ride_id', e.target.value)}
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
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date To</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Disputes Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedDisputes.length === disputes.length && disputes.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-600 bg-gray-700 text-orange-600 focus:ring-orange-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Dispute
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Ride Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-400">
                    Loading disputes...
                  </td>
                </tr>
              ) : disputes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-400">
                    No disputes found
                  </td>
                </tr>
              ) : (
                disputes.map((dispute) => (
                  <tr key={dispute.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedDisputes.includes(dispute.id)}
                        onChange={() => handleSelectDispute(dispute.id)}
                        className="rounded border-gray-600 bg-gray-700 text-orange-600 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-white truncate">
                          {dispute.dispute_reason_en}
                        </div>
                        {dispute.resolution_en && (
                          <div className="text-xs text-gray-400 mt-1 truncate">
                            Resolution: {dispute.resolution_en}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getDisputeTypeBadge(dispute.dispute_type)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(dispute.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        <div>Ride #{dispute.ride_id?.slice(0, 8)}</div>
                        {dispute.pickup_location && (
                          <div className="text-xs text-gray-400">
                            From: {dispute.pickup_location}
                          </div>
                        )}
                        {dispute.dropoff_location && (
                          <div className="text-xs text-gray-400">
                            To: {dispute.dropoff_location}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        <div>{dispute.user_first_name} {dispute.user_last_name}</div>
                        <div className="text-xs text-gray-400">{dispute.user_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {new Date(dispute.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(dispute.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.location.href = `/admin/ride-disputes/${dispute.id}`}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {dispute.status === 'open' && (
                          <button
                            onClick={() => handleDisputeAction(dispute.id, 'investigate')}
                            className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                            title="Start Investigation"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {dispute.status === 'investigating' && (
                          <>
                            <button
                              onClick={() => handleDisputeAction(dispute.id, 'resolve')}
                              className="p-1 text-green-400 hover:text-green-300 transition-colors"
                              title="Resolve Dispute"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDisputeAction(dispute.id, 'close')}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                              title="Close Dispute"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
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
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} disputes
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

export default RideDisputes; 