import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import ActivityList from '../components/activity/ActivityList';
import ActivityTaskModal from '../components/activity/ActivityTaskModal';
import { useToast } from '../hooks/useToast';
import { useServerSorting } from '../utils/useServerSorting';
import api from '../services/api';

const Activity = () => {
  const [activeTab, setActiveTab] = useState('all_activities');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('activity');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  // Pagination state (consistent with Leads/Customers)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 20,
    totalPages: 1,
    totalItems: 0
  });

  // Tab configuration with task-specific filters
  const tabs = [
    { 
      key: 'all_activities', 
      label: 'All Activities',
      filters: {} // No filters - show everything
    },
    { 
      key: 'due_today', 
      label: 'Due Today',
      filters: { 
        tasks_only: true, 
        status: 'pending',
        due_date_filter: 'today'
      }
    },
    { 
      key: 'overdue', 
      label: 'Overdue',
      filters: { 
        tasks_only: true, 
        overdue_only: true 
      }
    },
    { 
      key: 'in_progress', 
      label: 'In Progress',
      filters: { 
        tasks_only: true, 
        status: 'in_progress' 
      }
    },
    { 
      key: 'completed', 
      label: 'Completed',
      filters: { 
        status: 'completed' 
      }
    }
  ];

  // Server-side sorting hook (without callback to avoid circular dependency)
  const { sortField, sortDirection, handleSort, getSortParams } = useServerSorting();

  const activeTabConfig = tabs.find(tab => tab.key === activeTab);

  // Fetch activities (moved from ActivityList to page level)
  const fetchActivities = async (page = pagination.currentPage, tabFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: pagination.perPage,
        sort_by: sortField,
        sort_order: sortDirection,
        ...tabFilters
      };

      const response = await api.activity.getActivities(params);
      
      setActivities(response.activities || []);
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        totalPages: response.pages || 1,
        totalItems: response.total || 0
      }));
    } catch (error) {
      console.error('Error loading activities:', error);
      setError('Failed to load activities');
      showToast('Failed to load activities', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and when tab changes
  useEffect(() => {
    const tabConfig = tabs.find(tab => tab.key === activeTab);
    fetchActivities(1, tabConfig?.filters || {});
  }, [activeTab]);

  // Handle sorting changes
  useEffect(() => {
    if (sortField) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      const tabConfig = tabs.find(tab => tab.key === activeTab);
      fetchActivities(1, tabConfig?.filters || {});
    }
  }, [sortField, sortDirection]);

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    const tabConfig = tabs.find(tab => tab.key === activeTab);
    fetchActivities(newPage, tabConfig?.filters || {});
  };

  const handlePerPageChange = (newPerPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      perPage: newPerPage
    }));
    const tabConfig = tabs.find(tab => tab.key === activeTab);
    fetchActivities(1, tabConfig?.filters || {});
  };

  // Handle activity/task creation
  const handleSuccess = () => {
    const tabConfig = tabs.find(tab => tab.key === activeTab);
    fetchActivities(pagination.currentPage, tabConfig?.filters || {});
    setShowModal(false);
    showToast(`${modalMode === 'task' ? 'Task' : 'Activity'} ${modalMode === 'task' ? 'created' : 'logged'} successfully!`, 'success');
  };

  // Handle task updates (completion, etc.)
  const handleTaskUpdate = () => {
    const tabConfig = tabs.find(tab => tab.key === activeTab);
    fetchActivities(pagination.currentPage, tabConfig?.filters || {});
  };

  const openModal = (mode = 'activity') => {
    setModalMode(mode);
    setShowModal(true);
  };

  return (
    <div className="p-6">
      {/* Main Header - consistent with Leads/Customers */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Activities & Tasks</h1>
          <p className="text-gray-400 mt-1">
            Manage your activities and track tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal('activity')}
            className="flex items-center gap-2 bg-highlight1 hover:bg-highlight1/80 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Log Activity
          </button>
          <button
            onClick={() => openModal('task')}
            className="flex items-center gap-2 bg-highlight3 hover:bg-highlight3/80 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <ClipboardDocumentListIcon className="h-5 w-5" />
            Create Task
          </button>
        </div>
      </div>

      {/* Tab Navigation with Horizontal Scrolling */}
      <div className="bg-background border border-gray-700 rounded-lg mb-6">
        <div className="border-b border-gray-700">
          <div className="overflow-x-auto">
            <nav className="flex space-x-8 px-6 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'border-highlight1 text-highlight1'
                      : 'border-transparent text-gray-400 hover:text-text hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => {
              const tabConfig = tabs.find(tab => tab.key === activeTab);
              fetchActivities(pagination.currentPage, tabConfig?.filters || {});
            }}
            className="mt-2 text-red-300 hover:text-red-200 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Activity List - now receives data as props */}
      <ActivityList 
        activities={activities}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onActivityUpdate={handleTaskUpdate}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        showFilters={false} // Filters handled by tabs
        showActions={true}
        showPagination={false} // Handle pagination in parent component
      />

      {/* Pagination UI - consistent with Leads/Customers */}
      {!loading && (
        <div className="mt-4 flex items-center justify-between bg-background p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400">
            Showing {activities.length} of {pagination.totalItems} {
              activeTab === 'all_activities' ? 'activities' : 
              activeTab === 'completed' ? 'completed activities' : 'tasks'
            }
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={pagination.perPage}
              onChange={(e) => handlePerPageChange(Number(e.target.value))}
              className="border border-gray-600 bg-background text-text rounded px-2 py-1 focus:border-highlight1"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
            <div className="flex space-x-1">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border border-gray-600 bg-background text-text rounded disabled:opacity-50 hover:bg-gray-800 transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-text">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-600 bg-background text-text rounded disabled:opacity-50 hover:bg-gray-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity/Task Modal */}
      <ActivityTaskModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        mode={modalMode}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default Activity;