import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { optionHelpers } from '../../config/options';
import { validateForm } from '../../utils/formValidation';
import FormSelect from '../common/FormSelect';

const LeadForm = ({ lead, onClose, onSubmit }) => {
  const isEdit = lead !== null;
  
  const [formData, setFormData] = useState({
    full_name: lead?.full_name || '',
    title: lead?.title || '',
    email: lead?.email || '',
    telegram: lead?.telegram || '',
    phone_number: lead?.phone_number || '',
    source: lead?.source || '',
    status: lead?.status || '1. lead generated',
    linkedin_url: lead?.linkedin_url || '',
    company_name: lead?.company_name || '',
    country: lead?.country || '',
    bd_in_charge: lead?.bd_in_charge || '',
    background: lead?.background || '',
    type: lead?.type || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { isValid, errors } = validateForm(formData, validationRules);
    
    if (!isValid) {
      setErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Form data before submit:', formData);
      await onSubmit(formData);
      console.log('Form submitted:', formData);
      // Form will be closed by parent component
    } catch (err) {
      // Handle API errors
      console.error('Error submitting form:', err);
      setErrors({
        submit: err.response?.data?.message || 'Failed to save lead. Please try again.'
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
      <div className="bg-background border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-text">
              {isEdit ? 'Edit Lead' : 'Create New Lead'}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Basic Information */}
            <div>
                <label className="block text-sm font-medium text-text">Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
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
                value={formData.title}
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
                value={formData.email}
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
                value={formData.telegram}
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
                value={formData.phone_number}
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
                value={formData.linkedin_url}
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
                value={formData.company_name}
                onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1"
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-text">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1"
              />
            </div>

            {/* Lead Status and Source */}
            <div>
                <FormSelect
                name="status"
                  label="Status"
                value={formData.status}
                onChange={handleChange}
                  type="lead"
                  error={errors.status}
                required
                />
            </div>

            <div>
                <FormSelect
                name="source"
                  label="Source"
                value={formData.source}
                onChange={handleChange}
                  type="lead"
                  error={errors.source}
                required
                  placeholder="Select Source"
                />
            </div>

            <div>
                <FormSelect
                name="type"
                  label="Type"
                value={formData.type}
                onChange={handleChange}
                  type="lead"
                  error={errors.type}
                required
                  placeholder="Select Type"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-text">BD in Charge *</label>
              <input
                type="text"
                name="bd_in_charge"
                value={formData.bd_in_charge}
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
                value={formData.background}
                onChange={handleChange}
                rows="3"
                  className="mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1"
                  placeholder="Add any background information about this lead..."
              />
            </div>
          </div>

            {/* Form Actions */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-700">
            <button
              type="submit"
                className="bg-highlight1 text-white px-4 py-2 rounded hover:bg-highlight1/80 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Saving...' : (isEdit ? 'Update Lead' : 'Create Lead')}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default LeadForm;