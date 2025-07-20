// src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDemo } from '../../contexts/DemoContext';
import {
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  ChartBarIcon,
  ClockIcon,
  PresentationChartLineIcon,
  XMarkIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const location = useLocation();
  const { isDemoMode, demoUser, stopDemo } = useDemo();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Leads', href: '/leads', icon: UserGroupIcon },
    { name: 'Customers', href: '/customers', icon: UsersIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Activity', href: '/activity', icon: ClockIcon },
    { name: 'Trading Volume', href: '/trading-volume', icon: PresentationChartLineIcon },
  ];

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-background border-r border-gray-800 shadow-lg z-40 flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-gray-800 relative">
        <h1 className="text-2xl font-bold text-highlight1 tracking-wide">LeadFi</h1>
        
        {/* Demo Mode Indicator */}
        {isDemoMode && (
          <div className="absolute top-2 right-2">
            <div className="bg-highlight1/20 text-highlight1 text-xs px-2 py-1 rounded-full border border-highlight1/30 flex items-center gap-1">
              <PlayIcon className="h-3 w-3" />
              DEMO
            </div>
          </div>
        )}
      </div>

      {/* Demo User Info */}
      {isDemoMode && demoUser && (
        <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/30">
          <div className="text-sm text-gray-300 mb-1">Demo User</div>
          <div className="text-white font-medium text-sm">{demoUser.name}</div>
          <div className="text-xs text-gray-400">{demoUser.email}</div>
          <div className="text-xs text-highlight1 mt-1 capitalize">{demoUser.role}</div>
        </div>
      )}

      <nav className="flex-1 mt-5 flex flex-col gap-1 px-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors text-base
                ${isActive ? 'bg-highlight1 text-white shadow' : 'text-text hover:bg-gray-800 hover:text-highlight1'}
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-highlight1'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Demo Controls */}
      {isDemoMode && (
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={stopDemo}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
          >
            <XMarkIcon className="h-4 w-4" />
            Exit Demo
          </button>
          <div className="text-xs text-gray-500 text-center mt-2">
            Demo data will be preserved
          </div>
        </div>
      )}

      <div className="h-8" /> {/* Spacer for bottom padding */}
    </aside>
  );
};

export default Sidebar;