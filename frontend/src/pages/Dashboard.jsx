import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const Dashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-gray-500">Total Leads</h2>
          <p className="text-2xl font-bold">150</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-gray-500">Active Customers</h2>
          <p className="text-2xl font-bold">45</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-gray-500">Total Trading Volume</h2>
          <p className="text-2xl font-bold">$1.2M</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-gray-500">Pending Activities</h2>
          <p className="text-2xl font-bold">12</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;