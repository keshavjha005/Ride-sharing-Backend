import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const UserReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    report_type: '',
    date_from: '',
    date_to: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReports, setSelectedReports] = useState([]);

  useEffect(() => {
    fetchReports();
  }, [pagination.page, filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await api.get(`/api/admin/user-reports?${params}`);
      
      if (response.data.success) {
        setReports(response.data.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          totalPages: response.data.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
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

  const handleReportAction = async (reportId, action, data = {}) => {
    try {
      let response;
      
      switch (action) {
        case 'investigate':
          response = await api.put(`/api/admin/user-reports/${reportId}/status`, { 
            status: 'investigating',
            admin_notes: data.admin_notes
          });
          break;
        case 'resolve':
          response = await api.put(`/api/admin/user-reports/${reportId}/status`, { 
            status: 'resolved',
            admin_notes: data.admin_notes
          });
          break;
        case 'dismiss':
          response = await api.put(`/api/admin/user-reports/${reportId}/status`, { 
            status: 'dismissed',
            admin_notes: data.admin_notes
          });
          break;
        default:
          return;
      }

      if (response.data.success) {
        toast.success(response.data.message);
        fetchReports();
      }
    } catch (error) {
      console.error(`Error ${action} report:`, error);
      toast.error(`Failed to ${action} report`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedReports.length === 0) {
      toast.error('Please select reports to perform bulk action');
      return;
    }

    try {
      const response = await api.post('/api/admin/user-reports/bulk-update', {
        report_ids: selectedReports,
        status: action
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedReports([]);
        fetchReports();
      }
    } catch (error) {
      console.error(`Error bulk ${action} reports:`, error);
      toast.error(`Failed to bulk ${action} reports`);
    }
  };

  const exportReports = async (format = 'json') => {
    try {
      const params = new URLSearchParams({
        format,
        ...filters
      });

      if (format === 'csv') {
        const response = await api.get(`/api/admin/user-reports/export?${params}`, {
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `user_reports_export.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const response = await api.get(`/api/admin/user-reports/export?${params}`);
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'user_reports_export.json');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      
      toast.success(`Reports exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting reports:', error);
      toast.error('Failed to export reports');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      investigating: { color: 'bg-blue-100 text-blue-800', icon: AlertTriangle },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      dismissed: { color: 'bg-red-100 text-red-800', icon: XCircle }
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

  const getReportTypeBadge = (type) => {
    const colors = {
      inappropriate_behavior: 'bg-red-100 text-red-800',
      safety_concern: 'bg-orange-100 text-orange-800',
      fraud: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type] || colors.other}`}>
        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const handleSelectReport = (reportId) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(report => report.id));
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Reports</h1>
          <p className="text-gray-400 mt-1">Manage and resolve user reports</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportReports('json')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          <button
            onClick={() => exportReports('csv')}
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
          <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Report Type</label>
              <select
                value={filters.report_type}
                onChange={(e) => handleFilterChange('report_type', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Types</option>
                <option value="inappropriate_behavior">Inappropriate Behavior</option>
                <option value="safety_concern">Safety Concern</option>
                <option value="fraud">Fraud</option>
                <option value="other">Other</option>
              </select>
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

      {/* Bulk Actions */}
      {selectedReports.length > 0 && (
        <div className="bg-blue-900 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-blue-200">
              {selectedReports.length} report(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('investigating')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
              >
                Mark Investigating
              </button>
              <button
                onClick={() => handleBulkAction('resolved')}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
              >
                Mark Resolved
              </button>
              <button
                onClick={() => handleBulkAction('dismissed')}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedReports.length === reports.length && reports.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-600 bg-gray-700 text-orange-600 focus:ring-orange-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Reported User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Reporter
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
                    Loading reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-400">
                    No reports found
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id)}
                        onChange={() => handleSelectReport(report.id)}
                        className="rounded border-gray-600 bg-gray-700 text-orange-600 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-white truncate">
                          {report.report_reason_en}
                        </div>
                        {report.admin_notes && (
                          <div className="text-xs text-gray-400 mt-1 truncate">
                            Admin: {report.admin_notes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getReportTypeBadge(report.report_type)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        <div>{report.reported_first_name} {report.reported_last_name}</div>
                        <div className="text-xs text-gray-400">{report.reported_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        <div>{report.reporter_first_name} {report.reporter_last_name}</div>
                        <div className="text-xs text-gray-400">{report.reporter_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(report.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/user-reports/${report.id}`)}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {report.status === 'pending' && (
                          <button
                            onClick={() => handleReportAction(report.id, 'investigate')}
                            className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                            title="Mark Investigating"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {report.status === 'investigating' && (
                          <>
                            <button
                              onClick={() => handleReportAction(report.id, 'resolve')}
                              className="p-1 text-green-400 hover:text-green-300 transition-colors"
                              title="Mark Resolved"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReportAction(report.id, 'dismiss')}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                              title="Dismiss"
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
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} reports
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

export default UserReports; 