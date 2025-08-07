import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  ShieldOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  FileText,
  MapPin,
  CreditCard,
  Clock,
  Edit,
  Trash2,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [recentRides, setRecentRides] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/users/${id}`);
      
      if (response.data.success) {
        setUser(response.data.data.user);
        setReports(response.data.data.reports || []);
        setRecentRides(response.data.data.recentRides || []);
        setRecentPayments(response.data.data.recentPayments || []);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action, data = {}) => {
    try {
      let response;
      
      switch (action) {
        case 'block':
          response = await api.post(`/api/admin/users/${id}/block`, { is_active: false });
          break;
        case 'unblock':
          response = await api.post(`/api/admin/users/${id}/block`, { is_active: true });
          break;
        case 'verify':
          response = await api.post(`/api/admin/users/${id}/verify`, { verification_status: 'verified' });
          break;
        case 'reject':
          response = await api.post(`/api/admin/users/${id}/verify`, { verification_status: 'rejected' });
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            response = await api.delete(`/api/admin/users/${id}`);
            if (response.data.success) {
              toast.success('User deleted successfully');
              navigate('/admin/users');
              return;
            }
          } else {
            return;
          }
          break;
        default:
          return;
      }

      if (response.data.success) {
        toast.success(response.data.message);
        fetchUserDetails();
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      toast.error(`Failed to ${action} user`);
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
    const statusConfig = {
      verified: { color: 'bg-success/20 text-success border border-success/30', icon: CheckCircle },
      pending: { color: 'bg-warning/20 text-warning border border-warning/30', icon: Clock },
      rejected: { color: 'bg-error/20 text-error border border-error/30', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status || 'pending'}
      </span>
    );
  };

  const getRiskScoreBadge = (score) => {
    if (!score && score !== 0) return <span className="text-gray-400">N/A</span>;
    
    let color = 'text-success';
    if (score > 0.7) color = 'text-error';
    else if (score > 0.4) color = 'text-warning';
    
    return (
      <span className={`font-medium ${color}`}>
        {(score * 100).toFixed(0)}%
      </span>
    );
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

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">User Not Found</h1>
          <button
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            Back to Users
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
             onClick={() => navigate('/admin/users')}
             className="flex items-center gap-2 px-3 py-2 bg-background-secondary hover:bg-background-tertiary text-text-primary rounded-lg transition-colors"
           >
             <ArrowLeft className="w-4 h-4" />
             Back to Users
           </button>
          <div>
            <h1 className="text-2xl font-bold text-white">User Details</h1>
            <p className="text-gray-400 mt-1">Manage user account and view analytics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {user.is_active ? (
                       <button
             onClick={() => handleUserAction('block')}
             className="flex items-center gap-2 px-4 py-2 bg-error hover:bg-error/80 text-white rounded-lg transition-colors"
           >
             <ShieldOff className="w-4 h-4" />
             Block User
           </button>
          ) : (
                         <button
               onClick={() => handleUserAction('unblock')}
               className="flex items-center gap-2 px-4 py-2 bg-success hover:bg-success/80 text-white rounded-lg transition-colors"
             >
               <Shield className="w-4 h-4" />
               Unblock User
             </button>
          )}
          
          {user.verification_status === 'pending' && (
            <div className="flex gap-2">
                             <button
                 onClick={() => handleUserAction('verify')}
                 className="flex items-center gap-2 px-4 py-2 bg-success hover:bg-success/80 text-white rounded-lg transition-colors"
               >
                 <CheckCircle className="w-4 h-4" />
                 Verify
               </button>
               <button
                 onClick={() => handleUserAction('reject')}
                 className="flex items-center gap-2 px-4 py-2 bg-error hover:bg-error/80 text-white rounded-lg transition-colors"
               >
                 <XCircle className="w-4 h-4" />
                 Reject
               </button>
            </div>
          )}
          
                     <button
             onClick={() => handleUserAction('delete')}
             className="flex items-center gap-2 px-4 py-2 bg-error hover:bg-error/80 text-white rounded-lg transition-colors"
           >
             <Trash2 className="w-4 h-4" />
             Delete
           </button>
        </div>
      </div>

      {/* User Overview Card */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">User Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-gray-400 text-sm">Full Name</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white">{user.email}</p>
                  <p className="text-gray-400 text-sm">Email</p>
                </div>
              </div>
              
              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white">{user.phone}</p>
                    <p className="text-gray-400 text-sm">Phone</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-gray-400 text-sm">Joined</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status & Verification */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Status & Verification</h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm mb-1">Account Status</p>
                {getStatusBadge(user.is_active)}
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Verification Status</p>
                {getVerificationBadge(user.verification_status)}
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Risk Score</p>
                {getRiskScoreBadge(user.risk_score)}
              </div>
            </div>
          </div>

          {/* Analytics Summary */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Analytics Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Rides</span>
                <span className="text-white font-medium">{user.total_rides || 0}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Total Spent</span>
                <span className="text-white font-medium">${user.total_spent || 0}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Average Rating</span>
                <span className="text-white font-medium">
                  {user.average_rating && typeof user.average_rating === 'number' 
                    ? user.average_rating.toFixed(1) 
                    : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Reports</span>
                <span className="text-white font-medium">{reports.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 rounded-lg">
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'rides', label: 'Recent Rides', icon: MapPin },
              { id: 'payments', label: 'Recent Payments', icon: CreditCard }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Account Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">User ID</span>
                      <span className="text-white font-mono">{user.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Language</span>
                      <span className="text-white">{user.language_code || 'en'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Currency</span>
                      <span className="text-white">{user.currency_code || 'USD'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Activity</span>
                      <span className="text-white">
                        {user.last_activity 
                          ? new Date(user.last_activity).toLocaleString()
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Performance Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Registration Date</span>
                      <span className="text-white">
                        {user.registration_date 
                          ? new Date(user.registration_date).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Rides</span>
                      <span className="text-white">{user.total_rides || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Spent</span>
                      <span className="text-white">${user.total_spent || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Average Rating</span>
                      <span className="text-white">
                        {user.average_rating && typeof user.average_rating === 'number' 
                          ? user.average_rating.toFixed(1) 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              {reports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No reports found for this user</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-white font-medium capitalize">
                            {report.report_type.replace('_', ' ')}
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Reported on {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          report.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                          report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">
                        {report.report_reason_en || report.report_reason_ar}
                      </p>
                      {report.admin_notes && (
                        <p className="text-gray-400 text-sm">
                          <strong>Admin Notes:</strong> {report.admin_notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Rides Tab */}
          {activeTab === 'rides' && (
            <div>
              {recentRides.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No recent rides found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentRides.map((ride) => (
                    <div key={ride.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-white font-medium">Ride #{ride.id}</h4>
                          <p className="text-gray-400 text-sm">
                            {new Date(ride.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ride.status === 'completed' ? 'bg-green-100 text-green-800' :
                          ride.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {ride.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300">
                        <p><strong>From:</strong> {ride.pickup_location}</p>
                        <p><strong>To:</strong> {ride.dropoff_location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Payments Tab */}
          {activeTab === 'payments' && (
            <div>
              {recentPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No recent payments found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-white font-medium">Payment #{payment.id}</h4>
                          <p className="text-gray-400 text-sm">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">${payment.amount}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm">
                        <strong>Method:</strong> {payment.payment_method}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetail; 