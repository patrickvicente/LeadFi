import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Filter from "../components/common/Filter"; 
import CustomerList from "../components/customers/CustomerList";
import CustomerForm from "../components/customers/CustomerForm";
import CustomerDetailsModal from "../components/customers/CustomerDetailsModal";
import Toast from "../components/common/Toast";
import { customerApi } from "../services/api";
import { useServerSorting } from "../utils/useServerSorting";
import { useToast } from "../hooks/useToast";
import { commonOptions, leadOptions, optionHelpers } from '../config/options';

const Customers = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [customerDetailsLoading, setCustomerDetailsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { toast, showToast, hideToast } = useToast();
    const [filters, setFilters] = useState({
        search: "",
        status: "all",
        source: "all",
        type: "all",
    });
    // Add pagination state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        totalPages: 1,
        totalItems: 0,
    });

    // Server-side sorting hook
    const {
        sortField,
        sortDirection,
        handleSort,
        getSortParams
    } = useServerSorting(() => {
        // Reset to page 1 when sorting changes
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        fetchCustomers();
    });

    // Check for customerId in URL parameters and fetch that customer
    useEffect(() => {
        const customerId = searchParams.get('customerId') || searchParams.get('customer_uid'); // Support both parameter names
        if (customerId) {
            fetchCustomerDetails(customerId);
        }
    }, [searchParams]);

    // Fetch customers with pagination and filters
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page: pagination.currentPage,
          per_page: pagination.perPage,
          ...getSortParams()
        }

        // Add filters
        if (filters.status !== 'all') params.status = filters.status;
        if (filters.source !== 'all') params.source = filters.source;
        if (filters.search) params.search = filters.search;
        if (filters.type !== 'all') params.type = filters.type;

        console.log('Fetching customers with params:', params);

        const response = await customerApi.getCustomers(params);
        console.log('Received customers data:', response);

        // update customers and pagination state
        if (response && response.customer) {
          setCustomers(response.customer);
          setPagination(prev=> ({
            ...prev,
            totalPages: response.pages,
            totalItems: response.total
          }));
      } else {
        setCustomers([]);
        console.error('Invalid response format:', response);
      }
    } catch (err) {
      setError('Failed to fetch customers');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
    };

    // Fetch specific customer details by ID
    const fetchCustomerDetails = async (customerId) => {
        try {
            setCustomerDetailsLoading(true);
            const response = await customerApi.getCustomer(customerId);
            if (response && response.customer) {
                setSelectedCustomer(response.customer);
            } else {
                console.error('Customer not found:', customerId);
                // Remove invalid parameters from URL
                searchParams.delete('customerId');
                searchParams.delete('customer_uid');
                setSearchParams(searchParams);
            }
        } catch (err) {
            console.error('Error fetching customer details:', err);
            // Remove invalid parameters from URL
            searchParams.delete('customerId');
            searchParams.delete('customer_uid');
            setSearchParams(searchParams);
        } finally {
            setCustomerDetailsLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
      fetchCustomers();
    }, []);

    // Fetch when pagination or filters change
    useEffect(() => {
      fetchCustomers();
    }, [pagination.currentPage, pagination.perPage, filters.status, filters.source, filters.search, filters.type]);

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

    // Create sort handlers for specific fields
    const sortHandlers = {
      lead_status: {
        sortField,
        sortDirection,
        onSort: handleSort
      },
      date_converted: {
        sortField,
        sortDirection,
        onSort: handleSort
      }
    };

    // Filter config for reusable Filter component
    const filterConfig = [
      { key: 'search', type: 'text', label: '🔍 Search' },
      { key: 'status', type: 'select', label: 'Status', options: optionHelpers.addAllOption(leadOptions.status) },
      { key: 'source', type: 'select', label: 'Source', options: optionHelpers.addAllOption(leadOptions.source) },
      { key: 'type', type: 'select', label: 'Type', options: optionHelpers.addAllOption(leadOptions.type) },
    ];

    const handleViewCustomer = (customer) => {
        const customerId = customer.customer_uid || customer.customer_id;
        // Add customerId to URL for direct linking
        setSearchParams({ customerId: customerId });
    };

    const handleCreateCustomer = () => {
      setIsFormOpen(true);
    };

    const handleCreateLead = () => {
      // Navigate to leads page to create a new lead first
      navigate('/leads?action=create');
    };

    const handleEditCustomer = async (customerData) => {
      try {
        const response = await customerApi.updateCustomer(customerData.customer_uid || customerData.customer_id, customerData);
        
        // Update the customer in the local state
        setCustomers(prev => prev.map(customer => 
          (customer.customer_uid || customer.customer_id) === (customerData.customer_uid || customerData.customer_id) 
            ? { ...customer, ...response } 
            : customer
        ));
        
        // Update the selected customer if it's the one being edited
        if (selectedCustomer && (selectedCustomer.customer_uid || selectedCustomer.customer_id) === (customerData.customer_uid || customerData.customer_id)) {
          setSelectedCustomer({ ...selectedCustomer, ...response });
        }

        showToast('Customer updated successfully!', 'success');
        console.log('Customer updated successfully');
      } catch (err) {
        console.error('Error updating customer:', err);
        throw err; // Re-throw to let the modal handle the error
      }
    };

    const handleDeleteCustomer = async (customerId) => {
      if (window.confirm('Are you sure you want to delete this customer?')) {
        try {
          await customerApi.deleteCustomer(customerId);
          
          // Remove the customer from local state
          setCustomers(prev => prev.filter(customer => 
            (customer.customer_uid || customer.customer_id) !== customerId
          ));
          
          // Close modal if the deleted customer was selected
          if (selectedCustomer && (selectedCustomer.customer_uid || selectedCustomer.customer_id) === customerId) {
            setSelectedCustomer(null);
            searchParams.delete('customerId');
            searchParams.delete('customer_uid');
            setSearchParams(searchParams);
          }

          showToast('Customer deleted successfully!', 'success');
          console.log('Customer deleted successfully');
        } catch (err) {
          console.error('Error deleting customer:', err);
          showToast('Failed to delete customer', 'error');
        }
      }
    };

    const handleFormSubmit = async (customerData) => {
      try {
        // Note: The CustomerForm now handles lead conversion internally
        // It calls leadApi.convertLead() instead of customerApi.createCustomer()
        // This function is kept for editing existing customers
        const response = await customerApi.createCustomer(customerData);
        
        // Add the new customer to the local state
        setCustomers(prev => [response, ...prev]);
        
        setIsFormOpen(false);
        console.log('Customer created successfully');
      } catch (err) {
        console.error('Error creating customer:', err);
        throw err; // Re-throw to let the form handle the error
      }
    };

    const handleCustomerCreated = () => {
      // Callback for when customer is successfully created from lead
      setIsFormOpen(false);
      fetchCustomers(); // Refresh the customer list
    };

    const handleCloseModal = () => {
        setSelectedCustomer(null);
        // Remove customerId parameters from URL when closing
        searchParams.delete('customerId');
        searchParams.delete('customer_uid');
        setSearchParams(searchParams);
    };

    const handleCloseForm = () => {
      setIsFormOpen(false);
    };

    const handleViewLead = (lead) => {
      // Navigate to leads page with leadId as URL parameter
      navigate(`/leads?leadId=${lead.lead_id}`);
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
          <h1 className="text-2xl font-bold text-text">Customers</h1>
          <button 
            onClick={handleCreateCustomer}
            className="bg-highlight1 text-white px-4 py-2 rounded hover:bg-highlight1/80 transition-colors"
          >
            Create Customer
          </button>
        </div>
  
        <Filter 
          filters={filters}
          setFilters={setFilters}
          config={filterConfig}
        />
  
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight1"></div>
            <span className="ml-4 text-text">Loading Customers...</span>
          </div>
        ) : (
          <>
            <CustomerList 
              customers={customers}
              onViewCustomer={handleViewCustomer}
              sortHandlers={sortHandlers}
            />
            
            {/* Pagination UI */}
            <div className="mt-4 flex items-center justify-between bg-background p-4 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400">
                Showing {customers.length} of {pagination.totalItems} customers
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={pagination.perPage}
                  onChange={(e) => handlePerPageChange(Number(e.target.value))}
                  className="border border-gray-600 bg-background text-text rounded px-2 py-1 focus:border-highlight1"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 border border-gray-600 bg-background text-text rounded disabled:opacity-50 hover:bg-gray-800 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-text">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1 border border-gray-600 bg-background text-text rounded disabled:opacity-50 hover:bg-gray-800 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Customer Details Modal */}
        {(selectedCustomer || customerDetailsLoading) && (
          <CustomerDetailsModal
            customer={selectedCustomer}
            loading={customerDetailsLoading}
            onClose={handleCloseModal}
            onSubmit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
            onViewLead={handleViewLead}
          />
        )}

        {/* Customer Form Modal */}
        {isFormOpen && (
          <CustomerForm
            onClose={handleCloseForm}
            onSubmit={handleFormSubmit}
            onCreateLead={handleCreateLead}
          />
        )}

        {/* Toast Notification */}
        <Toast
          message={toast.message}
          isVisible={toast.isVisible}
          onClose={hideToast}
          type={toast.type}
        />
      </div>
    );
  };

  export default Customers;