import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateFormat';
import { optionHelpers } from '../../config/options';
import { validateForm } from '../../utils/formValidation';
import ActionButtons from '../common/ActionButtons';
import IconButton from '../common/IconButton';

const CustomerDetailsModal = ({ customer, onClose, onEdit, onDelete, onSubmit }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const validationRules = {
    required: ['name', 'customer_uid', 'type'],
    email: ['email'],
    phone: ['phone_number'],
    url: ['linkedin_url']
  };

  useEffect(() => {
    if (customer) {
      setFormData(customer);
    }
  }, [customer]);

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

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setFormData(customer); // Reset to original data
    setErrors({});
  };

  const handleSaveEdit = async () => {
    const { isValid, errors } = validateForm(formData, validationRules);
    
    if (!isValid) {
      setErrors(errors);
      return;
    }

    try {
      await onSubmit(formData);
      setIsEditMode(false);
      setErrors({});
    } catch (err) {
      console.error('Error updating customer:', err);
      setErrors({
        submit: err.response?.data?.message || 'Failed to update customer. Please try again.'
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

  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-text">
              {isEditMode ? 'Edit Customer' : 'Customer Details'}
            </h2>
            <div className="flex items-center gap-2">
              {!isEditMode ? (
                <ActionButtons
                  actions={{
                    onEdit: handleEditClick,
                    onDelete: () => onDelete(customer.customer_uid || customer.customer_id),
                    showEdit: true,
                    showDelete: true,
                    editTitle: "Edit Customer",
                    deleteTitle: "Delete Customer"
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
              <IconButton
                icon={XMarkIcon}
                onClick={onClose}
                variant="default"
                title="Close"
              />
            </div>
          </div>

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
                  <label className="block text-sm font-medium text-text">Customer Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
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
                    value={formData.customer_uid || ''}
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
                  <label className="block text-sm font-medium text-text">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1"
                  />
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
                    {optionHelpers.getOptions('type', 'customer').map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {renderError('type')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text">BD in Charge</label>
                  <input
                    type="text"
                    name="bd_in_charge"
                    value={formData.bd_in_charge || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_closed"
                    checked={formData.is_closed || false}
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
                    value={formData.notes || ''}
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
              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-text">Customer Information</h3>
                  <div className="space-y-2 text-text">
                    <p><span className="font-medium">Name:</span> {customer.name}</p>
                    <p><span className="font-medium">Customer ID:</span> {customer.customer_uid || customer.customer_id}</p>
                    <p><span className="font-medium">Email:</span> {customer.email || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {customer.phone_number || 'N/A'}</p>
                    <p><span className="font-medium">Country:</span> {customer.country || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-text">Customer Details</h3>
                  <div className="space-y-2 text-text">
                    <p><span className="font-medium">Type:</span> {customer.type}</p>
                    <p><span className="font-medium">Status:</span> {customer.is_closed ? 'Closed' : 'Active'}</p>
                    <p><span className="font-medium">BD in Charge:</span> {customer.bd_in_charge || 'Unassigned'}</p>
                    <p><span className="font-medium">Created:</span> {formatDate(customer.date_created)}</p>
                    {customer.date_closed && (
                      <p><span className="font-medium">Closed:</span> {formatDate(customer.date_closed)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {customer.notes && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-text">Notes</h3>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-text whitespace-pre-wrap">{customer.notes}</p>
                  </div>
                </div>
              )}

              {/* Latest Activities */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-text">Latest Activities</h3>
                <div className="space-y-4">
                  <p className="text-gray-400">No recent activities</p>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={onClose}
              className="bg-gray-600 text-text px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;