import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/dateFormat';
import { activityOptions } from '../../config/options';
import ActivityDetailsModal from './ActivityDetailsModal';

const ActivitySummary = ({
  // Entity filters
  leadId,
  customerUid,
  assignedTo,
  
  // Time filters
  timeFilter, // 'today', 'week', 'month', 'all'
  
  // Content filters
  showTasks = true,
  showActivities = true,
  showOverdue = false,
  priority,
  status,
  
  // Display options
  title = "Recent Activities",
  limit = 10,
  compact = false,
  showHeader = true,
  showActions = true,
  
  // Callbacks
  onViewAll,
  onActivityAdded
}) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      // Build params inline to avoid circular dependencies
      const params = {
        page: 1,
        per_page: limit,
        sort_by: 'date_created',
        sort_order: 'desc'
      };

      // Entity filters
      if (leadId) params.lead_id = leadId;
      if (customerUid) params.customer_uid = customerUid;
      if (assignedTo) params.assigned_to = assignedTo;

      // Content filters
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (showOverdue) params.overdue_only = true;
      
      // Task/Activity filter
      if (showTasks && !showActivities) params.tasks_only = true;
      
      // Time filters
      if (timeFilter) {
        const now = new Date();
        let startDate;
        
        switch (timeFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            params.created_after = startDate.toISOString();
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            params.created_after = startDate.toISOString();
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            params.created_after = startDate.toISOString();
            break;
        }
      }

      const response = await api.activity.getActivities(params);
      setActivities(response.activities || []);
    } catch (error) {
      console.error('Error loading activities:', error);
      showToast('Failed to load activities', 'error');
    } finally {
      setLoading(false);
    }
  }, [leadId, customerUid, assignedTo, timeFilter, showTasks, showActivities, showOverdue, priority, status, limit, showToast]);

  // Initial load and refresh when dependencies change
  useEffect(() => {
    fetchActivities();
  }, [leadId, customerUid, assignedTo, timeFilter, showTasks, showActivities, showOverdue, priority, status, limit]);

  // Refresh when new activity is added (no dependency on fetchActivities to avoid loops)
  useEffect(() => {
    if (onActivityAdded) {
      // Simple timeout to prevent immediate re-triggers
      const timer = setTimeout(() => {
        fetchActivities();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [onActivityAdded]);

  // Get activity type label
  const getActivityTypeLabel = (type, category) => {
    const activityType = activityOptions.allActivityTypes.find(opt => opt.value === type);
    return activityType?.label || type;
  };

  // Get status badge styling
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-600 text-white';
      case 'in_progress':
        return 'bg-blue-600 text-white';
      case 'completed':
        return 'bg-highlight5 text-white';
      case 'cancelled':
        return 'bg-highlight2 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  // Get priority badge styling
  const getPriorityBadgeStyle = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-highlight2 text-white';
      case 'medium':
        return 'bg-highlight3 text-white';
      case 'low':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  // Handle navigation to related entity
  const handleNavigateToEntity = (activity) => {
    if (activity.related_entity_type === 'lead' && activity.lead_id) {
      navigate(`/leads?leadId=${activity.lead_id}`);
    } else if (activity.related_entity_type === 'customer' && activity.customer_uid) {
      navigate(`/customers?customerId=${activity.customer_uid}`);
    }
  };

  // Handle activity details modal
  const handleActivityClick = (activityId) => {
    // Add activityId to URL parameters
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('activityId', activityId);
    navigate({
      pathname: window.location.pathname,
      search: `?${newParams.toString()}`
    });
  };

  const handleDetailsModalSuccess = () => {
    fetchActivities(); // Refresh activities
  };

  // Handle task completion
  const handleCompleteTask = async (activityId) => {
    try {
      const completionNotes = prompt('Enter completion notes (optional):');
      await api.activity.completeTask(activityId, completionNotes);
      showToast('Task completed successfully!', 'success');
      fetchActivities(); // Refresh
    } catch (error) {
      console.error('Error completing task:', error);
      showToast('Failed to complete task', 'error');
    }
  };

  // Handle view all
  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      // Default navigation to activities page with filters
      const params = new URLSearchParams();
      if (leadId) params.set('lead_id', leadId);
      if (customerUid) params.set('customer_uid', customerUid);
      if (assignedTo) params.set('assigned_to', assignedTo);
      navigate(`/activities?${params.toString()}`);
    }
  };

  return (
    <div className={`bg-background ${compact ? '' : 'border border-gray-700 rounded-lg p-4'}`}>
      {showHeader && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-text">{title}</h3>
          {(onViewAll || activities.length > 0) && (
            <button 
              onClick={handleViewAll}
              className="text-highlight1 hover:text-highlight1/80 text-sm font-medium"
            >
              View All
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-highlight1"></div>
          <span className="ml-3 text-text">Loading activities...</span>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No activities found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Related To
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Completed
                </th>
                {showActions && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {activities.map((activity, index) => (
                <tr
                  key={activity.activity_id}
                  onClick={() => handleActivityClick(activity.activity_id)}
                  className={`transition-colors hover:bg-gray-800 cursor-pointer ${
                    index % 2 === 0 ? 'bg-background' : 'bg-gray-900'
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    {activity.status && (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(activity.status)}`}>
                        {activity.status}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {activity.priority && (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeStyle(activity.priority)}`}>
                        {activity.priority}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-text">
                    <div className="truncate max-w-[120px]" title={getActivityTypeLabel(activity.activity_type, activity.activity_category)}>
                      {getActivityTypeLabel(activity.activity_type, activity.activity_category)}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm text-text">
                    <div className="truncate max-w-[200px]" title={activity.description}>
                      {activity.description}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-text">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigateToEntity(activity);
                      }}
                      className="text-left truncate hover:text-highlight1 transition-colors cursor-pointer max-w-[120px]"
                      title={`Navigate to ${activity.related_entity_type}: ${activity.related_entity_name}`}
                    >
                      <div className="truncate">
                        {activity.related_entity_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {activity.related_entity_type}
                      </div>
                    </button>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-text">
                    <div className="truncate max-w-[100px]" title={activity.created_by}>
                      {activity.created_by}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-text">
                    <div className="truncate max-w-[100px]" title={activity.assigned_to}>
                      {activity.assigned_to}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-text">
                    <div className="truncate" title={formatDate(activity.date_created)}>
                      {formatDate(activity.date_created)}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-text">
                    {activity.due_date && (
                      <div className={`truncate ${activity.is_overdue ? 'text-highlight2 font-semibold' : ''}`} title={formatDate(activity.due_date)}>
                        {formatDate(activity.due_date)}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-text">
                    {activity.date_completed && (
                      <div className="truncate" title={formatDate(activity.date_completed)}>
                        {formatDate(activity.date_completed)}
                      </div>
                    )}
                  </td>
                  {showActions && (
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-text">
                      {activity.is_task && activity.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteTask(activity.activity_id);
                          }}
                          className="text-highlight5 hover:text-green-400 font-medium text-xs"
                          title="Complete Task"
                        >
                          ✓ Complete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Activity Details Modal */}
      <ActivityDetailsModal
        onSuccess={handleDetailsModalSuccess}
      />
    </div>
  );
};

export default ActivitySummary; 