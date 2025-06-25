import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Filter from '../components/common/Filter';
import LeadList from '../components/leads/LeadList';
import LeadForm from '../components/leads/LeadForm';
import LeadDetailsModal from '../components/leads/LeadDetailsModal';
import { leadApi } from '../services/api';
import { useServerSorting } from '../utils/useServerSorting';

const Leads = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [selectedLeadDetails, setSelectedLeadDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leadDetailsLoading, setLeadDetailsLoading] = useState(false);
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

  // Initialize server-side sorting
  const sortHandlers = useServerSorting((sortField, sortDirection) => {
    // Reset to first page when sorting changes
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    // Trigger data fetch with new sort parameters
    fetchLeads(1, pagination.perPage, sortField, sortDirection);
  });

  // Check for lead_id in URL parameters and fetch that lead
  useEffect(() => {
    const leadId = searchParams.get('lead_id');
    if (leadId) {
      fetchLeadDetails(leadId);
    }
  }, [searchParams]);

  // Fetch specific lead details by ID
  const fetchLeadDetails = async (leadId) => {
    try {
      setLeadDetailsLoading(true);
      const response = await leadApi.getLead(leadId);
      if (response && response.lead) {
        setSelectedLeadDetails(response.lead);
        // Remove the lead_id parameter from URL after opening the modal
        // This prevents the modal from reopening if the user navigates back
      } else {
        console.error('Lead not found:', leadId);
        // Remove invalid lead_id from URL
        searchParams.delete('lead_id');
        setSearchParams(searchParams);
      }
    } catch (err) {
      console.error('Error fetching lead details:', err);
      // Remove invalid lead_id from URL
      searchParams.delete('lead_id');
      setSearchParams(searchParams);
    } finally {
      setLeadDetailsLoading(false);
    }
  };

  // Fetch leads with pagination, filters, and sorting
  const fetchLeads = async (page = pagination.currentPage, perPage = pagination.perPage, sortBy = sortHandlers.sortField, sortOrder = sortHandlers.sortDirection) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare query parameters
      const params = {
        page: page,
        per_page: perPage
      };

      // Add filters if they're not 'all'
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.source !== 'all') params.source = filters.source;
      
      // Add sorting parameters if present
      if (sortBy) {
        params.sort_by = sortBy;
        params.sort_order = sortOrder;
      }
      
      console.log('Fetching leads with params:', params);
      
      const response = await leadApi.getLeads(params);
      console.log('Received leads data:', response);
      
      // Update leads and pagination state
      if (response && response.leads) {
        setLeads(response.leads);
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          perPage: perPage,
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

  // Fetch when pagination or filters change (but not sorting, as that's handled by the sort callback)
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
    // Add lead_id to URL for direct linking
    setSearchParams({ lead_id: lead.lead_id });
  };

  const handleCloseLeadDetails = () => {
    setSelectedLeadDetails(null);
    // Remove lead_id from URL when closing
    searchParams.delete('lead_id');
    setSearchParams(searchParams);
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

  const handleUpdateLead = async (formData) => {
    try {
      await leadApi.updateLead(selectedLeadDetails.lead_id, formData);
      fetchLeads(); // Refresh leads after submission
    } catch (err) {
      console.error('Error updating lead:', err);
      throw err; // Re-throw the error to be handled by the form
    }
  };

  if (error) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <div className="bg-red-900/20 border border-highlight2 text-highlight2 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text">Leads</h1>
        <button 
          onClick={handleAddLead}
          className="bg-highlight1 text-white px-4 py-2 rounded hover:bg-highlight1/80 transition-colors"
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight1"></div>
        </div>
      ) : (
        <>
          <LeadList 
            leads={leads}
            onViewLead={handleViewLead}
            sortHandlers={sortHandlers}
          />
          
          {/* Pagination UI */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {leads.length} of {pagination.totalItems} leads
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={pagination.perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className="border border-gray-600 bg-background text-text rounded px-2 py-1"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
              <div className="flex space-x-1">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 border border-gray-600 bg-background text-text rounded disabled:opacity-50 hover:bg-gray-700"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-text">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1 border border-gray-600 bg-background text-text rounded disabled:opacity-50 hover:bg-gray-700"
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

      {(selectedLeadDetails || leadDetailsLoading) && (
        <LeadDetailsModal
          lead={selectedLeadDetails}
          loading={leadDetailsLoading}
          onClose={handleCloseLeadDetails}
          onEdit={handleEditLead}
          onDelete={handleDeleteLead}
          onSubmit={handleUpdateLead}
          onConvert={handleConvertToCustomer}
        />
      )}
    </div>
  );
};

export default Leads;