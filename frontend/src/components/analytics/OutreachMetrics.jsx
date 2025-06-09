import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const OutreachMetrics = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-blue-50 rounded">
          <h3 className="text-sm text-blue-600">Total Outreach</h3>
          <p className="text-2xl font-bold">1,234</p>
        </div>
        <div className="p-4 bg-green-50 rounded">
          <h3 className="text-sm text-green-600">Response Rate</h3>
          <p className="text-2xl font-bold">45%</p>
        </div>
        <div className="p-4 bg-purple-50 rounded">
          <h3 className="text-sm text-purple-600">Conversion Rate</h3>
          <p className="text-2xl font-bold">12%</p>
        </div>
      </div>
      <BarChart width={800} height={300} data={[]}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#8884d8" />
      </BarChart>
    </div>
  );
};

export default OutreachMetrics;