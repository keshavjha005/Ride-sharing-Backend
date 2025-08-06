import React from 'react';
import { Clock, User, Car, DollarSign } from 'lucide-react';

const TableWidget = ({ widget, data, language = 'en' }) => {
  const config = widget.config || {};
  
  const getTableData = () => {
    if (!data) return [];
    
    switch (widget.widget_key) {
      case 'recent_bookings':
        return data.recentBookings || [];
      case 'recent_rides':
        return data.recentRides || [];
      case 'recent_payments':
        return data.recentPayments || [];
      default:
        return [];
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'text-success';
      case 'pending':
      case 'processing':
        return 'text-warning';
      case 'cancelled':
      case 'failed':
        return 'text-error';
      default:
        return 'text-text-secondary';
    }
  };

  const renderTableRow = (item, index) => {
    switch (widget.widget_key) {
      case 'recent_bookings':
        return (
          <tr key={index} className="border-b border-border hover:bg-background-tertiary">
            <td className="px-4 py-3 text-sm text-text-primary">
              #{item.id?.slice(0, 8)}
            </td>
            <td className="px-4 py-3 text-sm text-text-primary">
              {item.user?.email || 'N/A'}
            </td>
            <td className="px-4 py-3 text-sm text-text-primary">
              {item.destination || 'N/A'}
            </td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-text-muted">
              {formatDate(item.created_at)}
            </td>
          </tr>
        );
      
      case 'recent_rides':
        return (
          <tr key={index} className="border-b border-border hover:bg-background-tertiary">
            <td className="px-4 py-3 text-sm text-text-primary">
              #{item.id?.slice(0, 8)}
            </td>
            <td className="px-4 py-3 text-sm text-text-primary">
              {item.pickup_location || 'N/A'}
            </td>
            <td className="px-4 py-3 text-sm text-text-primary">
              {item.dropoff_location || 'N/A'}
            </td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-text-muted">
              {formatDate(item.created_at)}
            </td>
          </tr>
        );
      
      case 'recent_payments':
        return (
          <tr key={index} className="border-b border-border hover:bg-background-tertiary">
            <td className="px-4 py-3 text-sm text-text-primary">
              #{item.id?.slice(0, 8)}
            </td>
            <td className="px-4 py-3 text-sm text-text-primary">
              ${item.amount}
            </td>
            <td className="px-4 py-3 text-sm text-text-primary">
              {item.payment_method || 'N/A'}
            </td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-text-muted">
              {formatDate(item.created_at)}
            </td>
          </tr>
        );
      
      default:
        return null;
    }
  };

  const getTableHeaders = () => {
    switch (widget.widget_key) {
      case 'recent_bookings':
        return ['ID', 'User', 'Destination', 'Status', 'Date'];
      case 'recent_rides':
        return ['ID', 'Pickup', 'Dropoff', 'Status', 'Date'];
      case 'recent_payments':
        return ['ID', 'Amount', 'Method', 'Status', 'Date'];
      default:
        return [];
    }
  };

  const tableData = getTableData();
  const headers = getTableHeaders();

  return (
    <div className="bg-background-secondary rounded-lg p-4 sm:p-6 border border-border h-full">
      <div className="mb-4">
        <h3 className="text-text-primary text-lg font-semibold mb-1 truncate">
          {widget.title}
        </h3>
        {widget.description && (
          <p className="text-text-muted text-sm overflow-hidden text-ellipsis">
            {widget.description}
          </p>
        )}
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full min-w-full">
          <thead>
            <tr className="border-b border-border">
              {headers.map((header, index) => (
                <th 
                  key={index}
                  className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.length > 0 ? (
              tableData.map((item, index) => renderTableRow(item, index))
            ) : (
              <tr>
                <td 
                  colSpan={headers.length} 
                  className="px-4 py-8 text-center text-text-muted"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableWidget; 