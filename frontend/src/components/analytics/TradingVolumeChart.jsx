import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
        const response = await api.trading.getTradingVolumeTimeSeries(params);
        console.log("Trading Volume", response);
        
        if (response && response.length > 0) {
          
          const chartData = response.map(item => ({
            date: item.date,
            volume: item.total_volume,
            maker_volume: item.maker_volume,
            taker_volume: item.taker_volume
          }));
          console.log("Chart Data", chartData);

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
              backgroundColor: '#23272F',
              border: '1px solid #6366F1',
              borderRadius: '10px',
              color: '#F9FAFB',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
            formatter={(value, name) => {
              let label = '';
              if (name === 'volume') label = 'Total Volume';
              else if (name === 'maker_volume') label = 'Maker Volume';
              else if (name === 'taker_volume') label = 'Taker Volume';
              else label = name;
              return [`$${(value / 1000000).toFixed(2)}M`, label];
            }}
            labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
            labelStyle={{ color: '#818CF8', fontWeight: 600 }}
          />
          <Line 
            type="monotone" 
            dataKey="volume" 
            name="Total Volume"
            stroke="#6366F1" // Indigo-500
            strokeWidth={3}
            dot={{ fill: '#6366F1', strokeWidth: 2, r: 2 }}
            activeDot={{ r: 4, stroke: '#6366F1', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="maker_volume" 
            name="Maker Volume"
            stroke="#10B981" // Emerald-500
            strokeWidth={2}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 2 }}
            activeDot={{ r: 4, stroke: '#10B981', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="taker_volume" 
            name="Taker Volume"
            stroke="#F59E42" // Amber-400
            strokeWidth={2}
            dot={{ fill: '#F59E42', strokeWidth: 2, r: 2 }}
            activeDot={{ r: 4, stroke: '#F59E42', strokeWidth: 2 }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ color: '#fff' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TradingVolumeChart;


