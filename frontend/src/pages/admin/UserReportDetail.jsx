import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar, 
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Edit,
  Save,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const UserReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchReportDetails();
  }, [id]);

  const fetchReportDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/user-reports/${id}`);
      
      if (response.data.success) {
        setReport(response.data.data);
        setAdminNotes(response.data.data.admin_notes || '');
      }
    } catch (error) {
      console.error('Error fetching report details:', error);
      toast.error('Failed to fetch report details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const response = await api.put(`/api/admin/user-reports/${id}/status`, {
        status: newStatus,
        admin_notes: adminNotes
      });

      if (response.data.success) {
        toast.success(`Report status updated to ${newStatus}`);
        fetchReportDetails();
        setEditing(false);
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      toast.error('Failed to update report status');
    }
  };

  const handleSaveNotes = async () => {
    try {
      const response = await api.put(`/api/admin/user-reports/${id}/notes`, {
        admin_notes: adminNotes
      });

      if (response.data.success) {
        toast.success('Admin notes updated');
        setEditing(false);
      }
    } catch (error) {
      console.error('Error updating admin notes:', error);
      toast.error('Failed to update admin notes');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      investigating: { color: 'bg-blue-100 text-blue-800', icon: AlertTriangle },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      dismissed: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const getReportTypeBadge = (type) => {
    const typeConfig = {
      harassment: { color: 'bg-red-100 text-red-800' },
      inappropriate_behavior: { color: 'bg-orange-100 text-orange-800' },
      safety_concern: { color: 'bg-yellow-100 text-yellow-800' },
      payment_issue: { color: 'bg-purple-100 text-purple-800' },
      other: { color: 'bg-gray-100 text-gray-800' }
    };

    const config = typeConfig[type] || typeConfig.other;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading report details...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Report Not Found</h1>
          <button
            onClick={() => navigate('/admin/user-reports')}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/user-reports')}
            className="flex items-center gap-2 px-3 py-2 bg-background-secondary hover:bg-background-tertiary text-text-primary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Report Details</h1>
            <p className="text-gray-400 mt-1">View and manage user report</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusBadge(report.status)}
          {getReportTypeBadge(report.report_type)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Information */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Report Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Report Reason</label>
                <p className="text-white mt-1">
                  {report.report_reason_en || report.report_reason_ar || 'No reason provided'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-400">Additional Details</label>
                <p className="text-white mt-1">
                  {report.additional_details || 'No additional details provided'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-400">Evidence/Proof</label>
                <p className="text-white mt-1">
                  {report.evidence_proof || 'No evidence provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Admin Notes
              </h2>
              
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 px-3 py-1 bg-primary hover:bg-primary-dark text-white rounded transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveNotes}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setAdminNotes(report.admin_notes || '');
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
            
            {editing ? (
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full h-32 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Add admin notes here..."
              />
            ) : (
              <p className="text-white">
                {adminNotes || 'No admin notes yet'}
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Users Involved */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Users Involved</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Reported User</label>
                <div className="mt-1 p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-white font-medium">
                      {report.reported_first_name} {report.reported_last_name}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{report.reported_email}</p>
                  <button
                    onClick={() => navigate(`/admin/users/${report.reported_user_id}`)}
                    className="text-primary hover:text-primary-dark text-sm mt-1"
                  >
                    View User Profile
                  </button>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-400">Reporter</label>
                <div className="mt-1 p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-white font-medium">
                      {report.reporter_first_name} {report.reporter_last_name}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{report.reporter_email}</p>
                  <button
                    onClick={() => navigate(`/admin/users/${report.reporter_user_id}`)}
                    className="text-primary hover:text-primary-dark text-sm mt-1"
                  >
                    View User Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Report Timeline */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="text-white text-sm">Report Created</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              {report.updated_at && report.updated_at !== report.created_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-white text-sm">Last Updated</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(report.updated_at).toLocaleDateString()} at {new Date(report.updated_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}
              
              {report.resolved_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-white text-sm">Resolved</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(report.resolved_at).toLocaleDateString()} at {new Date(report.resolved_at).toLocaleTimeString()}
                    </p>
                    {report.resolved_by && (
                      <p className="text-gray-400 text-xs">
                        by {report.admin_first_name} {report.admin_last_name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
            
            <div className="space-y-2">
              {report.status === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate('investigating')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Mark Investigating
                </button>
              )}
              
              {report.status === 'investigating' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate('resolved')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Resolved
                  </button>
                  
                  <button
                    onClick={() => handleStatusUpdate('dismissed')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Dismiss Report
                  </button>
                </>
              )}
              
              {(report.status === 'resolved' || report.status === 'dismissed') && (
                <button
                  onClick={() => handleStatusUpdate('investigating')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Reopen Investigation
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserReportDetail; 