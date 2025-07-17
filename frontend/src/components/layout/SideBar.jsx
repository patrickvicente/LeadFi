// src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  ChartBarIcon,
  ClockIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const location = useLocation();
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
      <div className="h-16 flex items-center justify-center border-b border-gray-800">
        <h1 className="text-2xl font-bold text-highlight1 tracking-wide">LeadFi</h1>
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
      <div className="h-8" /> {/* Spacer for bottom padding */}
    </aside>
  );
};

export default Sidebar;