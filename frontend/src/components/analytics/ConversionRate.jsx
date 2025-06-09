import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const ConversionRate = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <LineChart width={800} height={300} data={[]}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="rate" stroke="#82ca9d" />
      </LineChart>
    </div>
  );
};

export default ConversionRate;