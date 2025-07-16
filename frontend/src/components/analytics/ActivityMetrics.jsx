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
        // Build API parameters from filters
        const params = {};
    
        if (filters.dateRange !== 'all' && filters.startDate && filters.endDate) {
          params.start_date = filters.startDate.toISOString().split('T')[0];
          params.end_date = filters.endDate.toISOString().split('T')[0];
        }

        if (filters.bdInCharge && filters.bdInCharge !== 'all') {
          params.bd_in_charge = filters.bdInCharge;
        }

        const response = await api.analytics.getActivityAnalytics(params);
        const responseAvgActivity = await api.analytics.getAvgDailyActivity(params);
        console.log("Activity Metrics Data:", response);
        console.log("Avg Daily Activity Data:", responseAvgActivity);

        // Find the latest period
        const periods = response.map(r => r.period);
        const latestPeriod = periods.sort().reverse()[0];

        // Filter for the latest period
        const latestData = response.filter(r => r.period === latestPeriod);

        // Aggregate activity_by_type and activity_by_status
        const activityByType = {};
        const activityByStatus = {};
        let totalActivities = 0;
        let avgDailyActivity = 0;
        if (responseAvgActivity.length > 0) {
          avgDailyActivity = responseAvgActivity.reduce((sum, item) => sum + item.avg_daily_activity, 0) / responseAvgActivity.length;
        }

        latestData.forEach(item => {
          totalActivities += item.total_activities;
          Object.entries(item.activity_by_type).forEach(([type, count]) => {
            activityByType[type] = (activityByType[type] || 0) + count;
          });
          Object.entries(item.activity_by_status).forEach(([status, count]) => {
            activityByStatus[status] = (activityByStatus[status] || 0) + count;
          });
        });

        const chartData = Object.entries(activityByType).map(([name, value], idx) => ({
          name,
          value,
          color: COLORS[idx % COLORS.length]
        }));

        const completedTasks = activityByStatus.completed || 0;
        const pendingTasks = activityByStatus.pending || 0;

        setData(chartData);
        setSummary({
          totalActivities,
          completedTasks,
          pendingTasks,
          avgDailyActivity
        });
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
          <h4 className="text-xs text-gray-400 mb-1">Avg Daily Activity</h4>
          <p className="text-lg font-bold text-white">{summary.avgDailyActivity || 'N/A'}</p>
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
      {data && data.length > 0 && (
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
      {data && data.length > 0 && (
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