import React from 'react';
import { formatDateOnly } from '../../utils/dateFormat';

const LeadList = ({ leads = [], onViewLead, sortHandlers }) => {
    // Initialize sorting handlers from props
    const {
      handleSort,
      getSortIcon,
      getSortClasses
    } = sortHandlers;

    //  check for lead array
    if (!Array.isArray(leads)) {
        console.error('Leads prop must be an array');
        return null;
    }

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

  const getConvertedBadge = (isConverted) => {
    if (isConverted === true || isConverted === 'true' || isConverted === 1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-highlight5 text-white">
          Converted
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
        Lead
      </span>
    );
  };

  if (leads.length === 0) {
    return (
      <div className="bg-background border border-gray-700 rounded-lg p-8 text-center">
        <p className="text-gray-400">No leads found.</p>
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
                Company
              </th>
              <th 
                className={`px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[140px] ${getSortClasses('status')}`}
                onClick={() => handleSort('status')}
                title="Click to sort by status"
              >
                <div className="flex items-center justify-between">
                  Status
                  <span className="ml-1 text-gray-400">{getSortIcon('status')}</span>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">
                Source
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[140px]">
                BD in Charge
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">
                Converted
              </th>
              <th 
                className={`px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px] ${getSortClasses('date_created')}`}
                onClick={() => handleSort('date_created')}
                title="Click to sort by creation date"
              >
                <div className="flex items-center justify-between">
                  Created
                  <span className="ml-1 text-gray-400">{getSortIcon('date_created')}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {leads.map((lead, index) => (
              <tr
          key={lead.lead_id}
                onClick={() => onViewLead(lead)}
                className={`cursor-pointer transition-colors hover:bg-gray-800 ${
                  index % 2 === 0 ? 'bg-background' : 'bg-gray-900'
                }`}
              >
                <td className="px-4 py-4 whitespace-nowrap min-w-[150px]">
                  <div className="text-sm font-medium text-text">
                    {lead.full_name || 'No Name'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {lead.title || ''}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[120px]">
                  <div className="truncate" title={lead.company_name || 'Unknown'}>
                    {lead.company_name || 'Unknown'}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap min-w-[140px]">
                  {getStatusBadge(lead.status)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap min-w-[100px]">
                  {getTypeBadge(lead.type)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[120px]">
                  <div className="truncate" title={lead.source || 'Unknown'}>
                    {lead.source || 'Unknown'}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[140px]">
                  <div className="truncate" title={lead.bd_in_charge || 'Unassigned'}>
                    {lead.bd_in_charge || 'Unassigned'}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap min-w-[120px]">
                  {getConvertedBadge(lead.is_converted)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400 min-w-[100px]">
                  <div className="truncate" title={lead.date_created ? formatDateOnly(lead.date_created) : 'Unknown'}>
                    {lead.date_created ? formatDateOnly(lead.date_created) : 'Unknown'}
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

export default LeadList;