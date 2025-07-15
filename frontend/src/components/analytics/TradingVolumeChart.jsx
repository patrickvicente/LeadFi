import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const TradingVolumeChart = ({ filters }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build API parameters from filters
        const params = {};
        
        if (filters.dateRange !== 'all' && filters.startDate && filters.endDate) {
          params.start_date = filters.startDate.toISOString().split('T')[0];
          params.end_date = filters.endDate.toISOString().split('T')[0];
        }
        
        if (filters.customerUid !== 'all') {
          params.customer_uid = filters.customerUid;
        }
        
        // Get daily volumes for the chart
        const response = await api.trading.getTradingVolume(params);
        
        if (response.trading_volume && response.trading_volume.length > 0) {
          // Group by date and sum volumes
          const dailyData = response.trading_volume.reduce((acc, trade) => {
            const date = trade.date;
            if (!acc[date]) {
              acc[date] = { date, volume: 0 };
            }
            acc[date].volume += parseFloat(trade.volume || 0);
            return acc;
          }, {});
          
          // Convert to array and sort by date
          const chartData = Object.values(dailyData)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          
          setData(chartData);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setError('Failed to load chart data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [filters]);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-gray-400">Loading chart data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-gray-400">No data available for the selected filters</div>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            fontSize={12}
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F9FAFB'
            }}
            formatter={(value) => [`$${(value / 1000000).toFixed(2)}M`, 'Volume']}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
            labelStyle={{ color: '#9CA3AF' }}
          />
          <Line 
            type="monotone" 
            dataKey="volume" 
            stroke="#3B82F6" 
            strokeWidth={2}
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TradingVolumeChart;


