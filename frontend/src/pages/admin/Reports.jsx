import React, { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthContext';
import api from '../../utils/api';
import { 
  FileText, 
  Plus, 
  Calendar,
  Download,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  RefreshCw,
  Eye,
  MoreVertical,
  Mail,
  Settings,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

const Reports = () => {
  const { admin } = useAuth();
  const [scheduledReports, setScheduledReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [generatingReport, setGeneratingReport] = useState(null);
  const [error, setError] = useState(null);

  // Configuration for report types, schedule types, and formats
  const reportTypes = [
    { value: 'user_analytics', label: 'User Analytics', ar: 'تحليلات المستخدمين', icon: '👥' },
    { value: 'ride_analytics', label: 'Ride Analytics', ar: 'تحليلات الرحلات', icon: '🚗' },
    { value: 'financial_analytics', label: 'Financial Analytics', ar: 'التحليلات المالية', icon: '💰' },
    { value: 'system_analytics', label: 'System Analytics', ar: 'تحليلات النظام', icon: '⚙️' }
  ];

  const scheduleTypes = [
    { value: 'daily', label: 'Daily', ar: 'يومي' },
    { value: 'weekly', label: 'Weekly', ar: 'أسبوعي' },
    { value: 'monthly', label: 'Monthly', ar: 'شهري' }
  ];

  const reportFormats = [
    { value: 'pdf', label: 'PDF', icon: '📄' },
    { value: 'excel', label: 'Excel', icon: '📊' },
    { value: 'csv', label: 'CSV', icon: '📋' }
  ];

  const [formData, setFormData] = useState({
    reportNameAr: '',
    reportNameEn: '',
    reportType: 'user_analytics',
    scheduleType: 'daily',
    scheduleConfig: {},
    recipients: [''],
    reportFormat: 'pdf'
  });

  const fetchScheduledReports = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const response = await api.get('/api/admin/scheduled-reports');
      setScheduledReports(response.data.data.reports || []);
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      setError('Failed to load scheduled reports');
      toast.error('Failed to load scheduled reports');
      setScheduledReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScheduledReports();
  }, []);

  const handleCreateReport = async () => {
    try {
      const payload = {
        report_name_ar: formData.reportNameAr,
        report_name_en: formData.reportNameEn,
        report_type: formData.reportType,
        schedule_type: formData.scheduleType,
        schedule_config: formData.scheduleConfig,
        recipients: formData.recipients.filter(email => email.trim() !== ''),
        report_format: formData.reportFormat
      };

      // Validate required fields
      if (!payload.report_name_en.trim()) {
        toast.error('Report name in English is required');
        return;
      }

      if (payload.recipients.length === 0 || !payload.recipients[0].trim()) {
        toast.error('At least one recipient is required');
        return;
      }

      await api.post('/api/admin/scheduled-reports', payload);
      toast.success('Scheduled report created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchScheduledReports();
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      toast.error(error.response?.data?.message || 'Failed to create scheduled report');
    }
  };

  const handleUpdateReport = async () => {
    try {
      const payload = {
        report_name_ar: formData.reportNameAr,
        report_name_en: formData.reportNameEn,
        report_type: formData.reportType,
        schedule_type: formData.scheduleType,
        schedule_config: formData.scheduleConfig,
        recipients: formData.recipients.filter(email => email.trim() !== ''),
        report_format: formData.reportFormat
      };

      // Validate required fields
      if (!payload.report_name_en.trim()) {
        toast.error('Report name in English is required');
        return;
      }

      if (payload.recipients.length === 0 || !payload.recipients[0].trim()) {
        toast.error('At least one recipient is required');
        return;
      }

      await api.put(`/api/admin/scheduled-reports/${selectedReport.id}`, payload);
      toast.success('Scheduled report updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchScheduledReports();
    } catch (error) {
      console.error('Error updating scheduled report:', error);
      toast.error(error.response?.data?.message || 'Failed to update scheduled report');
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  const handleEditReport = (report) => {
    setSelectedReport(report);
    setFormData({
      reportNameAr: report.report_name_ar || '',
      reportNameEn: report.report_name_en || '',
      reportType: report.report_type,
      scheduleType: report.schedule_type,
      scheduleConfig: report.schedule_config || {},
      recipients: report.recipients || [''],
      reportFormat: report.report_format
    });
    setShowEditModal(true);
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this scheduled report?')) {
      return;
    }

    try {
      await api.delete(`/api/admin/scheduled-reports/${reportId}`);
      toast.success('Scheduled report deleted successfully');
      fetchScheduledReports();
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      toast.error(error.response?.data?.message || 'Failed to delete scheduled report');
    }
  };

  const resetForm = () => {
    setFormData({
      reportNameAr: '',
      reportNameEn: '',
      reportType: 'user_analytics',
      scheduleType: 'daily',
      scheduleConfig: {},
      recipients: [''],
      reportFormat: 'pdf'
    });
    setSelectedReport(null);
  };

  const addRecipient = () => {
    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };

  const removeRecipient = (index) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const updateRecipient = (index, value) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.map((email, i) => i === index ? value : email)
    }));
  };

  const generateReport = async (reportType, dateRange = '7d', reportId = null) => {
    try {
      setGeneratingReport(reportId || reportType);
      const response = await api.post('/api/admin/reports/generate', {
        reportType,
        dateRange,
        format: 'json'
      });
      
      toast.success('Report generated successfully');
      
      // Handle the generated report - could trigger download or show preview
      if (response.data.data.downloadUrl) {
        window.open(response.data.data.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setGeneratingReport(null);
    }
  };

  const filteredReports = scheduledReports.filter(report => {
    const matchesSearch = report.report_name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.report_name_ar.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && report.is_active) ||
                         (statusFilter === 'inactive' && !report.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (isActive) => (
    <Badge 
      variant={isActive ? 'default' : 'destructive'}
      className={`flex items-center space-x-1 ${isActive ? 'bg-success text-white' : 'bg-error text-white'}`}
    >
      {isActive ? (
        <>
          <CheckCircle className="w-3 h-3" />
          <span>Active</span>
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3" />
          <span>Inactive</span>
        </>
      )}
    </Badge>
  );

  const getScheduleTypeLabel = (type) => {
    const scheduleType = scheduleTypes.find(st => st.value === type);
    return scheduleType ? scheduleType.label : type;
  };

  const getReportTypeLabel = (type) => {
    const reportType = reportTypes.find(rt => rt.value === type);
    return reportType ? reportType.label : type;
  };

  const getReportTypeIcon = (type) => {
    const reportType = reportTypes.find(rt => rt.value === type);
    return reportType ? reportType.icon : '📊';
  };

  if (loading) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Reports & Analytics
          </h1>
          <p className="text-text-secondary">
            Generate and manage scheduled reports for comprehensive insights.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={fetchScheduledReports}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-primary hover:bg-primary-dark"
          >
            <Plus size={16} />
            <span>Create Report</span>
          </Button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-error" />
            <span className="text-error font-medium">Error</span>
          </div>
          <p className="text-text-secondary mt-1">
            {error}
          </p>
        </div>
      )}



      {/* Quick Report Generation */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Quick Reports</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reportTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => generateReport(type.value)}
                disabled={generatingReport === type.value}
                className="p-4 bg-background-secondary border border-border rounded-lg hover:bg-background-tertiary transition-all duration-200 text-left group hover:shadow-card disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <div className="font-medium text-text-primary group-hover:text-primary transition-colors">
                      {type.label}
                    </div>
                    <div className="text-sm text-text-muted">
                      {generatingReport === type.value ? 'Generating...' : 'Generate now'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Scheduled Reports Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-tertiary">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Report Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Format
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Next Run
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-background-tertiary transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{getReportTypeIcon(report.report_type)}</span>
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {report.report_name_en}
                        </div>
                        {report.report_name_ar && (
                          <div className="text-sm text-text-muted">
                            {report.report_name_ar}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-text-primary">
                      {getReportTypeLabel(report.report_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-text-primary">
                      {getScheduleTypeLabel(report.schedule_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className="text-xs">
                      {report.report_format.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(report.is_active)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-text-muted" />
                      <span className="text-sm text-text-primary">
                        {report.next_generation_at 
                          ? new Date(report.next_generation_at).toLocaleDateString()
                          : 'Not scheduled'
                        }
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewReport(report)}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors"
                        title="View Report"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEditReport(report)}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors"
                        style={{ color: '#B0B3BD' }}
                        title="Edit Report"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => generateReport(report.report_type, '7d', report.id)}
                        disabled={generatingReport === report.id}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors disabled:opacity-50"
                        style={{ color: '#B0B3BD' }}
                        title="Generate Report"
                      >
                        <Download size={16} className={generatingReport === report.id ? 'animate-spin' : ''} />
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        style={{ color: '#B0B3BD' }}
                        title="Delete Report"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">No scheduled reports found</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-primary hover:bg-primary-dark"
            >
              <Plus size={16} className="mr-2" />
              Create your first report
            </Button>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-modal">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">
                Create Scheduled Report
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-2"
              >
                <XCircle size={20} />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Report Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Report Name (English) *
                  </label>
                  <input
                    type="text"
                    value={formData.reportNameEn}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportNameEn: e.target.value }))}
                    className="w-full px-4 py-3 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="Enter report name in English"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Report Name (Arabic)
                  </label>
                  <input
                    type="text"
                    value={formData.reportNameAr}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportNameAr: e.target.value }))}
                    className="w-full px-4 py-3 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="أدخل اسم التقرير بالعربية"
                  />
                </div>
              </div>

              {/* Report Type and Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Report Type
                  </label>
                  <select
                    value={formData.reportType}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportType: e.target.value }))}
                    className="w-full px-4 py-3 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  >
                    {reportTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Schedule Type
                  </label>
                  <select
                    value={formData.scheduleType}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduleType: e.target.value }))}
                    className="w-full px-4 py-3 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  >
                    {scheduleTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Format
                  </label>
                  <select
                    value={formData.reportFormat}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportFormat: e.target.value }))}
                    className="w-full px-4 py-3 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  >
                    {reportFormats.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.icon} {format.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Recipients *
                </label>
                <div className="space-y-3">
                  {formData.recipients.map((email, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => updateRecipient(index, e.target.value)}
                        className="flex-1 px-4 py-3 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                        placeholder="Enter email address"
                        required={index === 0}
                      />
                      {formData.recipients.length > 1 && (
                        <Button
                          variant="ghost"
                          onClick={() => removeRecipient(index)}
                          className="px-3 py-3 text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={addRecipient}
                    className="text-primary hover:text-primary-dark border-primary hover:border-primary-dark"
                  >
                    <Mail size={16} className="mr-2" />
                    Add another recipient
                  </Button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateReport}
                className="bg-primary hover:bg-primary-dark"
              >
                Create Report
              </Button>
            </div>
                      </div>
          </div>
        )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-modal">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">
                Edit Scheduled Report
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="p-2"
              >
                <XCircle size={20} />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Report Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Report Name (English) *
                  </label>
                  <input
                    type="text"
                    value={formData.reportNameEn}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportNameEn: e.target.value }))}
                    className="w-full px-4 py-3 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="Enter report name in English"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Report Name (Arabic)
                  </label>
                  <input
                    type="text"
                    value={formData.reportNameAr}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportNameAr: e.target.value }))}
                    className="w-full px-4 py-3 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="أدخل اسم التقرير بالعربية"
                  />
                </div>
              </div>

              {/* Report Type and Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Report Type
                  </label>
                  <select
                    value={formData.reportType}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportType: e.target.value }))}
                    className="w-full px-4 py-3 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  >
                    {reportTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Schedule Type
                  </label>
                  <select
                    value={formData.scheduleType}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduleType: e.target.value }))}
                    className="w-full px-4 py-3 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  >
                    {scheduleTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Format
                  </label>
                  <select
                    value={formData.reportFormat}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportFormat: e.target.value }))}
                    className="w-full px-4 py-3 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  >
                    {reportFormats.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.icon} {format.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Recipients *
                </label>
                <div className="space-y-3">
                  {formData.recipients.map((email, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => updateRecipient(index, e.target.value)}
                        className="flex-1 px-4 py-3 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                        placeholder="Enter email address"
                        required={index === 0}
                      />
                      {formData.recipients.length > 1 && (
                        <Button
                          variant="ghost"
                          onClick={() => removeRecipient(index)}
                          className="px-3 py-3 text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={addRecipient}
                    className="text-primary hover:text-primary-dark border-primary hover:border-primary-dark"
                  >
                    <Mail size={16} className="mr-2" />
                    Add another recipient
                  </Button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateReport}
                className="bg-primary hover:bg-primary-dark"
              >
                Update Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {showViewModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-modal">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">
                Report Details
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowViewModal(false)}
                className="p-2"
              >
                <XCircle size={20} />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Name (English)</label>
                  <p className="text-text-primary">{selectedReport.report_name_en}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Name (Arabic)</label>
                  <p className="text-text-primary">{selectedReport.report_name_ar || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Type</label>
                  <p className="text-text-primary">{getReportTypeLabel(selectedReport.report_type)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Schedule</label>
                  <p className="text-text-primary">{getScheduleTypeLabel(selectedReport.schedule_type)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Format</label>
                  <Badge variant="outline">{selectedReport.report_format.toUpperCase()}</Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Status</label>
                  {getStatusBadge(selectedReport.is_active)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Recipients</label>
                <div className="space-y-1">
                  {selectedReport.recipients?.map((email, index) => (
                    <p key={index} className="text-text-primary">{email}</p>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Next Generation</label>
                <p className="text-text-primary">
                  {selectedReport.next_generation_at 
                    ? new Date(selectedReport.next_generation_at).toLocaleString()
                    : 'Not scheduled'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditReport(selectedReport);
                }}
                className="bg-primary hover:bg-primary-dark"
              >
                <Edit size={16} className="mr-2" />
                Edit Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports; 