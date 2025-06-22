import React from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon
} from '@heroicons/react/24/outline';

const Customer = ({ customer, onViewCustomer, onEditCustomer, onDeleteCustomer }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (isClosed) => {
    return isClosed ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Closed
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  const getTypeBadge = (type) => {
    if (!type) return 'N/A';
    
    const typeColors = {
      'enterprise': 'bg-purple-100 text-purple-800',
      'startup': 'bg-blue-100 text-blue-800',
      'individual': 'bg-gray-100 text-gray-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    
    const colorClass = typeColors[type.toLowerCase()] || typeColors.default;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {customer.name}
            </h3>
            {getStatusBadge(customer.is_closed)}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <span className="font-medium">ID:</span>
              <span>{customer.customer_uid}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Type:</span>
              {getTypeBadge(customer.type)}
            </div>
            {customer.country && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Country:</span>
                <span>{customer.country}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onViewCustomer(customer)}
            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
            title="View Customer"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onEditCustomer(customer)}
            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
            title="Edit Customer"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDeleteCustomer(customer.customer_uid)}
            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
            title="Delete Customer"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="border-t border-gray-100 pt-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Created:</span>
            <span className="ml-2 text-gray-600">
              {formatDate(customer.date_created)}
            </span>
          </div>
          {customer.date_closed && (
            <div>
              <span className="font-medium text-gray-700">Closed:</span>
              <span className="ml-2 text-gray-600">
                {formatDate(customer.date_closed)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Customer;