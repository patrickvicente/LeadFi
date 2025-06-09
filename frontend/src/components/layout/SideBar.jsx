// src/components/layout/Sidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HomeIcon, 
  UserGroupIcon, 
  UsersIcon, 
  ChartBarIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Leads', href: '/leads', icon: UserGroupIcon },
    { name: 'Customers', href: '/customers', icon: UsersIcon },
    { name: 'Trading Volume', href: '/trading', icon: ChartBarIcon },
    { name: 'Activity', href: '/activity', icon: ClockIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-lg">
        <div className="h-16 flex items-center justify-center border-b">
          <h1 className="text-xl font-bold text-gray-800">LeadFi</h1>
        </div>
        <nav className="mt-5">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              <item.icon className="h-6 w-6 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;