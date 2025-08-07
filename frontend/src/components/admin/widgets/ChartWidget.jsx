import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const ChartWidget = ({ widget, data, language = 'en' }) => {
  const config = widget.config || {};
  
  const formatChartData = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) return [];
    
    return rawData.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));
  };

  const getChartData = () => {
    if (!data || !data.analytics) return [];
    
    switch (widget.widget_key) {
      case 'revenue_chart':
        return formatChartData(data.analytics.revenueData || []);
      case 'user_growth':
        return formatChartData(data.analytics.userGrowth || []);
      case 'ride_statistics':
        return formatChartData(data.analytics.rideStats || []);
      default:
        return [];
    }
  };

  const renderChart = () => {
    const chartData = getChartData();
    
    if (config.type === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3E3F47" />
            <XAxis 
              dataKey="date" 
              stroke="#B0B3BD"
              fontSize={12}
            />
            <YAxis 
              stroke="#B0B3BD"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#2A2B32',
                border: '1px solid #3E3F47',
                borderRadius: '8px',
                color: '#FFFFFF'
              }}
            />
            <Line 
              type="monotone" 
              dataKey={config.dataKey || 'value'} 
              stroke="#FD7A00" 
              strokeWidth={2}
              dot={{ fill: '#FD7A00', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    
    if (config.type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3E3F47" />
            <XAxis 
              dataKey="date" 
              stroke="#B0B3BD"
              fontSize={12}
            />
            <YAxis 
              stroke="#B0B3BD"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#2A2B32',
                border: '1px solid #3E3F47',
                borderRadius: '8px',
                color: '#FFFFFF'
              }}
            />
            <Bar 
              dataKey={config.dataKey || 'value'} 
              fill="#FD7A00"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    
    if (config.type === 'area') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3E3F47" />
            <XAxis 
              dataKey="date" 
              stroke="#B0B3BD"
              fontSize={12}
            />
            <YAxis 
              stroke="#B0B3BD"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#2A2B32',
                border: '1px solid #3E3F47',
                borderRadius: '8px',
                color: '#FFFFFF'
              }}
            />
            <Area 
              type="monotone" 
              dataKey={config.dataKey || 'value'} 
              stroke="#FD7A00" 
              fill="#FD7A00"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    
    return null;
  };

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
      <div className="h-64 sm:h-80 flex-1">
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartWidget; 