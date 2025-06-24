import React from 'react';

const Lead = ({ lead, onView }) => {
    const {
        full_name = 'No Name',
        status = 'Unknown',
        type = 'Unknown',
        company_name = 'Unknown',
        lead_id
      } = lead || {};

  const getStatusBadge = (status) => {
    const statusColors = {
      '1. lead generated': 'bg-gray-700 text-gray-300',
      '2. proposal': 'bg-highlight1 text-white',
      '3. negotiation': 'bg-highlight4 text-white',
      '4. registration': 'bg-highlight1 text-white',
      '4. integration': 'bg-highlight1 text-white',
      '5. closed won': 'bg-highlight5 text-white',
      '6. lost': 'bg-highlight2 text-white',
      'default': 'bg-gray-700 text-gray-300'
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
      
      return (
    <div className="bg-background border border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer hover:border-gray-600"
      onClick={() => onView(lead)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold text-text">
              {full_name}
            </h3>
            {getStatusBadge(status)}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <span className="font-medium text-text">Company:</span>
              <span>{company_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-text">Type:</span>
              {getTypeBadge(type)}
            </div>
          </div>
        </div>
      </div>
    </div>
      );
    };

export default Lead;