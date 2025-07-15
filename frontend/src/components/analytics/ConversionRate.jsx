import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const ConversionRate = ({ filters }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConversionData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // TODO: Replace with actual conversion rate API when available
        // For now, use placeholder data that matches the theme
        const placeholderData = [
          { date: '2024-01-01', rate: 15.2 },
          { date: '2024-01-02', rate: 18.5 },
          { date: '2024-01-03', rate: 12.8 },
          { date: '2024-01-04', rate: 22.1 },
          { date: '2024-01-05', rate: 19.7 },
          { date: '2024-01-06', rate: 25.3 },
          { date: '2024-01-07', rate: 23.5 }
        ];
        
        setData(placeholderData);
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
            dataKey="date" 
            stroke="#9CA3AF"
            fontSize={10}
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={10}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F9FAFB'
            }}
            formatter={(value) => [`${value}%`, 'Conversion Rate']}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
            labelStyle={{ color: '#9CA3AF' }}
          />
          <Line 
            type="monotone" 
            dataKey="rate" 
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