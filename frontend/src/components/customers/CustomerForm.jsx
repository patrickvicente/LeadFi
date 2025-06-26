import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { optionHelpers } from '../../config/options';
import { validateForm } from '../../utils/formValidation';
import FormSelect from '../common/FormSelect';

const CustomerForm = ({ onClose, onSubmit, customer = null }) => {
  const isEdit = customer !== null;
  
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    customer_uid: customer?.customer_uid || '',
    registered_email: customer?.registered_email || '',
    country: customer?.country || '',
    type: customer?.type || '',
    bd_in_charge: customer?.bd_in_charge || '',
    is_closed: customer?.is_closed || false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationRules = {
    required: ['name', 'customer_uid', 'type'],
    email: ['registered_email'],
    phone: ['phone_number']
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { isValid, errors } = validateForm(formData, validationRules);
    
    if (!isValid) {
      setErrors(errors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      // Form will be closed by parent component
    } catch (err) {
      console.error('Error submitting customer form:', err);
      setErrors({
        submit: err.response?.data?.message || 'Failed to save customer. Please try again.'
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
              {isEdit ? 'Edit Customer' : 'Create New Customer'}
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
                <label className="block text-sm font-medium text-text">Customer Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                    errors.name ? 'border-highlight2' : ''
                  }`}
                  required
                />
                {renderError('name')}
              </div>

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
                  required
                />
                {renderError('customer_uid')}
              </div>

              {/* Contact Information */}
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
                />
                {renderError('registered_email')}
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
                <label className="block text-sm font-medium text-text">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1"
                />
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
                  placeholder="Select Type"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text">BD in Charge</label>
                <input
                  type="text"
                  name="bd_in_charge"
                  value={formData.bd_in_charge}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1"
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

              {/* Additional Information */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-text">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1"
                  placeholder="Add any additional notes about this customer..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-600 text-text px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-highlight1 text-white px-4 py-2 rounded hover:bg-highlight1/80 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : (isEdit ? 'Update Customer' : 'Create Customer')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;
