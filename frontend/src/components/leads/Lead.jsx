import React from 'react';

const Lead = ({ lead, onEdit, onDelete }) => {

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
      
  return (
    <div className="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{lead.full_name}</h3>
          <span className="px-2 py-1 bg-gray-100 rounded text-sm">
          {lead.company_name}
        </span>
          <p className="text-gray-600">{lead.email}</p>
          <p className="text-gray-600">{lead.phone}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(lead)}
            className="text-blue-500 hover:text-blue-700"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(lead.lead_id)}
            className="text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="px-2 py-1 bg-gray-100 rounded text-sm">
          {lead.status}
        </span>
        <span className="px-2 py-1 bg-gray-100 rounded text-sm">
          {lead.source}
        </span>
        <span className="px-2 py-1 bg-gray-100 rounded text-sm">
          {lead.type}
        </span>
      </div>
    </div>
  );
};

export default Lead;