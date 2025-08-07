import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Download,
  Eye,
  Settings,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const DocumentVerification = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [documents, setDocuments] = useState([]);
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    verification_status: '',
    document_type: '',
    user_id: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showRequiredDocModal, setShowRequiredDocModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab, pagination.page, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'documents':
          await fetchUserDocuments();
          break;
        case 'required':
          await fetchRequiredDocuments();
          break;
        case 'status':
          await fetchVerificationStatus();
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDocuments = async () => {
    const params = new URLSearchParams({
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    });

    const response = await api.get(`/api/verification/admin/user-documents?${params}`);
    
    if (response.data.success) {
      setDocuments(response.data.data.documents);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.pagination.total,
        totalPages: response.data.data.pagination.pages
      }));
    }
  };

  const fetchRequiredDocuments = async () => {
    const response = await api.get('/api/verification/admin/required-documents');
    
    if (response.data.success) {
      setRequiredDocuments(response.data.data);
    }
  };

  const fetchVerificationStatus = async () => {
    const params = new URLSearchParams({
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    });

    const response = await api.get(`/api/verification/admin/user-verification-status?${params}`);
    
    if (response.data.success) {
      setVerificationStatus(response.data.data.statuses);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.pagination.total,
        totalPages: response.data.data.pagination.pages
      }));
    }
  };

  const handleDocumentAction = async (documentId, action, notes = '') => {
    try {
      let response;
      
      switch (action) {
        case 'approve':
          response = await api.post(`/api/verification/admin/user-documents/${documentId}/approve`, { notes });
          break;
        case 'reject':
          if (!notes) {
            toast.error('Rejection notes are required');
            return;
          }
          response = await api.post(`/api/verification/admin/user-documents/${documentId}/reject`, { notes });
          break;
        default:
          return;
      }

      if (response.data.success) {
        toast.success(response.data.message);
        fetchData();
        setShowDocumentModal(false);
        setSelectedDocument(null);
      }
    } catch (error) {
      console.error(`Error ${action} document:`, error);
      toast.error(`Failed to ${action} document`);
    }
  };

  const handleRequiredDocumentAction = async (action, data = {}) => {
    try {
      let response;
      
      switch (action) {
        case 'create':
          response = await api.post('/api/verification/admin/required-documents', data);
          break;
        case 'update':
          response = await api.put(`/api/verification/admin/required-documents/${editingDocument.id}`, data);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this required document?')) {
            response = await api.delete(`/api/verification/admin/required-documents/${editingDocument.id}`);
          } else {
            return;
          }
          break;
        default:
          return;
      }

      if (response.data.success) {
        toast.success(response.data.message);
        fetchData();
        setShowRequiredDocModal(false);
        setEditingDocument(null);
      }
    } catch (error) {
      console.error(`Error ${action} required document:`, error);
      toast.error(`Failed to ${action} required document`);
    }
  };

  const getVerificationBadge = (status) => {
    const badges = {
      approved: { color: 'bg-success/20 text-success border border-success/30', icon: CheckCircle },
      pending: { color: 'bg-warning/20 text-warning border border-warning/30', icon: Clock },
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

  const getOverallStatusBadge = (status) => {
    if (!status || status === 'not_verified') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-500 border border-gray-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Not Verified
        </span>
      );
    }
    
    const badges = {
      verified: { color: 'bg-success/20 text-success border border-success/30', icon: CheckCircle },
      pending: { color: 'bg-warning/20 text-warning border border-warning/30', icon: Clock },
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-700 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Document Verification</h1>
          <p className="text-gray-400">Manage user document verification and required documents</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'documents'
              ? 'bg-primary text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          User Documents
        </button>
        <button
          onClick={() => setActiveTab('required')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'required'
              ? 'bg-primary text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Required Documents
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'status'
              ? 'bg-primary text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <CheckCircle className="w-4 h-4 inline mr-2" />
          Verification Status
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Verification Status
              </label>
              <select
                value={filters.verification_status}
                onChange={(e) => setFilters(prev => ({ ...prev, verification_status: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Document Type
              </label>
              <select
                value={filters.document_type}
                onChange={(e) => setFilters(prev => ({ ...prev, document_type: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Types</option>
                <option value="national_id">National ID</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
                <option value="vehicle_registration">Vehicle Registration</option>
                <option value="insurance">Insurance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={filters.user_id}
                onChange={(e) => setFilters(prev => ({ ...prev, user_id: e.target.value }))}
                placeholder="Enter user ID"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'documents' && (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium text-white mb-4">User Documents</h3>
            
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No documents found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Document Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">File</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Upload Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">{doc.first_name} {doc.last_name}</p>
                            <p className="text-gray-400 text-sm">{doc.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-white">{doc.document_name_en}</p>
                          <p className="text-gray-400 text-sm">{doc.document_type}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white text-sm">{doc.file_name}</p>
                            <p className="text-gray-400 text-sm">{formatFileSize(doc.file_size)}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getVerificationBadge(doc.verification_status)}
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {formatDate(doc.upload_date)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedDocument(doc);
                                setShowDocumentModal(true);
                              }}
                              className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                              title="View Document"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {doc.verification_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleDocumentAction(doc.id, 'approve')}
                                  className="p-1 text-success hover:text-success/80 transition-colors"
                                  title="Approve Document"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDocumentAction(doc.id, 'reject', 'Document rejected')}
                                  className="p-1 text-error hover:text-error/80 transition-colors"
                                  title="Reject Document"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'required' && (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">Required Documents</h3>
              <button
                onClick={() => {
                  setEditingDocument(null);
                  setShowRequiredDocModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Required Document
              </button>
            </div>
            
            {requiredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No required documents configured</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {requiredDocuments.map((doc) => (
                  <div key={doc.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-white font-medium">{doc.document_name_en}</h4>
                        <p className="text-gray-400 text-sm">{doc.document_type}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingDocument(doc);
                            setShowRequiredDocModal(true);
                          }}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRequiredDocumentAction('delete')}
                          className="p-1 text-error hover:text-error/80 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Required:</span>
                        <span className={`text-sm ${doc.is_required ? 'text-success' : 'text-gray-400'}`}>
                          {doc.is_required ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Active:</span>
                        <span className={`text-sm ${doc.is_active ? 'text-success' : 'text-gray-400'}`}>
                          {doc.is_active ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Max Files:</span>
                        <span className="text-white text-sm">{doc.max_files_per_document}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'status' && (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium text-white mb-4">User Verification Status</h3>
            
            {verificationStatus.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No verification status data found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Overall Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Documents</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Last Submission</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Verification Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationStatus.map((status) => (
                      <tr key={status.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">{status.first_name} {status.last_name}</p>
                            <p className="text-gray-400 text-sm">{status.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getOverallStatusBadge(status.overall_status)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <p className="text-white">Submitted: {status.documents_submitted}</p>
                            <p className="text-success">Approved: {status.documents_approved}</p>
                            <p className="text-error">Rejected: {status.documents_rejected}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {status.last_submission_date ? formatDate(status.last_submission_date) : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {status.verification_date ? formatDate(status.verification_date) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-400">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">Document Details</h3>
              <button
                onClick={() => {
                  setShowDocumentModal(false);
                  setSelectedDocument(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">Document Information</h4>
                <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Document Type:</span>
                    <span className="text-white">{selectedDocument.document_name_en}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">File Name:</span>
                    <span className="text-white">{selectedDocument.file_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">File Size:</span>
                    <span className="text-white">{formatFileSize(selectedDocument.file_size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Upload Date:</span>
                    <span className="text-white">{formatDate(selectedDocument.upload_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span>{getVerificationBadge(selectedDocument.verification_status)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">User Information</h4>
                <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{selectedDocument.first_name} {selectedDocument.last_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{selectedDocument.email}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Document Preview</h4>
                <div className="bg-gray-700 rounded-lg p-4">
                  <a
                    href={selectedDocument.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    View Document
                  </a>
                </div>
              </div>

              {selectedDocument.verification_status === 'pending' && (
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleDocumentAction(selectedDocument.id, 'approve')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-success hover:bg-success/80 text-white rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Document
                  </button>
                  <button
                    onClick={() => handleDocumentAction(selectedDocument.id, 'reject', 'Document rejected')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-error hover:bg-error/80 text-white rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Required Document Modal */}
      {showRequiredDocModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">
                {editingDocument ? 'Edit Required Document' : 'Add Required Document'}
              </h3>
              <button
                onClick={() => {
                  setShowRequiredDocModal(false);
                  setEditingDocument(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = {
                document_type: formData.get('document_type'),
                document_name_ar: formData.get('document_name_ar'),
                document_name_en: formData.get('document_name_en'),
                description_ar: formData.get('description_ar'),
                description_en: formData.get('description_en'),
                is_required: formData.get('is_required') === 'true',
                is_active: formData.get('is_active') === 'true',
                max_files_per_document: parseInt(formData.get('max_files_per_document'))
              };
              
              handleRequiredDocumentAction(editingDocument ? 'update' : 'create', data);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Document Type
                  </label>
                  <select
                    name="document_type"
                    defaultValue={editingDocument?.document_type || ''}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Document Type</option>
                    <option value="national_id">National ID</option>
                    <option value="passport">Passport</option>
                    <option value="driving_license">Driving License</option>
                    <option value="vehicle_registration">Vehicle Registration</option>
                    <option value="insurance">Insurance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Document Name (English)
                  </label>
                  <input
                    type="text"
                    name="document_name_en"
                    defaultValue={editingDocument?.document_name_en || ''}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Document Name (Arabic)
                  </label>
                  <input
                    type="text"
                    name="document_name_ar"
                    defaultValue={editingDocument?.document_name_ar || ''}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description (English)
                  </label>
                  <textarea
                    name="description_en"
                    defaultValue={editingDocument?.description_en || ''}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description (Arabic)
                  </label>
                  <textarea
                    name="description_ar"
                    defaultValue={editingDocument?.description_ar || ''}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Files Per Document
                  </label>
                  <input
                    type="number"
                    name="max_files_per_document"
                    defaultValue={editingDocument?.max_files_per_document || 3}
                    min="1"
                    max="10"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_required"
                      value="true"
                      defaultChecked={editingDocument?.is_required !== false}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-300">Required</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      value="true"
                      defaultChecked={editingDocument?.is_active !== false}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-300">Active</span>
                  </label>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                  >
                    {editingDocument ? 'Update' : 'Create'} Document
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRequiredDocModal(false);
                      setEditingDocument(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentVerification; 