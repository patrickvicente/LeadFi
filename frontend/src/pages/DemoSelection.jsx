import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DemoUserSelector from '../components/auth/DemoUserSelector';
import { useUser } from '../contexts/UserContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Toast from '../components/common/Toast';

const DemoSelection = () => {
  const { login } = useUser();
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Check if demo mode is active
  const isDemoMode = localStorage.getItem('demoMode') === 'true';

  // Redirect if demo mode is not active
  useEffect(() => {
    if (!isDemoMode) {
      navigate('/demo');
    }
  }, [isDemoMode, navigate]);

  const handleUserSelect = (user) => {
    try {
      const success = login(user);
      if (success) {
        setToastMessage(`Welcome, ${user.name}! Redirecting to dashboard...`);
        setToastType('success');
        setShowToast(true);
        
        // Redirect to dashboard after user selection
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setToastMessage('Failed to login. Please try again.');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error during user selection:', error);
      setToastMessage('An unexpected error occurred. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  if (!isDemoMode) {
    return null; // Will redirect to /demo
  }

  return (
    <ErrorBoundary>
      <div className="demo-selection-page">
        <DemoUserSelector onUserSelect={handleUserSelect} />
        
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

export default DemoSelection;