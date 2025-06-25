import React from 'react';
import { formatDate } from '../../utils/dateFormat';

const CustomerList = ({ customers = [], onViewCustomer }) => {
    //  check for customer array
    if (!Array.isArray(customers)) {
        console.error('Customers prop must be an array');
        return null;
    }

  const getStatusBadge = (isClosed) => {
    return isClosed ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-highlight2 text-white">
        Closed
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-highlight5 text-white">
        Active
      </span>
    );
  };
    
  const getTypeBadge = (type) => {
    if (!type) return <span className="text-gray-400">N/A</span>;
    
    const typeColors = {
      'enterprise': 'bg-highlight1 text-white',
      'startup': 'bg-highlight3 text-white',
      'individual': 'bg-gray-700 text-gray-300',
      'default': 'bg-gray-700 text-gray-300'
    };
    
    const colorClass = typeColors[type.toLowerCase()] || typeColors.default;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {type}
      </span>
    );
  };

  if (customers.length === 0) {
    return (
      <div className="bg-background border border-gray-700 rounded-lg p-8 text-center">
        <p className="text-gray-400">No customers found.</p>
      </div>
    );
  }

  return (
    <div className="bg-background border border-gray-700 rounded-lg overflow-hidden" style={{ height: '600px', width: '100%' }}>
      <div className="h-full overflow-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[150px]">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">
                Customer ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">
                Country
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[140px]">
                BD in Charge
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">
                Closed
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {customers.map((customer, index) => (
              <tr
                key={customer.customer_id || customer.customer_uid}
                onClick={() => onViewCustomer(customer)}
                className={`cursor-pointer transition-colors hover:bg-gray-800 ${
                  index % 2 === 0 ? 'bg-background' : 'bg-gray-900'
                }`}
              >
                <td className="px-4 py-4 whitespace-nowrap min-w-[150px]">
                  <div className="text-sm font-medium text-text">
                    {customer.name || customer.full_name || 'No Name'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {customer.title || ''}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[120px]">
                  <div className="truncate" title={customer.customer_uid || customer.customer_id || 'No ID'}>
                    {customer.customer_uid || customer.customer_id || 'No ID'}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[120px]">
                  <div className="truncate" title={customer.country || 'Unknown'}>
                    {customer.country || 'Unknown'}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap min-w-[100px]">
                  {getTypeBadge(customer.type)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap min-w-[100px]">
                  {getStatusBadge(customer.is_closed)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[140px]">
                  <div className="truncate" title={customer.bd_in_charge || 'Unassigned'}>
                    {customer.bd_in_charge || 'Unassigned'}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400 min-w-[100px]">
                  <div className="truncate" title={customer.date_created ? formatDate(customer.date_created) : 'Unknown'}>
                    {customer.date_created ? formatDate(customer.date_created) : 'Unknown'}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400 min-w-[100px]">
                  <div className="truncate" title={customer.date_closed ? formatDate(customer.date_closed) : 'N/A'}>
                    {customer.date_closed ? formatDate(customer.date_closed) : 'N/A'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerList;