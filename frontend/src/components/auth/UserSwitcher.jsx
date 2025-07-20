import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, UserIcon } from '@heroicons/react/24/outline';
import { useUser } from '../../contexts/UserContext';
import { DEMO_USERS } from '../../constants/demoUsers';
import ErrorBoundary from '../common/ErrorBoundary';
import Toast from '../common/Toast';

const UserSwitcher = () => {
  const { user, switchUser, logout } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserSwitch = (newUser) => {
    try {
      const success = switchUser(newUser);
      if (success) {
        setToastMessage(`Switched to ${newUser.name}`);
        setToastType('success');
        setShowToast(true);
        setIsOpen(false);
      } else {
        setToastMessage('Failed to switch user. Please try again.');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error switching user:', error);
      setToastMessage('An unexpected error occurred.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleLogout = () => {
    try {
      const success = logout();
      if (success) {
        setToastMessage('Logged out successfully');
        setToastType('success');
        setShowToast(true);
        setIsOpen(false);
        // Redirect to landing page
        window.location.href = '/';
      } else {
        setToastMessage('Failed to logout. Please try again.');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error during logout:', error);
      setToastMessage('An unexpected error occurred.');
      setToastType('error');
      setShowToast(true);
    }
  };

  if (!user) return null;

  return (
    <ErrorBoundary>
      <div className="relative" ref={dropdownRef}>
        {/* Current User Button - Compact for sidebar */}
        <button 
          className="
            flex items-center gap-2 px-3 py-2 
            bg-background border border-gray-700 rounded-lg
            hover:bg-gray-800 hover:border-gray-600
            transition-colors duration-200
            min-w-[200px]
          "
          onClick={() => setIsOpen(!isOpen)}
        >
          <div 
            className={`
              w-6 h-6 rounded-full flex items-center justify-center
              text-white text-xs font-semibold
              ${user.color.startsWith('highlight') ? `bg-${user.color}` : `bg-${user.color}`}
            `}
          >
            {user.name.charAt(0)}
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-sm font-medium text-text truncate">{user.name}</div>
            <div className="text-xs text-gray-400 truncate">{user.role}</div>
          </div>
          <ChevronDownIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="
            absolute bottom-full left-0 mb-2 w-56 
            bg-background border border-gray-700 rounded-lg shadow-xl
            z-50
          ">
            {/* Current User Info */}
            <div className="p-3 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <div 
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    text-white text-sm font-semibold
                    ${user.color.startsWith('highlight') ? `bg-${user.color}` : `bg-${user.color}`}
                  `}
                >
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-text truncate">{user.name}</div>
                  <div className="text-xs text-gray-400 truncate">{user.email}</div>
                </div>
              </div>
            </div>

            {/* Switch User Options */}
            <div className="py-1">
              <div className="px-3 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Switch User
              </div>
              {DEMO_USERS.map((demoUser) => (
                <button
                  key={demoUser.id}
                  className="
                    w-full flex items-center gap-2 px-3 py-2
                    hover:bg-gray-800 transition-colors duration-200
                    text-left
                  "
                  onClick={() => handleUserSwitch(demoUser)}
                >
                  <div 
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center
                      text-white text-xs font-semibold
                      ${demoUser.color.startsWith('highlight') ? `bg-${demoUser.color}` : `bg-${demoUser.color}`}
                    `}
                  >
                    {demoUser.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text truncate">{demoUser.name}</div>
                    <div className="text-xs text-gray-400 truncate">{demoUser.role}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Logout */}
            <div className="border-t border-gray-700">
              <button
                className="
                  w-full flex items-center gap-2 px-3 py-2
                  hover:bg-red-600/20 text-red-400 hover:text-red-300
                  transition-colors duration-200
                "
                onClick={handleLogout}
              >
                <UserIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        <Toast
          message={toastMessage}
          isVisible={showToast}
          onClose={() => setShowToast(false)}
          type={toastType}
          duration={3000}
        />
      </div>
    </ErrorBoundary>
  );
};

export default UserSwitcher;