import React from 'react';
import { PlayIcon, XMarkIcon } from '@heroicons/react/24/outline';

const DemoBanner = () => {
  // Check if demo mode is active
  const isDemoMode = localStorage.getItem('demoMode') === 'true';

  if (!isDemoMode) {
    return null;
  }

  const handleExitDemo = () => {
    localStorage.removeItem('demoMode');
    localStorage.removeItem('leadfi_demo_session');
    window.location.href = '/demo';
  };

  return (
    <div className="bg-gradient-to-r from-highlight1/20 to-purple-600/20 border-b border-highlight1/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-highlight1">
              <PlayIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Demo Mode Active</span>
            </div>
            <div className="text-sm text-gray-300">
              You're exploring LeadFi CRM with demo data. All changes are for demonstration purposes.
            </div>
          </div>
          
          <button
            onClick={handleExitDemo}
            className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
          >
            <XMarkIcon className="h-3 w-3" />
            Exit Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoBanner; 