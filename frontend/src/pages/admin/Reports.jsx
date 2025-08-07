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
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const Reports = () => {
  const { admin } = useAuth();
  const [scheduledReports, setScheduledReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const reportTypes = [
    { value: 'user_analytics', label: 'User Analytics', ar: 'تحليلات المستخدمين' },
    { value: 'ride_analytics', label: 'Ride Analytics', ar: 'تحليلات الرحلات' },
    { value: 'financial_analytics', label: 'Financial Analytics', ar: 'التحليلات المالية' },
    { value: 'system_analytics', label: 'System Analytics', ar: 'تحليلات النظام' }
  ];

  const scheduleTypes = [
    { value: 'daily', label: 'Daily', ar: 'يومي' },
    { value: 'weekly', label: 'Weekly', ar: 'أسبوعي' },
    { value: 'monthly', label: 'Monthly', ar: 'شهري' }
  ];

  const reportFormats = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'csv', label: 'CSV' }
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
      const response = await api.get('/api/admin/scheduled-reports');
      setScheduledReports(response.data.data.reports);
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      toast.error('Failed to load scheduled reports');
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
        ...formData,
        recipients: formData.recipients.filter(email => email.trim() !== '')
      };

              await api.post('/api/admin/scheduled-reports', payload);
      toast.success('Scheduled report created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchScheduledReports();
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      toast.error('Failed to create scheduled report');
    }
  };

  const handleUpdateReport = async () => {
    try {
      const payload = {
        ...formData,
        recipients: formData.recipients.filter(email => email.trim() !== '')
      };

              await api.put(`/api/admin/scheduled-reports/${selectedReport.id}`, payload);
      toast.success('Scheduled report updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchScheduledReports();
    } catch (error) {
      console.error('Error updating scheduled report:', error);
      toast.error('Failed to update scheduled report');
    }
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
      toast.error('Failed to delete scheduled report');
    }
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

  const generateReport = async (reportType, dateRange = '7d') => {
    try {
      const response = await api.post('/api/admin/reports/generate', {
        reportType,
        dateRange,
        format: 'json'
      });
      
      toast.success('Report generated successfully');
      console.log('Generated report:', response.data.data);
      
      // In a real implementation, you might want to show the report or download it
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
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
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {isActive ? (
        <>
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </>
      )}
    </span>
  );

  const getScheduleTypeLabel = (type) => {
    const scheduleType = scheduleTypes.find(st => st.value === type);
    return scheduleType ? scheduleType.label : type;
  };

  const getReportTypeLabel = (type) => {
    const reportType = reportTypes.find(rt => rt.value === type);
    return reportType ? reportType.label : type;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
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
          <button
            onClick={fetchScheduledReports}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-background-secondary text-text-primary rounded-lg border border-border hover:bg-background-tertiary transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={16} />
            <span>Create Report</span>
          </button>
        </div>
      </div>

      {/* Quick Report Generation */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Quick Reports</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reportTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => generateReport(type.value)}
              className="p-4 bg-background-secondary border border-border rounded-lg hover:bg-background-tertiary transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium text-text-primary">{type.label}</div>
                  <div className="text-sm text-text-muted">Generate now</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

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
              className="w-full pl-10 pr-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Scheduled Reports Table */}
      <div className="bg-background-secondary rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Report Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Format
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Next Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-background-tertiary">
                  <td className="px-6 py-4 whitespace-nowrap">
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
                    <span className="text-sm text-text-primary uppercase">
                      {report.report_format}
                    </span>
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
                        onClick={() => handleEditReport(report)}
                        className="p-1 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => generateReport(report.report_type)}
                        className="p-1 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-1 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
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
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-secondary rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              {showCreateModal ? 'Create Scheduled Report' : 'Edit Scheduled Report'}
            </h2>
            
            <div className="space-y-4">
              {/* Report Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Report Name (English)
                  </label>
                  <input
                    type="text"
                    value={formData.reportNameEn}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportNameEn: e.target.value }))}
                    className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter report name in English"
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
                    className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                    className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {reportTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
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
                    className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                    className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {reportFormats.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Recipients
                </label>
                <div className="space-y-2">
                  {formData.recipients.map((email, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => updateRecipient(index, e.target.value)}
                        className="flex-1 px-3 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter email address"
                      />
                      {formData.recipients.length > 1 && (
                        <button
                          onClick={() => removeRecipient(index)}
                          className="px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addRecipient}
                    className="text-sm text-primary hover:text-primary-dark transition-colors"
                  >
                    + Add another recipient
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={showCreateModal ? handleCreateReport : handleUpdateReport}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                {showCreateModal ? 'Create Report' : 'Update Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports; 