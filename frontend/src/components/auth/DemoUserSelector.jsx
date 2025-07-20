import React, { useState } from 'react';
import { PlayIcon } from '@heroicons/react/24/outline';
import UserCard from './UserCard';
import { DEMO_USERS } from '../../constants/demoUsers';
import ErrorBoundary from '../common/ErrorBoundary';
import Toast from '../common/Toast';

const DemoUserSelector = ({ onUserSelect }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const handleUserSelect = (user) => {
    try {
      setSelectedUser(user);
    } catch (error) {
      console.error('Error selecting user:', error);
      setToastMessage('Failed to select user. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleContinue = () => {
    try {
      if (selectedUser) {
        onUserSelect(selectedUser);
      } else {
        setToastMessage('Please select a user to continue.');
        setToastType('warning');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error continuing with user:', error);
      setToastMessage('Failed to continue. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background via-gray-900 to-background">
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text mb-4">
              Who's using LeadFi?
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Choose your demo role to explore the CRM with different permission levels and access rights.
            </p>
          </div>
          
          {/* User Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {DEMO_USERS.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onSelect={handleUserSelect}
                isSelected={selectedUser?.id === user.id}
              />
            ))}
          </div>
          
          {/* Continue Button */}
          {selectedUser && (
            <div className="text-center">
              <button 
                className="
                  inline-flex items-center gap-3 px-8 py-4 
                  bg-highlight1 hover:bg-highlight1/90 
                  text-white font-semibold rounded-lg 
                  transition-colors duration-200 
                  shadow-lg hover:shadow-xl
                "
                onClick={handleContinue}
              >
                <PlayIcon className="w-5 h-5" />
                Continue as {selectedUser.name}
              </button>
            </div>
          )}
        </div>

        {/* Toast Notification */}
        <Toast
          message={toastMessage}
          isVisible={showToast}
          onClose={() => setShowToast(false)}
          type={toastType}
          duration={4000}
        />
      </div>
    </ErrorBoundary>
  );
};

export default DemoUserSelector;