import React, {useState, useEffect} from 'react';
import api from '../services/api';
import { formatVolume, formatFee } from '../utils/numberFormat';

const TradingVolume = () => {
    const [displayLoading, setDisplayLoading] = useState(false);
    const [tradingVolume, setTradingVolume] = useState([]);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
      currentPage: 1,
      perPage: 100,
      totalPages: 1,
      totalItems: 0
    });

    // Fetch trading volume 
    const fetchTradingVolume = async (page = pagination.currentPage) => {
      setDisplayLoading(true);
      setError(null);
      try {
        const params = {
          page,
          per_page: pagination.perPage,
          // sort_by: sortField,
          // sort_order: sortDirection
          // NEED to add filters
        };

        const response = await api.trading.getTradingVolume(params);
        setTradingVolume(response.trading_volume || []);
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          total_pages: response.pages,
          totalItem:response.total
        }));
        console.log("Received Trading Volume",response);
      } catch (error) {
        console.error('Error loading Trading Volume:', error);
        setError('Failed to load Trading Volume');
      } finally {
        setDisplayLoading(false);
      }
    };

    //  Initial Fetch
    useEffect(() => {
        setDisplayLoading(true);
        fetchTradingVolume();
    }, []);

  return (
    <div className="p-6">
      {/* Main Header - consistent with Leads/Customers */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Trading Volume</h1>
          <p className="text-gray-400 mt-1">
            See the trading volume of your customers
          </p>
        </div>
      </div>
      <div className="bg-background border border-gray-700 rounded-lg overflow-hidden" style={{ height: '600px', width: '100%' }}>
        <div className="h-full overflow-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800 sticky top-0 z-10">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700 min-w-[150px]"
                >
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">
                    Customer UID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">
                  Customer Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">
                  Trade Type
                </th>   
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">
                    Trade Side
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">
                  Volume
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">
                  Fees
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">
                  BD in Charge
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {displayLoading ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-highlight1"></div>
                      <span className="ml-3">Loading trading volume...</span>
                    </div>
                  </td>
                </tr>
              ) : tradingVolume.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                    No trading volume data found
                  </td>
                </tr>
              ) : (
                tradingVolume.map((trade, index) => (
                  <tr
                    key={index}
                    className={`transition-colors hover:bg-gray-800 ${
                      index % 2 === 0 ? 'bg-background' : 'bg-gray-900'
                    }`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[150px]">
                      {trade.date}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[120px]">
                      {trade.customer_uid}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[120px]">
                      {trade.customer_name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[120px]">
                      {trade.trade_type}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[120px]">
                      {trade.trade_side}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-text min-w-[120px]">
                      {formatVolume(trade.volume)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-text min-w-[120px]">
                      {formatFee(trade.fees)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[120px]">
                      {trade.bd_in_charge}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TradingVolume;