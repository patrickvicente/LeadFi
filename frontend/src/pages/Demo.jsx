import React, { useState } from 'react';
import { useDemo } from '../contexts/DemoContext';
import { useToast } from '../hooks/useToast';
import {
  ChartBarIcon,
  UserGroupIcon,
  UsersIcon,
  ClockIcon,
  PresentationChartLineIcon,
  RocketLaunchIcon,
  PlayIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const Demo = () => {
  const { startDemo, isLoading } = useDemo();
  const { showToast } = useToast();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartDemo = async () => {
    setIsStarting(true);
    const result = await startDemo();
    
    if (result.success) {
      showToast(result.message, 'success');
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } else {
      showToast(result.message, 'error');
    }
    setIsStarting(false);
  };

  const features = [
    {
      icon: UserGroupIcon,
      title: 'Lead Management',
      description: 'Multi-source lead acquisition with 7-stage sales pipeline',
      color: 'text-blue-500'
    },
    {
      icon: UsersIcon,
      title: 'Customer Conversion',
      description: 'Seamless lead-to-customer conversion with trading analytics',
      color: 'text-green-500'
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics Dashboard',
      description: 'Comprehensive trading performance and conversion analytics',
      color: 'text-purple-500'
    },
    {
      icon: ClockIcon,
      title: 'Activity Tracking',
      description: 'Task management and activity monitoring for sales teams',
      color: 'text-orange-500'
    },
    {
      icon: PresentationChartLineIcon,
      title: 'Trading Volume',
      description: 'Real-time trading volume analysis with maker/taker breakdown',
      color: 'text-red-500'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Role-Based Access',
      description: 'Secure RBAC system with different permission levels',
      color: 'text-indigo-500'
    }
  ];

  const demoData = [
    { label: 'Leads', value: '300+', description: '6 months of realistic data' },
    { label: 'Customers', value: '50+', description: 'Converted leads with trading history' },
    { label: 'Activities', value: '1,200+', description: 'Sales activities and tasks' },
    { label: 'Trading Volume', value: '$2.5M+', description: 'Realistic trading data' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-highlight1/10 p-4 rounded-full">
                <RocketLaunchIcon className="h-16 w-16 text-highlight1" />
              </div>
            </div>
            
            <h1 className="text-5xl font-bold text-white mb-6">
              Welcome to <span className="text-highlight1">LeadFi CRM</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Experience the future of crypto CRM with our comprehensive demo featuring 
              real trading data, role-based access control, and advanced analytics.
            </p>

            <div className="flex justify-center gap-4 mb-12">
              <button
                onClick={handleStartDemo}
                disabled={isStarting || isLoading}
                className="flex items-center gap-2 bg-highlight1 hover:bg-highlight1/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStarting || isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Starting Demo...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-5 w-5" />
                    Start Demo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Data Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Demo Environment Overview
          </h2>
          <p className="text-gray-300">
            Explore LeadFi CRM with realistic data and full functionality
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {demoData.map((item, index) => (
            <div key={index} className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 text-center border border-gray-700">
              <div className="text-3xl font-bold text-highlight1 mb-2">{item.value}</div>
              <div className="text-white font-semibold mb-1">{item.label}</div>
              <div className="text-sm text-gray-400">{item.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Key Features
          </h2>
          <p className="text-gray-300">
            Discover what makes LeadFi CRM the ultimate crypto trading platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-highlight1/50 transition-all duration-200">
              <div className={`${feature.color} mb-4`}>
                <feature.icon className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Users */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Demo Users Available
          </h2>
          <p className="text-gray-300">
            Experience different permission levels and roles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { role: 'Admin', name: 'Admin User', email: 'admin@leadfi.com', permissions: 'Full access + system activities' },
            { role: 'Manager', name: 'Sarah Johnson', email: 'sarah.johnson@leadfi.com', permissions: 'Full access + team management' },
            { role: 'Senior BD', name: 'Alex Chen', email: 'alex.chen@leadfi.com', permissions: 'All leads + customers + activities' },
            { role: 'Demo User', name: 'Demo User', email: 'demo@leadfi.com', permissions: 'Read-only access' }
          ].map((user, index) => (
            <div key={index} className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <div className="text-highlight1 font-semibold mb-2">{user.role}</div>
              <div className="text-white font-medium mb-1">{user.name}</div>
              <div className="text-gray-400 text-sm mb-3">{user.email}</div>
              <div className="text-xs text-gray-500">{user.permissions}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-highlight1/20 to-purple-600/20 rounded-2xl p-12 text-center border border-highlight1/30">
          <BoltIcon className="h-16 w-16 text-highlight1 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Experience LeadFi CRM?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Start the demo now and explore all features with realistic data. 
            No registration required - just click and start exploring!
          </p>
          <button
            onClick={handleStartDemo}
            disabled={isStarting || isLoading}
            className="bg-highlight1 hover:bg-highlight1/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting || isLoading ? 'Starting Demo...' : 'Start Demo Now'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-400">
          <p>LeadFi CRM Demo Environment • Built for Crypto Trading Platforms</p>
        </div>
      </div>
    </div>
  );
};

export default Demo; 