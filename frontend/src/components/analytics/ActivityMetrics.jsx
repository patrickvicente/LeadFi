import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const ActivityMetrics = ({ filters }) => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  useEffect(() => {
    const fetchActivityData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // TODO: Replace with actual activity metrics API when available
        // For now, use placeholder data that matches the theme
        const placeholderData = [
          { name: 'Calls', value: 45, color: '#3B82F6' },
          { name: 'Emails', value: 32, color: '#10B981' },
          { name: 'Meetings', value: 18, color: '#F59E0B' },
          { name: 'Follow-ups', value: 25, color: '#EF4444' },
          { name: 'Other', value: 12, color: '#8B5CF6' }
        ];
        
        const placeholderSummary = {
          totalActivities: 132,
          avgResponseTime: '2.5h',
          completedTasks: 89,
          pendingTasks: 43
        };
        
        setData(placeholderData);
        setSummary(placeholderSummary);
      } catch (error) {
        console.error('Error fetching activity data:', error);
        setError('Failed to load activity data');
        setData([]);
        setSummary({});
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, [filters]);

  if (loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="text-gray-400">Loading activity data...</div>
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

  return (
    <div className="w-full">
      {/* Activity Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800 p-3 rounded-lg">
          <h4 className="text-xs text-gray-400 mb-1">Total Activities</h4>
          <p className="text-lg font-bold text-white">{summary.totalActivities || 0}</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <h4 className="text-xs text-gray-400 mb-1">Avg Response Time</h4>
          <p className="text-lg font-bold text-white">{summary.avgResponseTime || 'N/A'}</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <h4 className="text-xs text-gray-400 mb-1">Completed Tasks</h4>
          <p className="text-lg font-bold text-green-400">{summary.completedTasks || 0}</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <h4 className="text-xs text-gray-400 mb-1">Pending Tasks</h4>
          <p className="text-lg font-bold text-yellow-400">{summary.pendingTasks || 0}</p>
        </div>
      </div>

      {/* Activity Distribution Chart */}
      {data.length > 0 && (
        <div className="w-full h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={50}
                fill="#8884d8"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value, name) => [value, name]}
                labelStyle={{ color: '#9CA3AF' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Activity Legend */}
      {data.length > 0 && (
        <div className="mt-3 space-y-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-gray-300">{item.name}</span>
              </div>
              <span className="text-white font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityMetrics;