import React from 'react';
import TradingVolumeChart from '../components/analytics/TradingVolumeChart';
import OutreachMetrics from '../components/analytics/OutreachMetrics';
import ConversionRate from '../components/analytics/ConversionRate';
import ActivityMetrics from '../components/analytics/ActivityMetrics';

const Analytics = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      
      {/* Trading Volume Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Trading Volume</h2>
        <TradingVolumeChart />
      </div>

      {/* Outreach Metrics Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Outreach Performance</h2>
        <OutreachMetrics />
      </div>

      {/* Conversion Rate Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Conversion Rates</h2>
        <ConversionRate />
      </div>

      {/* Activity Metrics Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Activity Analysis</h2>
        <ActivityMetrics />
      </div>
    </div>
  );
};

export default Analytics;