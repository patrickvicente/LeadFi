import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const TopCustomersCard = ({ filters }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopCustomers = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (filters.startDate && filters.endDate) {
          params.start_date = filters.startDate.toISOString().split('T')[0];
          params.end_date = filters.endDate.toISOString().split('T')[0];
        }
        if (filters.tradeType && filters.tradeType !== 'all') {
          params.trade_type = filters.tradeType;
        }
        if (filters.bdInCharge && filters.bdInCharge !== 'all') {
          params.bd_in_charge = filters.bdInCharge;
        }
        if (filters.customerUid && filters.customerUid !== 'all') {
          params.customer_uid = filters.customerUid;
        }
        const data = await api.trading.getTopCustomers(params);
        console.log("Top Customers", data);
        setCustomers(data);
      } catch (e) {
        setError('Failed to load top customers');
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTopCustomers();
  }, [filters]);

  return (
    <div className="bg-background border border-gray-700 rounded-lg p-6 h-full flex flex-col justify-between">
      <h3 className="text-lg font-medium text-white mb-4">🏆 Top Customers by Volume</h3>
      {loading ? (
        <div className="w-full h-48 flex items-center justify-center text-gray-400">Loading top customers...</div>
      ) : error ? (
        <div className="w-full h-48 flex items-center justify-center text-red-400">{error}</div>
      ) : !customers.length ? (
        <div className="w-full h-48 flex items-center justify-center text-gray-400">No customer data.</div>
      ) : (
        <div className="space-y-3">
          {customers.slice(0, 5).map((customer, idx) => (
            <div key={customer.customer_uid} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </span>
                <span className="text-white font-medium">{customer.customer_name}</span>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold">${(customer.total_volume/1e6).toFixed(2)}M</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopCustomersCard; 