// frontend/src/services/api.js
import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://127.0.0.1:5000/api', // Update with your actual API URL
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication if needed
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error cases
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized
          break;
        case 403:
          // Handle forbidden
          break;
        case 404:
          // Handle not found
          break;
        default:
          // Handle other errors
          break;
      }
    }
    return Promise.reject(error);
  }
);

// Lead API calls
export const leadApi = {
  // Get all leads with optional filters
  getLeads: async (params = {}) => {
    try {
      const response = await api.get('/leads', { params });
      return response.data;
    } catch (error) {
      console.error('Error in getLeads:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch leads');
    }
  },

  // Get a single lead by ID
  getLead: async (leadId) => {
    try {
      const response = await api.get(`/leads/${leadId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch lead');
    }
  },

  // Create a new lead
  createLead: async (leadData) => {
    try {
      const response = await api.post('/leads', leadData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create lead');
    }
  },

  // Update an existing lead
  updateLead: async (leadId, leadData) => {
    try {
      const response = await api.put(`/leads/${leadId}`, leadData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update lead');
    }
  },

  // Delete a lead
  deleteLead: async (leadId) => {
    try {
      await api.delete(`/leads/${leadId}`);
      return true;
    } catch (error) {
      throw new Error('Failed to delete lead');
    }
  },

  // Convert a lead to a customer
  convertLead: async (leadId, customerData) => {
    try {
      const response = await api.post(`/leads/${leadId}/convert`, customerData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to convert lead');
    }
  }
};

// Customer API calls
export const customerApi = {
  getCustomers: async (filters = {}) => {
    try {
      const response = await api.get('/customers', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch customers');
    }
  },

  getCustomer: async (customerId) => {
    try {
      const response = await api.get(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch customer');
    }
  },

  createCustomer: async (customerData) => {
    try {
      const response = await api.post('/customers', customerData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create customer');
    }
  },

  updateCustomer: async (customerId, customerData) => {
    try {
      const response = await api.put(`/customers/${customerId}`, customerData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update customer');
    }
  },

  deleteCustomer: async (customerId) => {
    try {
      await api.delete(`/customers/${customerId}`);
      return true;
    } catch (error) {
      throw new Error('Failed to delete customer');
    }
  }
};

// Activity API calls
export const activityApi = {
  getActivities: async (filters = {}) => {
    try {
      const response = await api.get('/activities', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch activities');
    }
  },

  createActivity: async (activityData) => {
    try {
      const response = await api.post('/activities', activityData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create activity');
    }
  }
};

// Trading Volume API calls
export const tradingApi = {
  getTradingVolume: async (filters = {}) => {
    try {
      const response = await api.get('/trading-volume', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch trading volume');
    }
  }
};

// Export all APIs
export default {
  lead: leadApi,
  customer: customerApi,
  activity: activityApi,
  trading: tradingApi
};