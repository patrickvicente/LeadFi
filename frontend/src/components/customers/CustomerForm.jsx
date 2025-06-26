import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { optionHelpers } from '../../config/options';
import { validateForm } from '../../utils/formValidation';
import FormSelect from '../common/FormSelect';
import { leadApi } from '../../services/api';

const CustomerForm = ({ onClose, onSubmit, customer = null, onCreateLead = null, leadToConvert = null }) => {
  const isEdit = customer !== null;
  
  const [mode, setMode] = useState('select'); // 'select' or 'new_lead'
  const [availableLeads, setAvailableLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [loadingLeads, setLoadingLeads] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_uid: customer?.customer_uid || '',
    registered_email: customer?.registered_email || '',
    type: customer?.type || '',
    is_closed: customer?.is_closed || false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationRules = {
    required: ['customer_uid', 'type'],
    email: ['registered_email']
  };

  // Fetch unconverted leads on component mount (only if not converting a specific lead)
  useEffect(() => {
    if (!isEdit && !leadToConvert) {
      fetchUnconvertedLeads();
    }
  }, [isEdit, leadToConvert]);

  // Update form data when lead is selected or leadToConvert is provided
  useEffect(() => {
    const leadData = selectedLead || leadToConvert;
    if (leadData) {
      setFormData(prev => ({
        ...prev,
        // Pre-fill from lead data
        registered_email: leadData.email || '',
        type: leadData.type || ''
      }));
    }
  }, [selectedLead, leadToConvert]);

  const fetchUnconvertedLeads = async () => {
    setLoadingLeads(true);
    try {
      // Get leads that haven't been converted to customers
      const response = await leadApi.getLeads({
        is_converted: false,
        per_page: 100 // Get a reasonable number
      });
      setAvailableLeads(response.leads || []);
    } catch (err) {
      console.error('Error fetching unconverted leads:', err);
      setErrors({
        fetch: 'Failed to fetch available leads. Please try again.'
      });
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    const fieldValue = inputType === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleLeadSelect = (e) => {
    const leadId = parseInt(e.target.value);
    const lead = availableLeads.find(l => l.lead_id === leadId);
    setSelectedLead(lead);
    
    // Clear lead selection error
    if (errors.lead_selection) {
      setErrors(prev => ({
        ...prev,
        lead_selection: null
      }));
    }
  };

  const handleCreateNewLead = () => {
    if (onCreateLead) {
      onCreateLead(); // Redirect to lead creation
    } else {
      // Fallback - you might want to navigate programmatically
      console.log('Create new lead functionality not provided');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isEdit && !selectedLead && !leadToConvert) {
      setErrors({
        lead_selection: 'Please select a lead to convert to customer.'
      });
      return;
    }

    const { isValid, errors } = validateForm(formData, validationRules);
    
    if (!isValid) {
      setErrors(errors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (isEdit) {
        // Regular customer update
        await onSubmit(formData);
      } else {
        // Convert lead to customer
        const leadData = selectedLead || leadToConvert;
        const customerData = {
          customer_uid: parseInt(formData.customer_uid),
          name: leadData.company_name || leadData.full_name,
          registered_email: formData.registered_email,
          type: formData.type,
          country: leadData.country,
          is_closed: formData.is_closed
        };

        if (leadToConvert) {
          // If converting a specific lead, use the onSubmit callback
          await onSubmit(customerData);
        } else {
          // If selecting from available leads, use the API directly
          await leadApi.convertLead(leadData.lead_id, customerData);
          onClose();
        }
      }
    } catch (err) {
      console.error('Error submitting customer form:', err);
      setErrors({
        submit: err.response?.data?.message || err.message || 'Failed to save customer. Please try again.'
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background border border-gray-700 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-text">
              {isEdit ? 'Edit Customer' : leadToConvert ? 'Convert Lead to Customer' : 'Create Customer from Lead'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-text p-1 rounded hover:bg-gray-800"
              title="Close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {errors.submit && (
            <div className="mb-4 p-3 bg-red-900/20 border border-highlight2 text-highlight2 rounded">
              {errors.submit}
            </div>
          )}

          {errors.fetch && (
            <div className="mb-4 p-3 bg-red-900/20 border border-highlight2 text-highlight2 rounded">
              {errors.fetch}
            </div>
          )}

          {!isEdit && leadToConvert && (
            <>
              {/* Converting Specific Lead Section */}
              <div className="mb-6 p-4 border border-gray-600 rounded-lg">
                <h3 className="text-lg font-semibold text-text mb-4">Converting Lead to Customer</h3>
                <div className="bg-gray-800 p-3 rounded border border-gray-600">
                  <h4 className="font-medium text-text mb-2">Lead Information:</h4>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p><span className="font-medium">Name:</span> {leadToConvert.full_name}</p>
                    <p><span className="font-medium">Company:</span> {leadToConvert.company_name || 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {leadToConvert.email || 'N/A'}</p>
                    <p><span className="font-medium">Status:</span> {leadToConvert.status}</p>
                    <p><span className="font-medium">Type:</span> {leadToConvert.type}</p>
                    <p><span className="font-medium">BD in Charge:</span> {leadToConvert.bd_in_charge}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {!isEdit && !leadToConvert && (
            <>
              {/* Lead Selection Section */}
              <div className="mb-6 p-4 border border-gray-600 rounded-lg">
                <h3 className="text-lg font-semibold text-text mb-4">Select Lead to Convert</h3>
                
                {loadingLeads ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-highlight1"></div>
                    <span className="ml-2 text-text">Loading available leads...</span>
                  </div>
                ) : availableLeads.length === 0 ? (
                  <div className="text-center p-4">
                    <p className="text-gray-400 mb-4">No unconverted leads available.</p>
                    <button
                      type="button"
                      onClick={handleCreateNewLead}
                      className="bg-highlight1 text-white px-4 py-2 rounded hover:bg-highlight1/80 transition-colors"
                    >
                      Create New Lead First
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-text mb-2">
                        Choose a Lead *
                      </label>
                      <select
                        value={selectedLead?.lead_id || ''}
                        onChange={handleLeadSelect}
                        className={`w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                          errors.lead_selection ? 'border-highlight2' : ''
                        }`}
                      >
                        <option value="">Select a lead to convert...</option>
                        {availableLeads.map(lead => (
                          <option key={lead.lead_id} value={lead.lead_id}>
                            {lead.full_name} - {lead.company_name || 'No Company'} ({lead.status})
                          </option>
                        ))}
                      </select>
                      {renderError('lead_selection')}
                    </div>

                    {selectedLead && (
                      <div className="bg-gray-800 p-3 rounded border border-gray-600">
                        <h4 className="font-medium text-text mb-2">Selected Lead Preview:</h4>
                        <div className="text-sm text-gray-300 space-y-1">
                          <p><span className="font-medium">Name:</span> {selectedLead.full_name}</p>
                          <p><span className="font-medium">Company:</span> {selectedLead.company_name || 'N/A'}</p>
                          <p><span className="font-medium">Email:</span> {selectedLead.email || 'N/A'}</p>
                          <p><span className="font-medium">Status:</span> {selectedLead.status}</p>
                          <p><span className="font-medium">Type:</span> {selectedLead.type}</p>
                          <p><span className="font-medium">BD in Charge:</span> {selectedLead.bd_in_charge}</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={handleCreateNewLead}
                        className="text-highlight1 hover:text-highlight1/80 transition-colors text-sm"
                      >
                        Don't see the lead you want? Create a new lead first →
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Customer Information */}
              <div>
                <label className="block text-sm font-medium text-text">Customer ID *</label>
                <input
                  type="text"
                  name="customer_uid"
                  value={formData.customer_uid}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                    errors.customer_uid ? 'border-highlight2' : ''
                  }`}
                  placeholder="Enter unique customer ID"
                  required
                />
                {renderError('customer_uid')}
              </div>

              <div>
                <label className="block text-sm font-medium text-text">Registered Email</label>
                <input
                  type="email"
                  name="registered_email"
                  value={formData.registered_email}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                    errors.registered_email ? 'border-highlight2' : ''
                  }`}
                  placeholder="Customer's registered email"
                />
                {renderError('registered_email')}
              </div>

              <div>
                <FormSelect
                  name="type"
                  label="Type"
                  value={formData.type}
                  onChange={handleChange}
                  type="customer"
                  error={errors.type}
                  required
                  placeholder="Select Customer Type"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_closed"
                  checked={formData.is_closed}
                  onChange={handleChange}
                  className="h-4 w-4 text-highlight1 focus:ring-highlight1 border-gray-600 rounded bg-background"
                />
                <label className="ml-2 block text-sm text-text">
                  Customer is closed
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-700">
              <button
                type="submit"
                className="bg-highlight1 text-white px-4 py-2 rounded hover:bg-highlight1/80 transition-colors disabled:opacity-50"
                disabled={isSubmitting || (!isEdit && !selectedLead && !leadToConvert)}
              >
                {isSubmitting ? 'Converting...' : (isEdit ? 'Update Customer' : 'Convert to Customer')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;
