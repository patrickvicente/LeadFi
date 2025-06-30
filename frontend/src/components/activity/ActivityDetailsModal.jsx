import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { XMarkIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import IconButton from '../common/IconButton';
import ActivityTaskModal from './ActivityTaskModal';
import Toast from '../common/Toast';
import { activityApi } from '../../services/api';
import { activityOptions } from '../../config/options';

const ActivityDetailsModal = ({ 
  isOpen: propIsOpen, 
  onClose: propOnClose, 
  activityId: propActivityId, 
  onSuccess 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  // Get activityId from URL params or props
  const urlParams = new URLSearchParams(location.search);
  const urlActivityId = urlParams.get('activityId');
  const activityId = urlActivityId || propActivityId;
  
  // Modal is open if URL has activityId or if explicitly opened via props
  const isOpen = !!urlActivityId || propIsOpen;

  // Handle modal close
  const handleClose = () => {
    if (urlActivityId) {
      // Remove activityId from URL
      const newParams = new URLSearchParams(location.search);
      newParams.delete('activityId');
      const newSearch = newParams.toString();
      navigate({
        pathname: location.pathname,
        search: newSearch ? `?${newSearch}` : ''
      }, { replace: true });
    }
    
    if (propOnClose) {
      propOnClose();
    }
  };

  useEffect(() => {
    if (isOpen && activityId) {
      fetchActivity();
    }
  }, [isOpen, activityId]);

  const fetchActivity = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await activityApi.getActivity(activityId);
      setActivity(response);
    } catch (error) {
      console.error('Error fetching activity:', error);
      setError('Failed to load activity details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    fetchActivity(); // Refresh activity data
    if (onSuccess) onSuccess();
    setToast({
      type: 'success',
      message: 'Activity updated successfully!'
    });
  };

  const handleDelete = async () => {
    try {
      await activityApi.deleteActivity(activityId);
      setShowDeleteConfirm(false);
      setToast({
        type: 'success',
        message: 'Activity deleted successfully!'
      });
      
      // Close modal after short delay
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Error deleting activity:', error);
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete activity'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatActivityType = (type) => {
    if (!type) return 'N/A';
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStatusBadge = (activity) => {
    if (!activity.is_task) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Completed
        </span>
      );
    }
    
    if (activity.date_completed) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Completed
        </span>
      );
    }
    
    if (activity.is_overdue) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Overdue
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Pending
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    if (!priority) return null;
    
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[priority] || colors.medium}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-background border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-text">Activity Details</h2>
                {activity && (
                  <p className="text-gray-400 mt-1">
                    {activity.is_task ? 'Task' : 'Activity'} #{activity.activity_id}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {/* Edit Button - Only for manual activities */}
                {activity && activity.activity_category === 'manual' && (
                  <IconButton
                    icon={PencilIcon}
                    onClick={handleEdit}
                    variant="secondary"
                    title="Edit Activity"
                  />
                )}
                
                {/* Delete Button - Only for manual activities */}
                {activity && activity.activity_category === 'manual' && (
                  <IconButton
                    icon={TrashIcon}
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="danger"
                    title="Delete Activity"
                  />
                )}
                
                <IconButton
                  icon={XMarkIcon}
                  onClick={handleClose}
                  variant="default"
                  title="Close"
                />
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-highlight1"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-highlight2 mb-4">{error}</p>
                <button
                  onClick={fetchActivity}
                  className="px-4 py-2 bg-highlight1 text-white rounded-lg hover:bg-highlight1/80 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Activity Details */}
            {activity && !loading && !error && (
              <div className="space-y-6">
                {/* Status and Priority */}
                <div className="flex items-center space-x-4">
                  {getStatusBadge(activity)}
                  {activity.is_task && getPriorityBadge(activity.priority)}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {activity.activity_category}
                  </span>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text mb-4">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-400">Type</label>
                        <p className="text-text">{formatActivityType(activity.activity_type)}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-400">Description</label>
                        <p className="text-text">{activity.description || 'No description provided'}</p>
                      </div>

                      {activity.is_task && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-400">Assigned To</label>
                            <p className="text-text">{activity.assigned_to || 'Not assigned'}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text mb-4">Dates & Timeline</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-400">Created</label>
                        <p className="text-text">{formatDate(activity.date_created)}</p>
                      </div>

                      {activity.is_task && activity.due_date && (
                        <div>
                          <label className="block text-sm font-medium text-gray-400">Due Date</label>
                          <p className="text-text">{formatDate(activity.due_date)}</p>
                        </div>
                      )}

                      {activity.date_completed && (
                        <div>
                          <label className="block text-sm font-medium text-gray-400">Completed</label>
                          <p className="text-text">{formatDate(activity.date_completed)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Related Information */}
                <div>
                  <h3 className="text-lg font-semibold text-text mb-4">Related Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activity.related_entity_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400">Related To</label>
                        <p className="text-text">
                          {activity.related_entity_name} ({activity.related_entity_type})
                        </p>
                      </div>
                    )}

                    {activity.created_by && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400">Created By</label>
                        <p className="text-text">{activity.created_by}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Metadata */}
                {activity.activity_metadata && Object.keys(activity.activity_metadata).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-text mb-4">Additional Details</h3>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                        {JSON.stringify(activity.activity_metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-background border border-gray-700 rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-text mb-4">Confirm Delete</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this {activity?.is_task ? 'task' : 'activity'}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-600 rounded-lg text-text hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-highlight2 text-white rounded-lg hover:bg-highlight2/80 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && activity && (
        <ActivityTaskModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          mode={activity.is_task ? 'task' : 'activity'}
          prefilledData={{
            activity_type: activity.activity_type,
            description: activity.description,
            activity_category: activity.activity_category,
            lead_id: activity.lead_id,
            customer_uid: activity.customer_uid,
            due_date: activity.due_date ? activity.due_date.slice(0, 16) : '', // Format for datetime-local
            priority: activity.priority,
            assigned_to: activity.assigned_to,
            activity_id: activity.activity_id // Add for edit mode
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          isVisible={true}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default ActivityDetailsModal; 