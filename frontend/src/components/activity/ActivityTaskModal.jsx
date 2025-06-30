import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { validateForm } from '../../utils/formValidation';
import IconButton from '../common/IconButton';
import Toast from '../common/Toast';
import { activityApi, leadApi } from '../../services/api';
import { activityOptions } from '../../config/options';

const ActivityTaskModal = ({ 
  isOpen, 
  onClose, 
  mode = 'activity', // 'activity' or 'task'
  prefilledData = {},
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    activity_type: '',
    description: '',
    activity_category: 'manual',
    lead_id: '',
    // Task-specific fields
    due_date: '',
    priority: 'medium',
    assigned_to: '',
    customer_uid: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  const isTaskMode = mode === 'task';
  const isEditMode = !!prefilledData.activity_id;
  const title = isEditMode 
    ? `Edit ${isTaskMode ? 'Task' : 'Activity'}`
    : (isTaskMode ? 'Create Task' : 'Log Activity');
  const needsLeadSelection = !prefilledData.lead_id && !prefilledData.customer_uid; // Show lead selection when neither is pre-filled

  // Validation rules based on mode
  const validationRules = {
    required: isTaskMode 
      ? ['activity_type', 'description', 'due_date', 'priority']
      : ['activity_type', 'description']
  };

  // Add lead_id requirement only if neither lead_id nor customer_uid are pre-filled
  if (needsLeadSelection) {
    validationRules.required.push('lead_id');
  }

  // Load leads for selection if not pre-filled
  useEffect(() => {
    if (isOpen && needsLeadSelection) {
      loadLeads();
    }
  }, [isOpen, needsLeadSelection]);

  const loadLeads = async () => {
    setLoadingLeads(true);
    try {
      const response = await leadApi.getLeads({ per_page: 100 }); // Get more leads for selection
      setLeads(response.leads || []);
    } catch (error) {
      console.error('Error loading leads:', error);
      setToast({
        type: 'error',
        message: 'Failed to load leads. Please try again.'
      });
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFormData({
        activity_type: prefilledData.activity_type || '',
        description: prefilledData.description || '',
        activity_category: prefilledData.activity_category || 'manual',
        lead_id: prefilledData.lead_id || '',
        customer_uid: prefilledData.customer_uid || '',
        due_date: prefilledData.due_date || '',
        priority: prefilledData.priority || 'medium',
        assigned_to: prefilledData.assigned_to || ''
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { isValid, errors } = validateForm(formData, validationRules);
    if (!isValid) {
      setErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare payload - always lead-centric now
      const payload = {
        activity_type: formData.activity_type,
        description: formData.description,
        activity_category: formData.activity_category
      };

      // Add lead_id if available
      if (formData.lead_id) {
        payload.lead_id = parseInt(formData.lead_id);
      }

      // Add customer_uid if available (for customer-centric activities)
      if (formData.customer_uid) {
        payload.customer_uid = formData.customer_uid;
      }

      // Add task-specific fields if in task mode
      if (isTaskMode) {
        payload.due_date = formData.due_date;
        payload.priority = formData.priority;
        if (formData.assigned_to) {
          payload.assigned_to = formData.assigned_to;
        }
      }
      // For activities (non-task mode), don't include due_date so they're completed immediately

      // Use update or create API based on mode
      if (isEditMode) {
        await activityApi.updateActivity(prefilledData.activity_id, payload);
      } else {
        await activityApi.createActivity(payload);
      }
      
      setToast({
        type: 'success',
        message: `${isTaskMode ? 'Task' : 'Activity'} ${isEditMode ? 'updated' : (isTaskMode ? 'created' : 'logged')} successfully!`
      });
      
      // Reset form and close after short delay
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
      
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : (isTaskMode ? 'creating task' : 'logging activity')}:`, error);
      setToast({
        type: 'error',
        message: error.response?.data?.message || `Failed to ${isEditMode ? 'update' : (isTaskMode ? 'create task' : 'log activity')}. Please try again.`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderError = (fieldName) => {
    if (errors[fieldName]) {
      return (
        <p className="mt-1 text-sm text-highlight2">
          {errors[fieldName]}
        </p>
      );
    }
    return null;
  };

  // Prepare lead options for dropdown - wrapped in useMemo to prevent infinite re-renders
  const leadOptions = useMemo(() => {
    return leads.map(lead => ({
      value: lead.lead_id,
      label: `${lead.full_name} - ${lead.company_name} (${lead.status})`
    }));
  }, [leads]);

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background border border-gray-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-text">{title}</h2>
            <IconButton
              icon={XMarkIcon}
              onClick={onClose}
              variant="default"
              title="Close"
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              
              {/* Lead Selection (only show if not pre-filled) */}
              {needsLeadSelection && (
                <div>
                  <label className="block text-sm font-medium text-text">
                    Lead *
                  </label>
                  <select
                    name="lead_id"
                    value={formData.lead_id}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                      errors.lead_id ? 'border-highlight2' : ''
                    }`}
                    required
                    disabled={loadingLeads}
                  >
                    <option value="">
                      {loadingLeads ? 'Loading leads...' : 'Select a lead...'}
                    </option>
                    {leadOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {renderError('lead_id')}
                  {loadingLeads && (
                    <p className="mt-1 text-sm text-gray-400">Loading available leads...</p>
                  )}
                </div>
              )}

              {/* Activity Type */}
              <div>
                <label className="block text-sm font-medium text-text">
                  {isTaskMode ? 'Task Type' : 'Activity Type'} *
                </label>
                <select
                  name="activity_type"
                  value={formData.activity_type}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                    errors.activity_type ? 'border-highlight2' : ''
                  }`}
                  required
                >
                  <option value="">Select type...</option>
                  {activityOptions.manualActivityTypes.map(type => (
                    <option key={type} value={type}>
                      {type.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </option>
                  ))}
                </select>
                {renderError('activity_type')}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder={isTaskMode ? 'Describe the task...' : 'Describe the activity...'}
                  className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                    errors.description ? 'border-highlight2' : ''
                  }`}
                  required
                />
                {renderError('description')}
              </div>

              {/* Task-specific fields (only show in task mode) */}
              {isTaskMode && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Due Date */}
                    <div>
                      <label className="block text-sm font-medium text-text">
                        Due Date *
                      </label>
                      <input
                        type="datetime-local"
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                          errors.due_date ? 'border-highlight2' : ''
                        }`}
                        required
                      />
                      {renderError('due_date')}
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-text">
                        Priority *
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                          errors.priority ? 'border-highlight2' : ''
                        }`}
                        required
                      >
                        {priorityOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {renderError('priority')}
                    </div>
                  </div>

                  {/* Assigned To */}
                  <div>
                    <label className="block text-sm font-medium text-text">
                      Assigned To
                    </label>
                    <input
                      type="text"
                      name="assigned_to"
                      value={formData.assigned_to}
                      onChange={handleChange}
                      placeholder="Leave blank to auto-assign to lead's BD"
                      className="mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-600 rounded-lg text-text hover:bg-gray-800 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (needsLeadSelection && loadingLeads)}
                className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                  isTaskMode 
                    ? 'bg-highlight3 hover:bg-highlight3/80' 
                    : 'bg-highlight1 hover:bg-highlight1/80'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting 
                  ? (isEditMode 
                      ? `Updating ${isTaskMode ? 'Task' : 'Activity'}...`
                      : (isTaskMode ? 'Creating Task...' : 'Logging Activity...'))
                  : (isEditMode 
                      ? `Update ${isTaskMode ? 'Task' : 'Activity'}`
                      : (isTaskMode ? 'Create Task' : 'Log Activity'))
                }
              </button>
            </div>
          </form>

          {/* Toast notification */}
          {toast && (
            <Toast
              type={toast.type}
              message={toast.message}
              isVisible={true}
              onClose={() => setToast(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityTaskModal; 