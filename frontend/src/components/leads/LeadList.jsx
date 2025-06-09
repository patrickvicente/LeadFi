import React from 'react';
import Lead from './Lead';

const LeadList = ({ leads = [], onEditLead, onDeleteLead, onViewLead }) => {
    //  check for lead array
    if (!Array.isArray(leads)) {
        console.error('Leads prop must be an array');
        return null;
    }

  return (
    <div className="space-y-4">
      {leads.map(lead => (
        <Lead
          key={lead.lead_id}
          lead={lead}
          onEdit={onEditLead}
          onDelete={onDeleteLead}
          onView={onViewLead}
        />
      ))}
    </div>
  );
};

export default LeadList;