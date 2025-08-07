import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Car, 
  MapPin, 
  User, 
  Clock, 
  DollarSign, 
  Star, 
  AlertTriangle,
  FileText,
  TrendingUp,
  BarChart3,
  MessageSquare,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Calendar,
  Phone,
  Mail,
  Shield,
  Download,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const RideDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rideData, setRideData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchRideDetails();
  }, [id]);

  const fetchRideDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/rides/${id}`);
      
      if (response.data.success) {
        setRideData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching ride details:', error);
      toast.error('Failed to fetch ride details');
    } finally {
      setLoading(false);
    }
  };

  const handleRideAction = async (action, data = {}) => {
    try {
      let response;
      
      switch (action) {
        case 'update_status':
          response = await api.put(`/api/admin/rides/${id}/status`, data);
          break;
        case 'delete':
          response = await api.delete(`/api/admin/rides/${id}`);
          break;
        default:
          return;
      }

      if (response.data.success) {
        toast.success(response.data.message);
        fetchRideDetails();
      }
    } catch (error) {
      console.error(`Error ${action} ride:`, error);
      toast.error(`Failed to ${action} ride`);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      started: { color: 'bg-green-100 text-green-800', icon: Play },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRatingStars = (rating) => {
    if (!rating) return <span className="text-gray-400">No rating</span>;
    
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
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-400" />);
    }

    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="text-sm text-gray-400 ml-1">({rating})</span>
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
    { id: 'actions', label: 'Actions', icon: Edit }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading ride details...</div>
        </div>
      </div>
    );
  }

  if (!rideData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Ride not found</div>
        </div>
      </div>
    );
  }

  const { analytics, rideDetails, users, locations, disputes } = rideData;

  // Get pickup and dropoff locations from the locations array
  const pickupLocation = locations?.find(loc => loc.location_type === 'pickup')?.address || rideDetails?.pickup_location || 'N/A';
  const dropoffLocation = locations?.find(loc => loc.location_type === 'drop')?.address || rideDetails?.dropoff_location || 'N/A';

  // Get driver and passengers
  const driver = users?.find(user => user.role === 'driver' || user.user_id === rideDetails?.created_by);
  const passengers = users?.filter(user => user.role !== 'driver' && user.user_id !== rideDetails?.created_by) || [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/rides')}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Rides
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Ride Details</h1>
            <p className="text-gray-400 mt-1">Ride #{id}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleRideAction('delete')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Ride
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 rounded-lg mb-6">
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-500'
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
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800 rounded-lg">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="space-y-6">
              {/* Ride Status */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Ride Status</h3>
                {analytics && getStatusBadge(analytics.status)}
              </div>

              {/* Ride Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Pickup:</span>
                      <span className="text-white ml-2">{pickupLocation}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Dropoff:</span>
                      <span className="text-white ml-2">{dropoffLocation}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Driver Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Driver:</span>
                      <span className="text-white ml-2">{driver?.user_name || rideDetails?.creator_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white ml-2">{driver?.user_email || rideDetails?.creator_email || 'N/A'}</span>
                    </div>
                    {driver?.user_phone && (
                      <div>
                        <span className="text-gray-400">Phone:</span>
                        <span className="text-white ml-2">{driver.user_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Passengers Information */}
              {passengers.length > 0 && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Passengers ({passengers.length})
                  </h4>
                  <div className="space-y-3">
                    {passengers.map((passenger, index) => (
                      <div key={passenger.user_id || index} className="border-l-2 border-gray-600 pl-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-white font-medium">{passenger.user_name || 'Unknown Passenger'}</div>
                            <div className="text-gray-400 text-sm">{passenger.user_email || 'N/A'}</div>
                            {passenger.user_phone && (
                              <div className="text-gray-400 text-sm">{passenger.user_phone}</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-white text-sm">{passenger.booked_seats || 1} seat(s)</div>
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              passenger.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              passenger.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {passenger.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicle Information */}
              {rideDetails?.vehicle_brand && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Vehicle Information
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Brand:</span>
                      <div className="text-white">{rideDetails.vehicle_brand}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Model:</span>
                      <div className="text-white">{rideDetails.vehicle_model}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <div className="text-white">{rideDetails.vehicle_type}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Number:</span>
                      <div className="text-white">{rideDetails.vehicle_number || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Summary */}
              {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-400 text-sm">Distance</span>
                    </div>
                    <div className="text-white font-semibold">
                      {analytics.distance_km ? `${analytics.distance_km} km` : 'N/A'}
                    </div>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-green-400" />
                      <span className="text-gray-400 text-sm">Duration</span>
                    </div>
                    <div className="text-white font-semibold">
                      {analytics.duration_minutes ? `${analytics.duration_minutes} min` : 'N/A'}
                    </div>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-400 text-sm">Fare</span>
                    </div>
                    <div className="text-white font-semibold">
                      ${analytics.fare_amount || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-400 text-sm">Rating</span>
                    </div>
                    <div className="text-white font-semibold">
                      {getRatingStars(analytics.rating)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Ride Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Distance:</span>
                      <span className="text-white">{analytics.distance_km ? `${analytics.distance_km} km` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white">{analytics.duration_minutes ? `${analytics.duration_minutes} minutes` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-white">{analytics.status}</span>
                    </div>
                    {analytics.cancellation_reason && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cancellation Reason:</span>
                        <span className="text-red-400">{analytics.cancellation_reason}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Financial Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fare Amount:</span>
                      <span className="text-white">${analytics.fare_amount || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Commission:</span>
                      <span className="text-white">${analytics.commission_amount || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rating:</span>
                      <span className="text-white">{analytics.rating ? `${analytics.rating}/5` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">
                      {new Date(analytics.created_at).toLocaleDateString()} at {new Date(analytics.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === 'disputes' && (
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Ride Disputes</h3>
                <span className="text-gray-400">{disputes?.length || 0} dispute(s)</span>
              </div>

              {disputes && disputes.length > 0 ? (
                <div className="space-y-4">
                  {disputes.map((dispute) => (
                    <div key={dispute.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-white font-medium">Dispute #{dispute.id.slice(0, 8)}</h4>
                          <p className="text-gray-400 text-sm">{dispute.dispute_type}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          dispute.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          dispute.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                          dispute.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {dispute.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300">
                        <p><strong>Reason:</strong> {dispute.dispute_reason_en || dispute.dispute_reason_ar}</p>
                        {dispute.resolution_en && (
                          <p><strong>Resolution:</strong> {dispute.resolution_en}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No disputes found for this ride</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Ride Actions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Status Management</h4>
                  <div className="space-y-3">
                    {analytics?.status === 'pending' && (
                      <button
                        onClick={() => handleRideAction('update_status', { status: 'confirmed' })}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm Ride
                      </button>
                    )}
                    
                    {analytics?.status === 'confirmed' && (
                      <button
                        onClick={() => handleRideAction('update_status', { status: 'started' })}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Start Ride
                      </button>
                    )}
                    
                    {['pending', 'confirmed', 'started'].includes(analytics?.status) && (
                      <button
                        onClick={() => handleRideAction('update_status', { 
                          status: 'cancelled',
                          cancellation_reason: 'Cancelled by admin'
                        })}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel Ride
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Data Export</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        const data = JSON.stringify(rideData, null, 2);
                        const blob = new Blob([data], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `ride-${id}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export JSON
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RideDetail; 