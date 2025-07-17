// frontend/src/services/api.js
import axios from 'axios';
import errorService from './errorService';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://127.0.0.1:5000/api', // Update with your actual API URL
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication and retry handling
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

// Add response interceptor for comprehensive error handling
api.interceptors.response.use(
  (response) => {
    // Clear retry counts on successful responses
    if (response.config._errorContext) {
      errorService.clearRetryCount(response.config._errorContext);
    }
    return response;
  },
  async (error) => {
    const context = error.config._errorContext || {};
    
    try {
      const errorInfo = await errorService.handleAPIError(error, context);
      
      // Handle automatic retries
      if (errorInfo.shouldRetry) {
        console.log(`Retrying request to ${error.config.url} (attempt ${errorInfo.retryCount})`);
        
        // Wait for retry delay
        await new Promise(resolve => setTimeout(resolve, errorInfo.retryDelay));
        
        // Update context with retry information
        error.config._errorContext = {
          ...context,
          retryCount: errorInfo.retryCount
        };
        
        // Retry the request
        return api.request(error.config);
      }
      
      // Attach processed error info to the error object
      error.processedError = errorInfo;
      
    } catch (processingError) {
      console.error('Error processing API error:', processingError);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Enhanced API call wrapper with error context
 */
const makeAPICall = async (requestFunction, context = {}) => {
  try {
    const result = await requestFunction();
    return result;
  } catch (error) {
    // Attach context to error for processing
    if (error.config) {
      error.config._errorContext = context;
    }
    
    // Use processed error if available
    if (error.processedError) {
      const userMessage = errorService.getUserFriendlyMessage(error.processedError, context);
      throw new Error(userMessage);
    }
    
    // Fallback error handling
    throw new Error(error.response?.data?.message || error.message || 'An unexpected error occurred');
  }
};

// Lead API calls
export const leadApi = {
  // Get all leads with optional filters
  getLeads: async (params = {}) => {
    return await makeAPICall(
      () => api.get('/leads', { params }),
      { operation: 'fetch_leads', params }
    ).then(response => response.data);
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
      const response = await api.post(`/leads/${leadId}`, customerData);
      return response.data;
    } catch (error) {
      console.error('Error converting lead:', error);
      throw new Error(error.response?.data?.message || 'Failed to convert lead');
    }
  }, 

  // Get lead conversion rate
  getLeadConversionRate: async (filters = {}) => {
    try {
      const response = await api.get('/leads/conversion-rate', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch lead conversion rate');
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
  // Get all activities with filtering and pagination
  getActivities: async (filters = {}) => {
    try {
      const response = await api.get('/activities', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch activities');
    }
  },

  // Get a single activity
  getActivity: async (activityId) => {
    try {
      const response = await api.get(`/activities/${activityId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch activity');
    }
  },

  // Create a new manual activity
  createActivity: async (activityData) => {
    try {
      const response = await api.post('/activities', activityData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create activity');
    }
  },

  // Update an existing activity
  updateActivity: async (activityId, activityData) => {
    try {
      const response = await api.put(`/activities/${activityId}`, activityData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update activity');
    }
  },

  // Delete an activity
  deleteActivity: async (activityId) => {
    try {
      const response = await api.delete(`/activities/${activityId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete activity');
    }
  },

  // Get activity timeline for lead/customer
  getTimeline: async (filters = {}) => {
    try {
      const response = await api.get('/activities/timeline', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch activity timeline');
    }
  },

  // Get activity statistics
  getStats: async () => {
    try {
      const response = await api.get('/activities/stats');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch activity statistics');
    }
  },

  // Get activities for a specific lead
  getLeadActivities: async (leadId, filters = {}) => {
    try {
      const response = await api.get('/activities', { 
        params: { ...filters, lead_id: leadId } 
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch lead activities');
    }
  },

  // Get activities for a specific customer (via lead relationship)
  getCustomerActivities: async (customerUid, filters = {}) => {
    try {
      const response = await api.get('/activities', { 
        params: { ...filters, customer_uid: customerUid } 
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch customer activities');
    }
  },

  // ==================== TASK MANAGEMENT ====================

  // Create a new task
  createTask: async (taskData) => {
    try {
      const response = await api.post('/tasks', taskData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create task');
    }
  },

  // Update a task
  updateTask: async (taskId, taskData) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update task');
    }
  },

  // Complete a task
  completeTask: async (taskId, completionNotes = null) => {
    try {
      const response = await api.post(`/tasks/${taskId}/complete`, {
        completion_notes: completionNotes
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to complete task');
    }
  },

  // Cancel a task
  cancelTask: async (taskId, reason = null) => {
    try {
      const response = await api.post(`/tasks/${taskId}/cancel`, {
        reason: reason
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to cancel task');
    }
  },

  // Get pending tasks
  getTasks: async (filters = {}) => {
    try {
      const response = await api.get('/activities', { 
        params: { ...filters, tasks_only: 'true' } 
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch tasks');
    }
  },

  // Get overdue tasks
  getOverdueTasks: async (filters = {}) => {
    try {
      const response = await api.get('/activities', { 
        params: { ...filters, overdue_only: 'true' } 
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch overdue tasks');
    }
  },

  // Get tasks by status
  getTasksByStatus: async (status, filters = {}) => {
    try {
      const response = await api.get('/activities', { 
        params: { ...filters, status: status } 
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch ${status} tasks`);
    }
  },

  // Get tasks assigned to specific person
  getAssignedTasks: async (assignedTo, filters = {}) => {
    try {
      const response = await api.get('/activities', { 
        params: { ...filters, assigned_to: assignedTo, tasks_only: 'true' } 
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch assigned tasks');
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
  },
  getTradingSummary: async (filters = {}) => {
    try {
      const response = await api.get('/trading-summary', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch trading summary');
    }
  },
  getTradingVolumeTimeSeries: async (filters = {}) => {
    try {
      const response = await api.get('/trading-volume-time-series', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch trading volume time series');
    }
  },
  getTopCustomers: async (filters = {}) => {
    try {
      const response = await api.get('/analytics/trading-volume-top-customers', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch top customers');
    }
  }
};

export const analyticsApi = {
  getLeadConversionRate: async (filters = {}) => {
    try {
      const response = await api.get('/analytics/monthly-lead-conversion-rate', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch lead conversion rate');
    }
  },
  getActivityAnalytics: async (filters = {}) => {
    try {
      const response = await api.get('/analytics/activity-analytics', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch monthly activity analytics');
    }
  },
  getAvgDailyActivity: async (filters = {}) => {
    try {
      const response = await api.get('/analytics/avg-daily-activity', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch average daily activity');
    }
  },
  getLeadFunnel: async (filters = {}) => {
    try {
      const response = await api.get('/analytics/lead-funnel', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch lead funnel');
    }
  }
}

// Export all APIs
export default {
  lead: leadApi,
  customer: customerApi,
  activity: activityApi,
  trading: tradingApi,
  analytics: analyticsApi,
  
  // Direct trading methods for convenience
  getTradingVolume: tradingApi.getTradingVolume,
  getTradingSummary: tradingApi.getTradingSummary
};