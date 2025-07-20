// src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  ChartBarIcon,
  ClockIcon,
  PresentationChartLineIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import UserSwitcher from '../auth/UserSwitcher';

const Sidebar = () => {
  const location = useLocation();
  
  // Check if demo mode is active
  const isDemoMode = localStorage.getItem('demoMode') === 'true';
  
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

      {/* User Switcher at bottom center */}
      {isDemoMode && (
        <div className="p-4 border-t border-gray-800 flex justify-center">
          <UserSwitcher />
        </div>
      )}

      <div className="h-4" /> {/* Spacer for bottom padding */}
    </aside>
  );
};

export default Sidebar;