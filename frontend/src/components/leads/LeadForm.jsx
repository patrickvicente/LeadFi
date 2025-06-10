// frontend/src/components/leads/LeadForm.jsx
import React, { useState, useEffect } from 'react';
import { optionHelpers } from '../../config/options';
import { validateForm } from '../../utils/formValidation';

const LeadForm = ({ lead, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    title: '',
    email: '',
    telegram: '',
    phone_number: '',
    source: '',
    status: '1. lead generated',
    linkedin_url: '',
    company_name: '',
    country: '',
    bd_in_charge: '',
    background: '',
    type: ''
  });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { isValid, errors } = validateForm(formData, validationRules);
    
    if (!isValid) {
      setErrors(errors);
      return;
    }

    try {
      console.log('Form data before submit:', formData);
      await onSubmit(formData);
      console.log('Form submitted:', formData);
      onClose(); 
    } catch (err) {
      // Handle API errors
      console.error('Error submitting form:', err);
      setErrors({
        submit: err.response?.data?.message || 'Failed to save lead. Please try again.'
      });
    }
  };

  const renderError = (fieldName) => {
    if (errors[fieldName]) {
      return (
        <p className="mt-1 text-sm text-red-600">
          {errors[fieldName]}
        </p>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-[800px] shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {lead ? 'Edit Lead' : 'Add New Lead'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            ×
          </button>
        </div>

        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {errors.submit}
          </div>
        )}


        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Basic Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.full_name ? 'border-red-300' : ''
                }`}
                required
              />
              {renderError('full_name')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Contact Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.email ? 'border-red-300' : ''
                }`}
              />
              {renderError('email')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Telegram</label>
              <input
                type="text"
                name="telegram"
                value={formData.telegram}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.telegram ? 'border-red-300' : ''
                }`}
              />
              {renderError('telegram')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.phone_number ? 'border-red-300' : ''
                }`}
              />
              {renderError('phone_number')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
              <input
                type="url"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.linkedin_url ? 'border-red-300' : ''
                }`}
              />
              {renderError('linkedin_url')}
            </div>

            {/* Company Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Lead Status and Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.status ? 'border-red-300' : ''
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
              <label className="block text-sm font-medium text-gray-700">Source *</label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.source ? 'border-red-300' : ''
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
              <label className="block text-sm font-medium text-gray-700">Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.type ? 'border-red-300' : ''
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
              <label className="block text-sm font-medium text-gray-700">BD In Charge *</label>
              <input
                type="text"
                name="bd_in_charge"
                value={formData.bd_in_charge}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.bd_in_charge ? 'border-red-300' : ''
                }`}
                required
              />
              {renderError('bd_in_charge')}
            </div>

            {/* Additional Information */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Background</label>
              <textarea
                name="background"
                value={formData.background}
                onChange={handleChange}
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {lead ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadForm;