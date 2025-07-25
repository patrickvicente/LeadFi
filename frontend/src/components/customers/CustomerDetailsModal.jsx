import React, { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, EyeIcon, PlusIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { formatDateOnly } from '../../utils/dateFormat';
import { optionHelpers } from '../../config/options';
import { validateForm } from '../../utils/formValidation';
import ActionButtons from '../common/ActionButtons';
import IconButton from '../common/IconButton';
import FormSelect from '../common/FormSelect';
import ActivityTaskModal from '../activity/ActivityTaskModal';
import ActivitySummary from '../activity/ActivitySummary';


const CustomerDetailsModal = ({ customer, loading = false, onClose, onEdit, onDelete, onSubmit, onViewLead }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityModalMode, setActivityModalMode] = useState('activity');



  const validationRules = {
    required: ['name', 'customer_uid', 'type'],
    email: ['registered_email']
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
      // Only send fields that are valid for customer updates
      const customerUpdateData = {
        customer_uid: formData.customer_uid,
        name: formData.name,
        registered_email: formData.registered_email,
        type: formData.type,
        country: formData.country,
        is_closed: formData.is_closed,
        date_closed: formData.date_closed
      };

      await onSubmit(customerUpdateData);
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

  const getStatusBadge = (status) => {
    if (!status) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
          No Status
        </span>
      );
    }

    const statusColors = {
      'lead generated': 'bg-blue-600 text-white',
      'proposal': 'bg-yellow-600 text-white',
      'negotiation': 'bg-orange-600 text-white',
      'registration': 'bg-purple-600 text-white',
      'integration': 'bg-indigo-600 text-white',
      'closed won': 'bg-highlight5 text-white',
      'lost': 'bg-highlight2 text-white',
      'default': 'bg-gray-700 text-gray-300'
    };
    
    const colorClass = statusColors[status.toLowerCase()] || statusColors.default;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {status}
      </span>
    );
  };

  const handleViewLead = (lead) => {
    if (onViewLead) {
      onViewLead(lead);
    }
  };

      const handleActivitySuccess = useCallback(() => {
        setShowActivityModal(false);
        // Could refresh customer data here if needed
    }, []);

  const openActivityModal = (mode = 'activity') => {
    setActivityModalMode(mode);
    setShowActivityModal(true);
  };

  if (!customer && !loading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background border border-gray-700 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-text">
              {loading ? 'Loading Customer Details...' : isEditMode ? 'Edit Customer' : 'Customer Details'}
            </h2>
            <div className="flex items-center gap-2">
              {!loading && customer && (
                <>
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
              <span className="ml-4 text-text">Loading customer details...</span>
            </div>
          ) : !customer ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-400">No customer data available.</p>
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
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-400 shadow-sm cursor-not-allowed"
                        disabled
                        readOnly
                      />
                    </div>

                    {/* Contact Information */}
                    <div>
                      <label className="block text-sm font-medium text-text">Registered Email</label>
                      <input
                        type="email"
                        name="registered_email"
                        value={formData.registered_email || ''}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
                          errors.registered_email ? 'border-highlight2' : ''
                        }`}
                      />
                      {renderError('registered_email')}
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
                      <FormSelect
                        name="type"
                        label="Type"
                        value={formData.type || ''}
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
                        value={formData.bd_in_charge || 'Unassigned'}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-400 shadow-sm cursor-not-allowed"
                        disabled
                        readOnly
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
                        <p><span className="font-medium">Registered Email:</span> {customer.registered_email || 'N/A'}</p>
                        <p><span className="font-medium">Country:</span> {customer.country || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-text">Customer Details</h3>
                      <div className="space-y-2 text-text">
                        <p><span className="font-medium">Type:</span> {customer.type}</p>
                        <p>
                          <span className="font-medium">Status:</span>{' '}
                          {customer.lead_status ? (
                            <span className="inline-block ml-1">
                              {getStatusBadge(customer.lead_status)}
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </p>
                        <p><span className="font-medium">BD in Charge:</span> {customer.bd_in_charge || 'Unassigned'}</p>
                        <p><span className="font-medium">Date Converted:</span> {customer.date_converted ? formatDateOnly(customer.date_converted) : 'Unknown'}</p>
                        {customer.date_closed && (
                          <p><span className="font-medium">Closed:</span> {formatDateOnly(customer.date_closed)}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Background Information from Related Leads */}
                  {customer.related_leads && customer.related_leads.length > 0 && customer.related_leads[0].background && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-4 text-text">Background Information</h3>
                      <div className="bg-gray-800 rounded-lg p-4">
                        <p className="text-text whitespace-pre-wrap">{customer.related_leads[0].background}</p>
                        {customer.related_leads.length > 1 && (
                          <p className="text-gray-400 text-sm mt-2 italic">
                            Background from primary lead. Additional leads may have different background information.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Related Leads */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-text">Related Leads</h3>
                    {customer.related_leads && customer.related_leads.length > 0 ? (
                      <div className="bg-gray-800 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-700">
                          <thead className="bg-gray-900">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Full Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Email
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Telegram
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Source
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider w-20">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {customer.related_leads.map((lead, index) => (
                              <tr
                                key={lead.lead_id}
                                className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}
                              >
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-text">
                                    {lead.full_name}
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    {lead.title || ''}
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  {getStatusBadge(lead.status)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-text">
                                  {lead.email || 'N/A'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-text">
                                  {lead.telegram || 'N/A'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-text">
                                  {lead.source || 'N/A'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                  <IconButton
                                    icon={EyeIcon}
                                    onClick={() => handleViewLead(lead)}
                                    variant="view"
                                    size="sm"
                                    title="View Lead Details"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-gray-800 rounded-lg p-4">
                        <p className="text-gray-400">No related leads found.</p>
                      </div>
                    )}
                  </div>

                  {/* Latest Activities */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-text">Latest Activities</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openActivityModal('activity')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-highlight1 text-white rounded-md hover:bg-highlight1/80 transition-colors text-sm"
                          title="Log Activity"
                        >
                          <PlusIcon className="h-4 w-4" />
                          Activity
                        </button>
                        <button
                          onClick={() => openActivityModal('task')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-highlight3 text-white rounded-md hover:bg-highlight3/80 transition-colors text-sm"
                          title="Create Task"
                        >
                          <ClipboardDocumentListIcon className="h-4 w-4" />
                          Task
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <ActivitySummary 
                        customerUid={customer.customer_uid || customer.customer_id}
                        title=""
                        limit={5}
                        compact={true}
                        showHeader={false}
                        showActions={false}
                        onActivityAdded={handleActivitySuccess}
                      />
                    </div>
                  </div>
                </>
              )}


            </>
          )}
        </div>
      </div>
      
      {/* Activity/Task Modal */}
      <ActivityTaskModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        mode={activityModalMode}
        prefilledData={{
          lead_id: customer?.related_leads?.[0]?.lead_id, // Use primary lead
          activity_category: 'manual'
        }}
        onSuccess={handleActivitySuccess}
      />
    </div>
  );
};

export default CustomerDetailsModal;