import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { activityOptions } from '../../config/options';
import { formatDate } from '../../utils/dateFormat';
import ActionButtons from '../common/ActionButtons';
import IconButton from '../common/IconButton';

const ActivityList = ({ 
  // Data props (passed from parent)
  activities = [],
  loading = false,
  pagination = {},
  onPageChange = null,
  
  // Legacy props for embedded usage (Lead/Customer details)
  leadId = null, 
  customerUid = null, 
  
  // Configuration props
  showFilters = true,
  showActions = true,
  showPagination = true,
  
  // Callback props
  onActivityUpdate = null,
  defaultFilters = {},
  
  // Sorting props
  sortField = 'date_created',
  sortDirection = 'desc',
  onSort = null
}) => {
  // Local state for embedded usage (when leadId/customerUid provided)
  const [localActivities, setLocalActivities] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [localPagination, setLocalPagination] = useState({
    current_page: 1,
    per_page: 20,
    total: 0,
    pages: 0
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    status: '',
    priority: '',
    assigned_to: '',
    overdue_only: false,
    tasks_only: false,
    visible_only: true,
    ...defaultFilters
  });
  
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Determine if this is embedded usage (has leadId or customerUid)
  const isEmbedded = leadId || customerUid;
  
  // Use local data for embedded, props data for standalone
  const displayActivities = isEmbedded ? localActivities : activities;
  const displayLoading = isEmbedded ? localLoading : loading;
  const displayPagination = isEmbedded ? localPagination : pagination;

  // Load activities for embedded usage only
  const loadActivities = async (page = 1) => {
    if (!isEmbedded) return; // Don't fetch if not embedded
    
    setLocalLoading(true);
    try {
      const params = {
        page,
        per_page: localPagination.per_page,
        sort_by: sortField,
        sort_order: sortDirection,
        ...filters
      };

      // Add entity filters for embedded usage
      if (leadId) params.lead_id = leadId;
      if (customerUid) params.customer_uid = customerUid;

      const response = await api.activity.getActivities(params);
      setLocalActivities(response.activities || []);
      setLocalPagination({
        current_page: response.current_page,
        per_page: response.per_page,
        total: response.total,
        pages: response.pages
      });
    } catch (error) {
      console.error('Error loading activities:', error);
      showToast('Failed to load activities', 'error');
    } finally {
      setLocalLoading(false);
    }
  };

  // Initialize filters and load data only for embedded usage
  useEffect(() => {
    if (isEmbedded) {
      // Initialize filters
      setFilters({
        category: '',
        type: '',
        status: '',
        priority: '',
        assigned_to: '',
        overdue_only: false,
        tasks_only: false,
        visible_only: true,
        ...defaultFilters
      });
      
      // Load initial data  
      const timer = setTimeout(() => {
        loadActivities(1);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [leadId, customerUid]); // Only when embedded entities change



  // Filter handlers (for embedded usage)
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      type: '',
      status: '',
      priority: '',
      assigned_to: '',
      overdue_only: false,
      tasks_only: false,
      visible_only: true,
      ...defaultFilters
    });
  };

  // Sort handler
  const handleSort = (column) => {
    if (onSort) {
      // Use parent's sort handler for standalone usage
      onSort(column);
    } else {
      // Handle sorting locally for embedded usage
      if (sortField === column) {
        const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        // For embedded usage, we'd need to track sort state locally
        // For now, let's just call loadActivities
        loadActivities(1);
      }
    }
  };

  // Task actions
  const handleCompleteTask = async (activityId) => {
    try {
      const completionNotes = prompt('Enter completion notes (optional):');
      await api.activity.completeTask(activityId, completionNotes);
      showToast('Task completed successfully!', 'success');
      
      if (isEmbedded) {
        loadActivities(localPagination.current_page);
      }
      if (onActivityUpdate) onActivityUpdate();
    } catch (error) {
      console.error('Error completing task:', error);
      showToast('Failed to complete task', 'error');
    }
  };

  const handleCancelTask = async (activityId) => {
    try {
      const reason = prompt('Enter cancellation reason (optional):');
      await api.activity.cancelTask(activityId, reason);
      showToast('Task cancelled successfully!', 'success');
      
      if (isEmbedded) {
        loadActivities(localPagination.current_page);
      }
      if (onActivityUpdate) onActivityUpdate();
    } catch (error) {
      console.error('Error cancelling task:', error);
      showToast('Failed to cancel task', 'error');
    }
  };

  // Navigation to related entity
  const handleNavigateToEntity = (activity) => {
    if (activity.related_entity_type === 'lead' && activity.lead_id) {
      navigate(`/leads?leadId=${activity.lead_id}`);
    } else if (activity.related_entity_type === 'customer' && activity.customer_uid) {
      navigate(`/customers?customerId=${activity.customer_uid}`);
    }
  };

  // Get activity type label
  const getActivityTypeLabel = (type, category) => {
    const option = activityOptions.allActivityTypes.find(opt => opt.value === type);
    return option ? option.label : type;
  };

  // Get category badge style (dark theme)
  const getCategoryBadgeStyle = (category) => {
    switch (category) {
      case 'manual':
        return 'bg-blue-600 text-white';
      case 'system':
        return 'bg-green-600 text-white';
      case 'automated':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  // Get status badge style (dark theme)
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
        return 'bg-gray-700 text-gray-300';
    }
  };

  // Get priority badge style (dark theme)
  const getPriorityBadgeStyle = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-highlight2 text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      case 'low':
        return 'bg-highlight5 text-white';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <span className="ml-1 text-gray-500">↑↓</span>;
    }
    
    return sortDirection === 'asc' 
      ? <span className="ml-1 text-highlight1">↑</span>
      : <span className="ml-1 text-highlight1">↓</span>;
  };

  // Handle pagination click
  const handlePaginationClick = (page) => {
    if (isEmbedded) {
      loadActivities(page);
    } else if (onPageChange) {
      onPageChange(page);
    }
  };

  if (displayActivities.length === 0 && !displayLoading) {
    return (
      <div className="bg-background border border-gray-700 rounded-lg p-8 text-center">
        <p className="text-gray-400">No activities found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters - only show if enabled and embedded */}
      {showFilters && isEmbedded && (
        <div className="bg-background border border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 bg-background text-text rounded-md focus:outline-none focus:ring-2 focus:ring-highlight1"
              >
                <option value="">All Categories</option>
                {activityOptions.activityCategories.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 bg-background text-text rounded-md focus:outline-none focus:ring-2 focus:ring-highlight1"
              >
                <option value="">All Types</option>
                {activityOptions.allActivityTypes.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 bg-background text-text rounded-md focus:outline-none focus:ring-2 focus:ring-highlight1"
              >
                <option value="">All Statuses</option>
                {activityOptions.taskStatuses.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 bg-background text-text rounded-md focus:outline-none focus:ring-2 focus:ring-highlight1"
              >
                <option value="">All Priorities</option>
                {activityOptions.priorities.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Assigned To
              </label>
              <input
                type="text"
                value={filters.assigned_to}
                onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
                placeholder="Filter by assignee"
                className="w-full px-3 py-2 border border-gray-600 bg-background text-text rounded-md focus:outline-none focus:ring-2 focus:ring-highlight1"
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center text-text">
                <input
                  type="checkbox"
                  checked={filters.overdue_only}
                  onChange={(e) => handleFilterChange('overdue_only', e.target.checked)}
                  className="mr-2"
                />
                Overdue Only
              </label>
              <label className="flex items-center text-text">
                <input
                  type="checkbox"
                  checked={filters.tasks_only}
                  onChange={(e) => handleFilterChange('tasks_only', e.target.checked)}
                  className="mr-2"
                />
                Tasks Only
              </label>
            </div>
          </div>
          
          <button
            onClick={clearFilters}
            className="text-sm text-gray-400 hover:text-text"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Activity Table */}
      <div className="bg-background border border-gray-700 rounded-lg overflow-hidden" style={{ height: '600px', width: '100%' }}>
        <div className="h-full overflow-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800 sticky top-0 z-10">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700 min-w-[150px]"
                  onClick={() => handleSort('date_created')}
                >
                  Date Created
                  {getSortIcon('date_created')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">
                  Category
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700 min-w-[120px]"
                  onClick={() => handleSort('activity_type')}
                >
                  Type
                  {getSortIcon('activity_type')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[200px]">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[150px]">
                  Related To
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">
                  Assigned To
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[150px]">
                  Due Date
                </th>
                {showActions && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {displayLoading ? (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-gray-400">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-highlight1"></div>
                      <span className="ml-3">Loading activities...</span>
                    </div>
                  </td>
                </tr>
              ) : displayActivities.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-gray-400">
                    No activities found
                  </td>
                </tr>
              ) : (
                displayActivities.map((activity, index) => (
                  <tr
                    key={activity.activity_id}
                    className={`transition-colors hover:bg-gray-800 ${
                      index % 2 === 0 ? 'bg-background' : 'bg-gray-900'
                    }`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[150px]">
                      <div className="truncate" title={formatDate(activity.date_created)}>
                        {formatDate(activity.date_created)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap min-w-[120px]">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeStyle(activity.activity_category)}`}>
                        {activity.activity_category}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[120px]">
                      <div className="truncate" title={getActivityTypeLabel(activity.activity_type, activity.activity_category)}>
                        {getActivityTypeLabel(activity.activity_type, activity.activity_category)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-text min-w-[200px]">
                      <div className="truncate" title={activity.description}>
                        {activity.description}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[150px]">
                      <button
                        onClick={() => handleNavigateToEntity(activity)}
                        className="text-left truncate hover:text-highlight1 transition-colors cursor-pointer"
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
                    <td className="px-4 py-4 whitespace-nowrap min-w-[100px]">
                      {activity.status && (
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(activity.status)}`}>
                          {activity.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap min-w-[100px]">
                      {activity.priority && (
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeStyle(activity.priority)}`}>
                          {activity.priority}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[120px]">
                      <div className="truncate" title={activity.assigned_to}>
                        {activity.assigned_to}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[150px]">
                      {activity.due_date && (
                        <div className={`truncate ${activity.is_overdue ? 'text-highlight2 font-semibold' : ''}`} title={formatDate(activity.due_date)}>
                          {formatDate(activity.due_date)}
                        </div>
                      )}
                    </td>
                    {showActions && (
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-text min-w-[120px]">
                        {activity.is_task && activity.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleCompleteTask(activity.activity_id)}
                              className="text-highlight5 hover:text-green-400 font-medium text-xs"
                              title="Complete Task"
                            >
                              ✓ Complete
                            </button>
                            <button
                              onClick={() => handleCancelTask(activity.activity_id)}
                              className="text-highlight2 hover:text-red-400 font-medium text-xs"
                              title="Cancel Task"
                            >
                              ✗ Cancel
                            </button>
                          </div>
                        )}
                        {activity.is_task && activity.status === 'in_progress' && (
                          <button
                            onClick={() => handleCompleteTask(activity.activity_id)}
                            className="text-highlight5 hover:text-green-400 font-medium text-xs"
                            title="Complete Task"
                          >
                            ✓ Complete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - only show if enabled and has multiple pages */}
        {showPagination && (displayPagination.totalPages || displayPagination.pages || 1) > 1 && (
          <div className="bg-background px-4 py-3 flex items-center justify-between border-t border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePaginationClick((displayPagination.currentPage || displayPagination.current_page || 1) - 1)}
                disabled={(displayPagination.currentPage || displayPagination.current_page || 1) === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-text bg-background hover:bg-gray-800 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePaginationClick((displayPagination.currentPage || displayPagination.current_page || 1) + 1)}
                disabled={(displayPagination.currentPage || displayPagination.current_page || 1) === (displayPagination.totalPages || displayPagination.pages || 1)}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-text bg-background hover:bg-gray-800 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  Showing{' '}
                  <span className="font-medium text-text">
                    {((displayPagination.currentPage || displayPagination.current_page || 1) - 1) * (displayPagination.perPage || displayPagination.per_page || 20) + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium text-text">
                    {Math.min((displayPagination.currentPage || displayPagination.current_page || 1) * (displayPagination.perPage || displayPagination.per_page || 20), (displayPagination.totalItems || displayPagination.total || 0))}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-text">{displayPagination.totalItems || displayPagination.total || 0}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {[...Array(displayPagination.totalPages || displayPagination.pages || 1)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePaginationClick(index + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        (displayPagination.currentPage || displayPagination.current_page || 1) === index + 1
                          ? 'z-10 bg-highlight1 border-highlight1 text-white'
                          : 'bg-background border-gray-600 text-gray-400 hover:bg-gray-800'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityList;
