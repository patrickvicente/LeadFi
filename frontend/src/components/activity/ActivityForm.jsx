import React, { useState, useEffect } from 'react';
import { activityOptions } from '../../config/options';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import FormSelect from '../common/FormSelect';

const ActivityForm = ({ 
  leadId = null, 
  customerUid = null, 
  onActivityCreated, 
  onCancel,
  isModal = false,
  activityType = 'activity' // 'activity' or 'task'
}) => {
  const [formData, setFormData] = useState({
    activity_type: '',
    description: '',
    due_date: '',
    priority: 'medium',
    assigned_to: '',
    created_by: '' // Current user - you might get this from auth context
  });

  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const { showToast } = useToast();

  // Load leads and customers for dropdowns if not provided
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!leadId) {
          const leadsResponse = await api.lead.getLeads();
          setLeads(leadsResponse.leads || []);
        }
        if (!customerUid) {
          const customersResponse = await api.customer.getCustomers();
          setCustomers(customersResponse.customers || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [leadId, customerUid]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.activity_type) {
      showToast('Please select an activity type', 'error');
      return false;
    }
    if (!formData.description.trim()) {
      showToast('Please enter a description', 'error');
      return false;
    }
    if (activityType === 'task' && !formData.due_date) {
      showToast('Please select a due date for the task', 'error');
      return false;
    }
    if (!leadId && !customerUid && !formData.lead_id && !formData.customer_uid) {
      showToast('Please select a lead or customer', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        lead_id: leadId || formData.lead_id || null,
        customer_uid: customerUid || formData.customer_uid || null
      };

      let result;
      if (activityType === 'task') {
        result = await api.activity.createTask(submitData);
        showToast('Task created successfully!', 'success');
      } else {
        result = await api.activity.createActivity(submitData);
        showToast('Activity created successfully!', 'success');
      }

      // Reset form
      setFormData({
        activity_type: '',
        description: '',
        due_date: '',
        priority: 'medium',
        assigned_to: '',
        created_by: ''
      });

      if (onActivityCreated) {
        onActivityCreated(result);
      }
    } catch (error) {
      console.error('Error creating activity:', error);
      showToast('Failed to create activity. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get activity options based on type
  const getActivityOptions = () => {
    if (activityType === 'task') {
      return activityOptions.taskActivityTypes;
    }
    return activityOptions.allActivityTypes.filter(opt => opt.category === 'manual');
  };

  return (
    <div className={`${isModal ? 'p-6' : 'bg-background border border-gray-700 p-6 rounded-lg'}`}>
      <h2 className="text-lg font-semibold text-text mb-4">
        {activityType === 'task' ? 'Create New Task' : 'Log New Activity'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Entity Selection (if not provided as props) */}
        {!leadId && !customerUid && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Lead
              </label>
              <select
                value={formData.lead_id || ''}
                onChange={(e) => handleSelectChange('lead_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 bg-background text-text rounded-md focus:outline-none focus:ring-2 focus:ring-highlight1"
              >
                <option value="">Select a lead...</option>
                {leads.map(lead => (
                  <option key={lead.lead_id} value={lead.lead_id}>
                    {lead.full_name} - {lead.company_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Customer
              </label>
              <select
                value={formData.customer_uid || ''}
                onChange={(e) => handleSelectChange('customer_uid', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 bg-background text-text rounded-md focus:outline-none focus:ring-2 focus:ring-highlight1"
              >
                <option value="">Select a customer...</option>
                {customers.map(customer => (
                  <option key={customer.customer_uid} value={customer.customer_uid}>
                    {customer.customer_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Activity Type */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Activity Type *
          </label>
          <select
            value={formData.activity_type}
            onChange={(e) => handleSelectChange('activity_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 bg-background text-text rounded-md focus:outline-none focus:ring-2 focus:ring-highlight1"
            required
          >
            <option value="">Select activity type...</option>
            {getActivityOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-600 bg-background text-text rounded-md focus:outline-none focus:ring-2 focus:ring-highlight1"
            placeholder="Enter activity description..."
            required
          />
        </div>

        {/* Task-specific fields */}
        {activityType === 'task' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Due Date *
                </label>
                <input
                  type="datetime-local"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-600 bg-background text-text rounded-md focus:outline-none focus:ring-2 focus:ring-highlight1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleSelectChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 bg-background text-text rounded-md focus:outline-none focus:ring-2 focus:ring-highlight1"
                >
                  {activityOptions.priorities.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Assign To
              </label>
              <input
                type="text"
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-600 bg-background text-text rounded-md focus:outline-none focus:ring-2 focus:ring-highlight1"
                placeholder="Assign to (leave empty for default BD)"
              />
            </div>
          </>
        )}

        {/* Created By */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Created By
          </label>
          <input
            type="text"
            name="created_by"
            value={formData.created_by}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-600 bg-background text-text rounded-md focus:outline-none focus:ring-2 focus:ring-highlight1"
            placeholder="Your name"
          />
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-highlight1 hover:bg-highlight1/80 text-white py-2 px-4 rounded-md font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : (activityType === 'task' ? 'Create Task' : 'Log Activity')}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-600 rounded-md text-gray-400 hover:bg-gray-800 hover:text-text transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ActivityForm;
