import React, { useState, useEffect } from "react";
import Filter from "../components/common/Filter"; 
import CustomerList from "../components/customers/CustomerList";
import CustomerForm from "../components/customers/CustomerForm";
import CustomerDetailsModal from "../components/customers/CustomerDetailsModal";
import { customerApi } from "../services/api";

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
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

    // Fetch customers with pagination and filters
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page: pagination.currentPage,
          per_page: pagination.perPage
        }

        // Add filters
        if (filters.status !== 'all') params.status = filters.status;
        if (filters.source !== 'all') params.source = filters.source;

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

    // Initial fetch
    useEffect(() => {
      fetchCustomers();
    }, []);

    // Fetch when pagination or filters change
    useEffect(() => {
      fetchCustomers();
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
        { name: 'status', type: 'customer' },
        { name: 'source', type: 'customer' },
        { name: 'type', type: 'customer' }
      ]
    };

    const handleViewCustomer = (customer) => {
      setSelectedCustomerDetails(customer);
    };

    const handleCreateCustomer = () => {

    };

    const handleEditCustomer = () => {

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
          <h1 className="text-2xl font-bold">Customers</h1>
          <button 
            onClick={handleCreateCustomer}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Customer
          </button>
        </div>
  
        <Filter 
          filters={filters}
          setFilters={setFilters}
          searchPlaceholder="Search customers..."
          filterConfig={filterConfig}
        />
  
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500">Loading Customers...</div>
          </div>
        ) : (
          <>
            <CustomerList 
              customers={customers}
              onEditCustomer={handleEditCustomer}
              // onDeleteCustomer={}
              onViewCustomer={handleViewCustomer}
            />
            
            {/* Pagination UI */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {customers.length} of {pagination.totalItems} customers
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
      </div>
    );
  };

  export default Customers;