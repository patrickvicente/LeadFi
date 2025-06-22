import React, { useState, useEffect } from 'react';
import Filter from '../components/common/Filter';
import LeadList from '../components/leads/LeadList';
import LeadForm from '../components/leads/LeadForm';
import LeadDetailsModal from '../components/leads/LeadDetailsModal';
import { leadApi } from '../services/api';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [selectedLeadDetails, setSelectedLeadDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    source: 'all',
    type: 'all'
  });
  // Add pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    totalPages: 1,
    totalItems: 0
  });

  // Fetch leads with pagination and filters
  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare query parameters
      const params = {
        page: pagination.currentPage,
        per_page: pagination.perPage
      };

      // Add filters if they're not 'all'
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.source !== 'all') params.source = filters.source;
      
      console.log('Fetching leads with params:', params);
      
      const response = await leadApi.getLeads(params);
      console.log('Received leads data:', response);
      
      // Update leads and pagination state
      if (response && response.leads) {
        setLeads(response.leads);
        setPagination(prev => ({
          ...prev,
          totalPages: response.pages,
          totalItems: response.total
        }));
      } else {
        setLeads([]);
        console.error('Invalid response format:', response);
      }
    } catch (err) {
      setError('Failed to fetch leads');
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLeads();
  }, []);

  // Fetch when pagination or filters change
  useEffect(() => {
    fetchLeads();
  }, [pagination.currentPage, pagination.perPage, filters.status, filters.source]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  // Handle per page change
  const handlePerPageChange = (newPerPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: 1, // Reset to first page
      perPage: newPerPage
    }));
  };

  // Filter configuration
  const filterConfig = {
    showSearch: true,
    fields: [
      { name: 'status', type: 'lead' },
      { name: 'source', type: 'lead' },
      { name: 'type', type: 'lead' }
    ]
  };

  const handleViewLead = (lead) => {
    setSelectedLeadDetails(lead);
  };

  const handleConvertToCustomer = (lead) => {
    // Handle conversion to customer
    // You might want to open a customer form here
    console.log('Converting lead to customer:', lead);
  };

  // Handle lead actions
  const handleAddLead = () => {
    setSelectedLead(null);
    setIsFormOpen(true);
  };

  const handleEditLead = (lead) => {
    setSelectedLead(lead);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedLead(null);
  };

  const handleDeleteLead = async (leadId) => {
    try {
      await leadApi.deleteLead(leadId);
      fetchLeads(); // Refresh leads after deletion
    } catch (err) {
      setError('Failed to delete lead');
      console.error('Error deleting lead:', err);
    }
  };

  const handleSubmitLead = async (formData) => {
    try {
      if (selectedLead) {
        await leadApi.updateLead(selectedLead.lead_id, formData);
      } else {
        await leadApi.createLead(formData);
      }
      handleCloseForm();
      fetchLeads(); // Refresh leads after submission
    } catch (err) {
      console.error('Error saving lead:', err);
      throw err; // Re-throw the error to be handled by the form
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leads</h1>
        <button 
          onClick={handleAddLead}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Lead
        </button>
      </div>

      <Filter 
        filters={filters}
        setFilters={setFilters}
        searchPlaceholder="Search leads..."
        filterConfig={filterConfig}
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <LeadList 
            leads={leads}
            onEditLead={handleEditLead}
            onDeleteLead={handleDeleteLead}
            onViewLead={handleViewLead}
          />
          
          {/* Pagination UI */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {leads.length} of {pagination.totalItems} leads
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={pagination.perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className="border rounded px-2 py-1"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
              <div className="flex space-x-1">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {isFormOpen && (
        <LeadForm 
          lead={selectedLead}
          onClose={handleCloseForm}
          onSubmit={handleSubmitLead}
        />
      )}

      {selectedLeadDetails && (
        <LeadDetailsModal
          lead={selectedLeadDetails}
          onClose={() => setSelectedLeadDetails(null)}
          onConvert={() => handleConvertToCustomer(selectedLeadDetails)}
        />
      )}
    </div>
  );
};

export default Leads;