import React from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  UserPlusIcon 
} from '@heroicons/react/24/outline';

const Lead = ({ lead, onEdit, onDelete, onView, onConvert }) => {
  const {
    full_name = 'No Name',
    status = 'Unknown',
    type = 'Unknown',
    company_name = 'Unknown',
    lead_id
  } = lead || {};

  const getStatusBadge = (status) => {
    const statusColors = {
      '1. lead generated': 'bg-gray-100 text-gray-800',
      '2. proposal': 'bg-blue-100 text-blue-800',
      '3. negotiation': 'bg-yellow-100 text-yellow-800',
      '4. registration': 'bg-purple-100 text-purple-800',
      '4. integration': 'bg-indigo-100 text-indigo-800',
      '5. closed won': 'bg-green-100 text-green-800',
      '6. lost': 'bg-red-100 text-red-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    
    const colorClass = statusColors[status] || statusColors.default;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {status}
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
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {full_name}
            </h3>
            {getStatusBadge(status)}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <span className="font-medium">Company:</span>
              <span>{company_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Type:</span>
              {getTypeBadge(type)}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onView(lead)}
            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
            title="View Lead"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onEdit(lead)}
            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
            title="Edit Lead"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          {onConvert && (
            <button
              onClick={() => onConvert(lead)}
              className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50"
              title="Convert to Customer"
            >
              <UserPlusIcon className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => onDelete(lead_id)}
            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
            title="Delete Lead"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lead;