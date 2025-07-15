import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const OutreachMetrics = ({ filters }) => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOutreachData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // TODO: Replace with actual outreach metrics API when available
        // For now, use placeholder data that matches the theme
        const placeholderData = [
          { name: 'Calls', sent: 45, responded: 18, converted: 8 },
          { name: 'Emails', sent: 120, responded: 54, converted: 12 },
          { name: 'LinkedIn', sent: 85, responded: 23, converted: 6 },
          { name: 'Events', sent: 15, responded: 12, converted: 4 },
          { name: 'Referrals', sent: 8, responded: 6, converted: 3 }
        ];
        
        const placeholderSummary = {
          totalOutreach: 273,
          responseRate: 41.4,
          conversionRate: 12.1
        };
        
        setData(placeholderData);
        setSummary(placeholderSummary);
      } catch (error) {
        console.error('Error fetching outreach data:', error);
        setError('Failed to load outreach data');
        setData([]);
        setSummary({});
      } finally {
        setLoading(false);
      }
    };

    fetchOutreachData();
  }, [filters]);

  if (loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="text-gray-400">Loading outreach data...</div>
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
      {/* Outreach Summary Cards */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        <div className="bg-gray-800 p-3 rounded-lg">
          <h4 className="text-xs text-gray-400 mb-1">Total Outreach</h4>
          <p className="text-lg font-bold text-white">{summary.totalOutreach || 0}</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <h4 className="text-xs text-gray-400 mb-1">Response Rate</h4>
          <p className="text-lg font-bold text-blue-400">{summary.responseRate || 0}%</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <h4 className="text-xs text-gray-400 mb-1">Conversion Rate</h4>
          <p className="text-lg font-bold text-green-400">{summary.conversionRate || 0}%</p>
        </div>
      </div>

      {/* Outreach Performance Chart */}
      {data.length > 0 && (
        <div className="w-full h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF"
                fontSize={10}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={10}
              />
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
              <Bar dataKey="sent" fill="#3B82F6" name="Sent" />
              <Bar dataKey="responded" fill="#10B981" name="Responded" />
              <Bar dataKey="converted" fill="#F59E0B" name="Converted" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Channel Performance Summary */}
      {data.length > 0 && (
        <div className="mt-3 space-y-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="text-gray-300">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">{item.sent}</span>
                <span className="text-gray-500">→</span>
                <span className="text-green-400">{item.responded}</span>
                <span className="text-gray-500">→</span>
                <span className="text-yellow-400">{item.converted}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OutreachMetrics;