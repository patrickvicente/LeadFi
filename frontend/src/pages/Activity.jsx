import React, { useState, useEffect } from 'react';
import { PlusIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import ActivityList from '../components/activity/ActivityList';
import ActivityTaskModal from '../components/activity/ActivityTaskModal';
import { useToast } from '../hooks/useToast';

const Activity = () => {
  const [activeTab, setActiveTab] = useState('due_today');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('activity');
  const [refreshKey, setRefreshKey] = useState(0);
  const { showToast } = useToast();

  // Handle activity/task creation
  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setShowModal(false);
    showToast(`${modalMode === 'task' ? 'Task' : 'Activity'} ${modalMode === 'task' ? 'created' : 'logged'} successfully!`, 'success');
  };

  // Handle task updates (completion, etc.)
  const handleTaskUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  const openModal = (mode = 'activity') => {
    setModalMode(mode);
    setShowModal(true);
  };

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
        tasks_only: true, 
        status: 'completed' 
      }
    }
  ];

  const activeTabConfig = tabs.find(tab => tab.key === activeTab);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Tasks</h1>
          <p className="text-gray-400 mt-1">
            Manage and track your tasks
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

      {/* Tab Navigation */}
      <div className="bg-background border border-gray-700 rounded-lg">
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 px-6">
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

        {/* Tab Content */}
        <div className="p-6">
          <ActivityList 
            key={`${activeTab}-${refreshKey}`}
            showFilters={false}
            showActions={true}
            onActivityUpdate={handleTaskUpdate}
            defaultFilters={activeTabConfig?.filters || {}}
          />
        </div>
      </div>

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