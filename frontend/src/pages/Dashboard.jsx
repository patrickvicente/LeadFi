import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { leadApi, customerApi, activityApi, analyticsApi } from '../services/api';
import { formatDate } from '../utils/dateFormat';
import { ClockIcon, UserIcon, BuildingOfficeIcon, CheckCircleIcon, ExclamationTriangleIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    tasksForToday: [],
    myLeads: [],
    myCustomers: [],
    recentActivities: [],
    overdueTasks: [],
    quickStats: {
      totalLeads: 0,
      totalCustomers: 0,
      pendingTasks: 0,
      completedToday: 0
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Get today's date for task filtering
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch tasks for today
        const todayTasks = await activityApi.getTasks({
          tasks_only: 'true',
          status: 'pending',
          due_date: today
        });

        // Fetch overdue tasks
        const overdueTasks = await activityApi.getOverdueTasks({
          tasks_only: 'true',
          status: 'pending'
        });

        // Fetch user's leads (filtered by bd_in_charge)
        const myLeads = await leadApi.getLeads({
          bd_in_charge: user.name,
          per_page: 5
        });

        // Fetch user's customers (filtered by bd_in_charge)
        const myCustomers = await customerApi.getCustomers({
          bd_in_charge: user.name,
          per_page: 5
        });

        // Fetch recent activities for user's leads
        const recentActivities = await activityApi.getActivities({
          bd_in_charge: user.name,
          per_page: 5,
          sort_by: 'date_created',
          sort_order: 'desc'
        });

        // Fetch quick stats
        const allLeads = await leadApi.getLeads({ bd_in_charge: user.name });
        const allCustomers = await customerApi.getCustomers({ bd_in_charge: user.name });
        const allTasks = await activityApi.getTasks({ 
          tasks_only: 'true',
          status: 'pending',
          assigned_to: user.name
        });
        const completedToday = await activityApi.getActivities({
          status: 'completed',
          date_completed: today,
          assigned_to: user.name
        });

        setDashboardData({
          tasksForToday: todayTasks.activities || [],
          myLeads: myLeads.leads || [],
          myCustomers: myCustomers.customer || [],
          recentActivities: recentActivities.activities || [],
          overdueTasks: overdueTasks.activities || [],
          quickStats: {
            totalLeads: allLeads.total || 0,
            totalCustomers: allCustomers.total || 0,
            pendingTasks: allTasks.total || 0,
            completedToday: completedToday.total || 0
          }
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getFirstName = (fullName) => {
    return fullName ? fullName.split(' ')[0] : 'User';
  };

  const getTaskPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getTaskPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight1"></div>
          <span className="ml-4 text-white">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {getFirstName(user?.name)}! 👋
        </h1>
        <p className="text-gray-400">
          Here's what's happening with your leads and customers today
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-background border border-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <UserIcon className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-gray-400 text-sm">My Leads</p>
              <p className="text-2xl font-bold text-white">{dashboardData.quickStats.totalLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-background border border-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-gray-400 text-sm">My Customers</p>
              <p className="text-2xl font-bold text-white">{dashboardData.quickStats.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-background border border-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-gray-400 text-sm">Pending Tasks</p>
              <p className="text-2xl font-bold text-white">{dashboardData.quickStats.pendingTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-background border border-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-gray-400 text-sm">Completed Today</p>
              <p className="text-2xl font-bold text-white">{dashboardData.quickStats.completedToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Tasks for Today - Left Column */}
        <div className="space-y-6">
          {/* Tasks for Today */}
          <div className="bg-background border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-blue-400" />
                Tasks for Today
              </h2>
              <span className="text-sm text-gray-400">
                {dashboardData.tasksForToday.length} tasks
              </span>
            </div>
            
            {dashboardData.tasksForToday.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No tasks scheduled for today</p>
            ) : (
              <div className="space-y-3">
                {dashboardData.tasksForToday.map((task) => (
                  <div key={task.activity_id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                      <span className="mr-2">{getTaskPriorityIcon(task.priority)}</span>
                      <div>
                        <p className="text-white font-medium">{task.description}</p>
                        <p className="text-sm text-gray-400">
                          Due: {formatDate(task.due_date)} • {task.lead?.full_name || 'No lead'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${getTaskPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overdue Tasks */}
          {dashboardData.overdueTasks.length > 0 && (
            <div className="bg-background border border-red-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-400" />
                  Overdue Tasks
                </h2>
                <span className="text-sm text-red-400">
                  {dashboardData.overdueTasks.length} overdue
                </span>
              </div>
              
              <div className="space-y-3">
                {dashboardData.overdueTasks.slice(0, 3).map((task) => (
                  <div key={task.activity_id} className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="flex items-center">
                      <span className="mr-2">🔴</span>
                      <div>
                        <p className="text-white font-medium">{task.description}</p>
                        <p className="text-sm text-red-400">
                          Due: {formatDate(task.due_date)} • {task.lead?.full_name || 'No lead'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-red-400">
                      Overdue
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* My Leads */}
          <div className="bg-background border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-blue-400" />
                My Recent Leads
              </h2>
              <span className="text-sm text-gray-400">
                {dashboardData.quickStats.totalLeads} total
              </span>
            </div>
            
            {dashboardData.myLeads.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No leads assigned to you</p>
            ) : (
              <div className="space-y-3">
                {dashboardData.myLeads.map((lead) => (
                  <div key={lead.lead_id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{lead.full_name}</p>
                      <p className="text-sm text-gray-400">
                        {lead.company_name} • {lead.status}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      lead.status === 'closed won' ? 'bg-green-500/20 text-green-400' :
                      lead.status === 'lost' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Customers */}
          <div className="bg-background border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-green-400" />
                My Customers
              </h2>
              <span className="text-sm text-gray-400">
                {dashboardData.quickStats.totalCustomers} total
              </span>
            </div>
            
            {dashboardData.myCustomers.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No customers assigned to you</p>
            ) : (
              <div className="space-y-3">
                {dashboardData.myCustomers.map((customer) => (
                  <div key={customer.customer_uid} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{customer.name}</p>
                      <p className="text-sm text-gray-400">
                        ID: {customer.customer_uid} • {customer.type}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      customer.is_closed ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {customer.is_closed ? 'Closed' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activities */}
          <div className="bg-background border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2 text-purple-400" />
                Recent Activities
              </h2>
            </div>
            
            {dashboardData.recentActivities.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No recent activities</p>
            ) : (
              <div className="space-y-3">
                {dashboardData.recentActivities.map((activity) => (
                  <div key={activity.activity_id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{activity.description}</p>
                      <p className="text-sm text-gray-400">
                        {formatDate(activity.date_created)} • {activity.lead?.full_name || 'No lead'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activity.activity_category === 'system' ? 'bg-purple-500/20 text-purple-400' :
                      activity.activity_category === 'manual' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {activity.activity_category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;