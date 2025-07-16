import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const ConversionRate = ({ filters }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log("Filters received:", filters);

  useEffect(() => {
    const fetchConversionData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build API parameters from filters
        const params = {};
    
        if (filters.dateRange !== 'all' && filters.startDate && filters.endDate) {
          params.start_date = filters.startDate.toISOString().split('T')[0];
          params.end_date = filters.endDate.toISOString().split('T')[0];
        }
    
        if (filters.bdInCharge && filters.bdInCharge !== 'all') {
          params.bd_in_charge = filters.bdInCharge;
        }
        console.log("Params:", params);
    
        const response = await api.analytics.getLeadConversionRate(params);
        console.log("Conversion Rate Data:", response);
        if (response.length > 0) {
          setData(response);
        } else {
          setData([]); 
        }
      } catch (error) {
        console.error('Error fetching conversion data:', error);
        setError('Failed to load conversion data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversionData();
  }, [filters]);

  if (loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="text-gray-400">Loading conversion data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="text-gray-400">No conversion data available</div>
      </div>
    );
  }

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="month" 
            stroke="#9CA3AF"
            fontSize={10}
            tickFormatter={(value) => {
              const [year, month] = value.split('-');
              return `${new Date(year, month - 1).toLocaleDateString('default', { month: 'short', year: 'numeric' })}`;
            }}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={10}
            tickFormatter={(value) => `${value.toFixed(1)}%`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F9FAFB'
            }}
            formatter={(value) => [`${value.toFixed(1)}%`, 'Conversion Rate']}
            labelFormatter={(label) => {
              const [year, month] = label.split('-');
              return `${new Date(year, month - 1).toLocaleString('default', { month: 'short' })} ${year}`;
            }}
            labelStyle={{ color: '#9CA3AF' }}
          />
          <Line 
            type="monotone" 
            dataKey="conversion_rate" 
            stroke="#10B981" 
            strokeWidth={2}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: '#10B981', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConversionRate;