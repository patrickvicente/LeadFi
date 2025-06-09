import React from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const ActivityMetrics = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">Activity Distribution</h3>
          <PieChart width={400} height={300}>
            <Pie
              data={[]}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
            />
            <Tooltip />
          </PieChart>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Activity Summary</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="text-sm text-gray-600">Total Activities</h4>
              <p className="text-2xl font-bold">567</p>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="text-sm text-gray-600">Average Response Time</h4>
              <p className="text-2xl font-bold">2.5h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityMetrics;