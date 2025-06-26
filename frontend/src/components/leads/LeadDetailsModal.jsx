import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateFormat';
import { optionHelpers } from '../../config/options';
import { validateForm } from '../../utils/formValidation';
import ActionButtons from '../common/ActionButtons';
import IconButton from '../common/IconButton';

const LeadDetailsModal = ({ lead, loading = false, onClose, onEdit, onDelete, onConvert, onSubmit }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const validationRules = {
    required: ['full_name', 'status', 'source', 'type', 'bd_in_charge'],
    eitherOr: [['email', 'telegram']],
    email: ['email'],
    phone: ['phone_number'],
    url: ['linkedin_url']
  };

  useEffect(() => {
    if (lead) {
      setFormData(lead);
    }
  }, [lead]);

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

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setFormData(lead); // Reset to original data
    setErrors({});
  };

  const handleSaveEdit = async () => {
    const { isValid, errors } = validateForm(formData, validationRules);
    
    if (!isValid) {
      setErrors(errors);
      return;
    }

    try {
      // Filter out read-only/computed fields that shouldn't be sent to API
      const updatePayload = {
        full_name: formData.full_name,
        title: formData.title,
        email: formData.email,
        telegram: formData.telegram,
        phone_number: formData.phone_number,
        linkedin_url: formData.linkedin_url,
        company_name: formData.company_name,
        country: formData.country,
        status: formData.status,
        source: formData.source,
        type: formData.type,
        bd_in_charge: formData.bd_in_charge,
        background: formData.background
      };

      await onSubmit(updatePayload);
      setIsEditMode(false);
      setErrors({});
    } catch (err) {
      console.error('Error updating lead:', err);
      setErrors({
        submit: err.response?.data?.message || 'Failed to update lead. Please try again.'
      });
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

  if (!lead) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-text">
              {loading ? 'Loading Lead Details...' : isEditMode ? 'Edit Lead' : 'Lead Details'}
            </h2>
            <div className="flex items-center gap-2">
              {!loading && lead && (
                <>
                  {!isEditMode ? (
                    <ActionButtons
                      actions={{
                        onEdit: handleEditClick,
                        onDelete: () => onDelete(lead.lead_id),
                        showEdit: true,
                        showDelete: true,
                        editTitle: "Edit Lead",
                        deleteTitle: "Delete Lead"
                      }}
                    />
                  ) : (
                    <ActionButtons
                      actions={{
                        onSave: handleSaveEdit,
                        onCancel: handleCancelEdit,
                        showSave: true,
                        showCancel: true,
                        saveTitle: "Save Changes",
                        cancelTitle: "Cancel Edit"
                      }}
                    />
                  )}
                </>
              )}
              

              
              <IconButton
                icon={XMarkIcon}
                onClick={onClose}
                variant="default"
                title="Close"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight1"></div>
              <span className="ml-4 text-text">Loading lead details...</span>
            </div>
          ) : !lead ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-400">No lead data available.</p>
            </div>
          ) : (
            <>
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-900/20 border border-highlight2 text-highlight2 rounded">
                  {errors.submit}
                </div>
              )}

              {isEditMode ? (
                // Edit Form
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Basic Information */}
                    <div>
                      <label className="block text-sm font-medium text-text">Full Name *</label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name || ''}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                          errors.full_name ? 'border-highlight2' : ''
                        }`}
                        required
                      />
                      {renderError('full_name')}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text">Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1"
                      />
                    </div>

                    {/* Contact Information */}
                    <div>
                      <label className="block text-sm font-medium text-text">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                          errors.email ? 'border-highlight2' : ''
                        }`}
                      />
                      {renderError('email')}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text">Telegram</label>
                      <input
                        type="text"
                        name="telegram"
                        value={formData.telegram || ''}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                          errors.telegram ? 'border-highlight2' : ''
                        }`}
                      />
                      {renderError('telegram')}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text">Phone Number</label>
                      <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number || ''}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                          errors.phone_number ? 'border-highlight2' : ''
                        }`}
                      />
                      {renderError('phone_number')}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text">LinkedIn URL</label>
                      <input
                        type="url"
                        name="linkedin_url"
                        value={formData.linkedin_url || ''}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                          errors.linkedin_url ? 'border-highlight2' : ''
                        }`}
                      />
                      {renderError('linkedin_url')}
                    </div>

                    {/* Company Information */}
                    <div>
                      <label className="block text-sm font-medium text-text">Company Name</label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1"
                      />
                    </div>

                    {/* Lead Status and Source */}
                    <div>
                      <label className="block text-sm font-medium text-text">Status *</label>
                      <select
                        name="status"
                        value={formData.status || ''}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                          errors.status ? 'border-highlight2' : ''
                        }`}
                        required
                      >
                        {optionHelpers.getOptions('status', 'lead').map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {renderError('status')}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text">Source *</label>
                      <select
                        name="source"
                        value={formData.source || ''}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                          errors.source ? 'border-highlight2' : ''
                        }`}
                        required
                      >
                        <option value="">Select Source</option>
                        {optionHelpers.getOptions('source', 'lead').map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {renderError('source')}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text">Type *</label>
                      <select
                        name="type"
                        value={formData.type || ''}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                          errors.type ? 'border-highlight2' : ''
                        }`}
                        required
                      >
                        <option value="">Select Type</option>
                        {optionHelpers.getOptions('type', 'lead').map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {renderError('type')}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text">BD In Charge *</label>
                      <input
                        type="text"
                        name="bd_in_charge"
                        value={formData.bd_in_charge || ''}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                          errors.bd_in_charge ? 'border-highlight2' : ''
                        }`}
                        required
                      />
                      {renderError('bd_in_charge')}
                    </div>

                    {/* Additional Information */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-text">Background</label>
                      <textarea
                        name="background"
                        value={formData.background || ''}
                        onChange={handleChange}
                        rows="3"
                        className="mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1"
                      />
                    </div>
                  </div>
                </form>
              ) : (
                // View Mode
                <>
                  {/* Lead Information */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-text">Contact Information</h3>
                      <div className="space-y-2 text-text">
                        <p><span className="font-medium">Name:</span> {lead.full_name}</p>
                        <p><span className="font-medium">Email:</span> {lead.email}</p>
                        <p><span className="font-medium">Phone:</span> {lead.phone_number}</p>
                        <p><span className="font-medium">Company:</span> {lead.company_name}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-text">Lead Details</h3>
                      <div className="space-y-2 text-text">
                        <p><span className="font-medium">Stage:</span> {lead.status}</p>
                        <p><span className="font-medium">Type:</span> {lead.type}</p>
                        <p><span className="font-medium">Source:</span> {lead.source}</p>
                        <p><span className="font-medium">Created:</span> {formatDate(lead.date_created)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Latest Activities */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-text">Latest Activities</h3>
                    <div className="space-y-4">
                      {/* Add your activities list here */}
                      <p className="text-gray-400">No recent activities</p>
                    </div>
                  </div>
                </>
              )}

            </>
          )}

          {/* Convert to Customer Button - Show at bottom if lead is not converted and not in edit mode */}
          {!loading && lead && !isEditMode && !lead.is_converted && onConvert && (
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={() => onConvert(lead)}
                className="bg-highlight1 text-white px-4 py-2 rounded hover:bg-highlight1/80 transition-colors"
                title="Convert this lead to a customer"
              >
                Convert to Customer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadDetailsModal;