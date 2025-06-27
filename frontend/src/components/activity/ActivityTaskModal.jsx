import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { optionHelpers } from '../../config/options';
import { validateForm } from '../../utils/formValidation';
import IconButton from '../common/IconButton';
import Toast from '../common/Toast';
import { activityApi } from '../../services/api';

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
    customer_uid: '',
    // Task-specific fields
    due_date: '',
    priority: 'medium',
    assigned_to: '',
    ...prefilledData
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const isTaskMode = mode === 'task';
  const title = isTaskMode ? 'Create Task' : 'Log Activity';

  // Validation rules based on mode
  const validationRules = {
    required: isTaskMode 
      ? ['activity_type', 'description', 'due_date', 'priority']
      : ['activity_type', 'description']
  };

  useEffect(() => {
    if (isOpen) {
      setFormData({
        activity_type: '',
        description: '',
        activity_category: 'manual',
        lead_id: '',
        customer_uid: '',
        due_date: '',
        priority: 'medium',
        assigned_to: '',
        ...prefilledData
      });
      setErrors({});
    }
  }, [isOpen, prefilledData]);

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
      // Prepare payload based on mode
      const payload = {
        activity_type: formData.activity_type,
        description: formData.description,
        activity_category: formData.activity_category,
        ...(formData.lead_id && { lead_id: parseInt(formData.lead_id) }),
        ...(formData.customer_uid && { customer_uid: formData.customer_uid })
      };

      // Add task-specific fields if in task mode
      if (isTaskMode) {
        payload.due_date = formData.due_date;
        payload.priority = formData.priority;
        if (formData.assigned_to) {
          payload.assigned_to = formData.assigned_to;
        }
      }
      // For activities (non-task mode), don't include due_date so they're completed immediately

      await activityApi.createActivity(payload);
      
      setToast({
        type: 'success',
        message: `${isTaskMode ? 'Task' : 'Activity'} ${isTaskMode ? 'created' : 'logged'} successfully!`
      });
      
      // Reset form and close after short delay
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
      
    } catch (error) {
      console.error(`Error ${isTaskMode ? 'creating task' : 'logging activity'}:`, error);
      setToast({
        type: 'error',
        message: error.response?.data?.message || `Failed to ${isTaskMode ? 'create task' : 'log activity'}. Please try again.`
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
                  <option value="">Select Type</option>
                  {optionHelpers.getOptions('activity_type', 'activity').map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
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

              {/* Task-specific fields */}
              {isTaskMode && (
                <>
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
                      className="mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1"
                      required
                    >
                      {optionHelpers.getOptions('priority', 'activity').map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {renderError('priority')}
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
                      placeholder="Enter assignee name (optional)"
                      className="mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-text bg-gray-600 rounded-md hover:bg-gray-500 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-highlight1 text-white rounded-md hover:bg-highlight1/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (isTaskMode ? 'Create Task' : 'Log Activity')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ActivityTaskModal; 