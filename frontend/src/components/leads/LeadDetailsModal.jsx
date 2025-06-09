import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const LeadDetailsModal = ({ lead, onClose, onConvert }) => {
  if (!lead) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Lead Details</h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Lead Information */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {lead.full_name}</p>
                <p><span className="font-medium">Email:</span> {lead.email}</p>
                <p><span className="font-medium">Phone:</span> {lead.phone}</p>
                <p><span className="font-medium">Company:</span> {lead.company_name}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Lead Details</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Stage:</span> {lead.stage}</p>
                <p><span className="font-medium">Type:</span> {lead.type}</p>
                <p><span className="font-medium">Source:</span> {lead.source}</p>
                <p><span className="font-medium">Created:</span> {new Date(lead.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Latest Activities */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Latest Activities</h3>
            <div className="space-y-4">
              {/* Add your activities list here */}
              <p className="text-gray-500">No recent activities</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
                <button
                    onClick={onConvert}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                    Convert to Customer
                </button>
                <button
                    onClick={onClose}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                Close
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailsModal;