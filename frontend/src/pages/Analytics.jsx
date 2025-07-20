import React, { useState } from 'react';
import TradingSummary from '../components/analytics/TradingSummary';
import TradingVolumeChart from '../components/analytics/TradingVolumeChart';
import ConversionRate from '../components/analytics/ConversionRate';
import ActivityMetrics from '../components/analytics/ActivityMetrics';
import LeadFunnel from '../components/analytics/LeadFunnel';
import TopCustomersCard from '../components/analytics/TopCustomersCard';
import { commonOptions, optionHelpers, tradingOptions } from '../config/options';
import { getDateRange } from '../utils/dateRangeHelper';
import Filter from '../components/common/Filter';
import { customerApi } from '../services/api';


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
    tradeType: 'all',
    tradeSide: 'all'
  });

  // Customer options state
  const [customerOptions, setCustomerOptions] = useState([{ value: 'all', label: 'All Customers' }]);

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
      tradeType: 'all',
      tradeSide: 'all'
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

    // Fetch customers for dropdown
    const fetchCustomers = async () => {
      try {
        const response = await customerApi.getCustomers({ per_page: 100 });
        const customers = response.customer || [];
        const options = [
          { value: 'all', label: 'All Customers' },
          ...customers.map(customer => ({
            value: customer.customer_uid,
            label: `${customer.name} (${customer.customer_uid})`
          }))
        ];
        setCustomerOptions(options);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  // Filter config for reusable Filter component
  const filterConfig = [
    { key: 'dateRange', type: 'select', label: '📅 Time Period', options: optionHelpers.addAllOption(commonOptions.dateRange) },
    { key: 'customerUid', type: 'searchable-select', label: '👥 Customer', options: customerOptions },
    { key: 'tradeSide', type: 'select', label: 'Trade Side', options: optionHelpers.addAllOption(tradingOptions.tradeSide) },
    { key: 'tradeType', type: 'select', label: 'Trade Type', options: optionHelpers.addAllOption(tradingOptions.tradeType) }
  ];

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
        <Filter filters={filters} setFilters={setFilters} config={filterConfig} onChange={handleFilterChange} />
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
          {/* Top Customers Card */}
          <TopCustomersCard filters={filters} />
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