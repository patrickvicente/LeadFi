import React from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  UserPlusIcon 
} from '@heroicons/react/24/outline';

const Lead = ({ lead, onEdit, onDelete, onView }) => {

    const {
        full_name = 'No Name',
        email = 'No Email',
        phone = 'No Phone',
        status = 'Unknown',
        source = 'Unknown',
        type = 'Unknown',
        company_name = 'Unknown',
        lead_id
      } = lead || {};

      const handleView = () => {
        onView(lead);
      };
    
      const handleEdit = (e) => {
        e.stopPropagation();
        onEdit(lead);
      };
    
      const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(lead.lead_id);
      };
    
      const handleConvert = (e) => {
        e.stopPropagation();
        // Handle convert to customer
      };
      
      return (
        <tr 
          className="hover:bg-gray-50 cursor-pointer"
          onClick={handleView}
        >
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-900">{lead.full_name}</div>
            <div className="text-sm text-gray-500">{lead.email}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">{lead.company_name}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
              ${lead.stage === 'qualified' ? 'bg-green-100 text-green-800' : 
                lead.stage === 'contacted' ? 'bg-blue-100 text-blue-800' : 
                'bg-gray-100 text-gray-800'}`}>
              {lead.stage}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {lead.type}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleConvert}
                className="text-green-600 hover:text-green-900"
                title="Convert to Customer"
              >
                <UserPlusIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleEdit}
                className="text-blue-600 hover:text-blue-900"
                title="Edit Lead"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleDelete}
                className="text-red-600 hover:text-red-900"
                title="Delete Lead"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </td>
        </tr>
      );
    };

export default Lead;