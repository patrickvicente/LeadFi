import React, { useState } from 'react';
import TradingSummary from '../components/analytics/TradingSummary';
import TradingVolumeChart from '../components/analytics/TradingVolumeChart';
import ConversionRate from '../components/analytics/ConversionRate';
import ActivityMetrics from '../components/analytics/ActivityMetrics';
import LeadFunnel from '../components/analytics/LeadFunnel';
import { commonOptions } from '../config/options';
import { getDateRange } from '../utils/dateRangeHelper';

const Analytics = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Filter state management
  const [filters, setFilters] = useState({
    dateRange: 'thisMonth',
    startDate: startOfMonth,
    endDate: endOfMonth,
    customerUid: 'all',
    bdInCharge: 'all',
    tradeType: 'all'
  });

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    if (key === 'dateRange') {
      const { startDate, endDate } = getDateRange(value);
      setFilters(prev => ({
        ...prev,
        dateRange: value,
        startDate,
        endDate
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  // Reset all filters
  const resetFilters = () => {
    const { startDate, endDate } = getDateRange('last_30_days');
    setFilters({
      dateRange: 'last30Days',
      startDate,
      endDate,
      customerUid: 'all',
      bdInCharge: 'all',
      tradeType: 'all'
    });
  };

  // Initialize date range on component mount
  React.useEffect(() => {
    const { startDate, endDate } = getDateRange('last_30_days');
    setFilters(prev => ({
      ...prev,
      startDate,
      endDate
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
        <p className="text-gray-400">Comprehensive insights into trading performance, lead conversion, and business metrics</p>
      </div>

      {/* Filter Controls Section */}
      <div className="bg-background border border-gray-700 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">📊 Filter & Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">📅 Time Period</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              {commonOptions.dateRange.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">👥 Customer</label>
            <select
              value={filters.customerUid}
              onChange={(e) => handleFilterChange('customerUid', e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Customers</option>
            </select>
          </div>

          {/* BD Person Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">💼 BD Person</label>
            <select
              value={filters.bdInCharge}
              onChange={(e) => handleFilterChange('bdInCharge', e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All BD Staff</option>
            </select>
          </div>

          {/* Trade Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">📈 Trade Type</label>
            <select
              value={filters.tradeType}
              onChange={(e) => handleFilterChange('tradeType', e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="spot">Spot</option>
              <option value="futures">Futures</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            🔄 Reset Filters
          </button>
          <button
            onClick={() => {/* TODO: Implement export */}}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            📥 Export Data
          </button>
        </div>
      </div>

      {/* Key Metrics Overview Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">📈 Key Performance Metrics</h2>
        <TradingSummary filters={filters} />
      </div>

      {/* Trading Performance Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">💰 Trading Performance Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trading Volume Chart takes up 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-background border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">📊 Volume Trend Analysis</h3>
              <TradingVolumeChart filters={filters} />
            </div>
          </div>
          
          {/* Trading Summary Cards */}
          <div className="space-y-4">
            <div className="bg-background border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">🎯 Quick Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Daily Volume:</span>
                  <span className="text-white font-medium">$8.65M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Top Trading Day:</span>
                  <span className="text-white font-medium">$15.2M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Volume Growth:</span>
                  <span className="text-green-400 font-medium">+12.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fee Efficiency:</span>
                  <span className="text-white font-medium">0.21%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Conversion & Activity Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">🎯 Lead Conversion & Activity Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversion Rate */}
          <div className="bg-background border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">📈 Conversion Rates</h3>
            <ConversionRate filters={filters} />
          </div>

          {/* Lead Funnel (replaces Outreach Performance) */}
          <div className="bg-background border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">🔻 Sales Pipeline</h3>
            <LeadFunnel filters={filters} />
          </div>

          {/* Activity Metrics */}
          <div className="bg-background border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">📋 Activity Summary</h3>
            <ActivityMetrics filters={filters} />
          </div>

        </div>
      </div>

      {/* Top Performers Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">👥 Top Performers & Insights</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers */}
          <div className="bg-background border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">🏆 Top Customers by Volume</h3>
            <div className="space-y-3">
              {[
                { name: 'Customer Alpha', volume: '$450K', percentage: '18.0%', rank: 1 },
                { name: 'Customer Beta', volume: '$320K', percentage: '12.8%', rank: 2 },
                { name: 'Customer Gamma', volume: '$280K', percentage: '11.2%', rank: 3 },
                { name: 'Customer Delta', volume: '$190K', percentage: '7.6%', rank: 4 },
                { name: 'Customer Epsilon', volume: '$150K', percentage: '6.0%', rank: 5 }
              ].map((customer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {customer.rank}
                    </span>
                    <span className="text-white font-medium">{customer.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{customer.volume}</div>
                    <div className="text-gray-400 text-sm">{customer.percentage}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BD Performance */}
          <div className="bg-background border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">💼 BD Performance Ranking</h3>
            <div className="space-y-3">
              {[
                { name: 'John Smith', volume: '$1.2M', customers: 12, rank: 1 },
                { name: 'Jane Doe', volume: '$980K', customers: 9, rank: 2 },
                { name: 'Bob Wilson', volume: '$750K', customers: 8, rank: 3 },
                { name: 'Alice Brown', volume: '$680K', customers: 7, rank: 4 },
                { name: 'Mike Davis', volume: '$420K', customers: 5, rank: 5 }
              ].map((bd, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {bd.rank}
                    </span>
                    <span className="text-white font-medium">{bd.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{bd.volume}</div>
                    <div className="text-gray-400 text-sm">{bd.customers} customers</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary Footer */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-2">📊 Performance Summary</h3>
        <p className="text-gray-300 text-sm mb-4">
          Overall business performance is trending positively with strong trading volume growth and improved lead conversion rates.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">+12.3%</div>
            <div className="text-gray-400 text-sm">Volume Growth</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">23.5%</div>
            <div className="text-gray-400 text-sm">Conversion Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">45</div>
            <div className="text-gray-400 text-sm">Active Customers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">$112K</div>
            <div className="text-gray-400 text-sm">Total Fees</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;