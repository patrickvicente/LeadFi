import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import ErrorBoundary from '../common/ErrorBoundary';
import Toast from '../common/Toast';

const AuthGuard = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('warning');

  // Check if demo mode is active
  const isDemoMode = localStorage.getItem('demoMode') === 'true';

  // Public routes that don't require authentication
  const publicRoutes = ['/demo', '/demo-selection'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  useEffect(() => {
    const checkAuth = () => {
      // If still loading, wait
      if (isLoading) return;

      // If on public route, allow access
      if (isPublicRoute) return;

      // If not authenticated and not in demo mode, redirect to demo
      if (!isAuthenticated && !isDemoMode) {
        setToastMessage('Please start a demo session to access the application.');
        setToastType('warning');
        setShowToast(true);
        
        // Redirect to demo page
        setTimeout(() => {
          navigate('/demo', { replace: true });
        }, 2000);
        return;
      }

      // If in demo mode but no user selected, redirect to user selection
      if (isDemoMode && !user) {
        setToastMessage('Please select a demo user to continue.');
        setToastType('info');
        setShowToast(true);
        
        // Redirect to user selection
        setTimeout(() => {
          navigate('/demo-selection', { replace: true });
        }, 2000);
        return;
      }
    };

    checkAuth();
  }, [isAuthenticated, isDemoMode, user, isLoading, isPublicRoute, navigate]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight1"></div>
          <p className="text-text">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not on public route, show redirect message
  if (!isAuthenticated && !isDemoMode && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight1 mx-auto mb-4"></div>
          <p className="text-text mb-2">Redirecting to demo...</p>
          <p className="text-gray-400 text-sm">Please wait while we redirect you to the demo page.</p>
        </div>
      </div>
    );
  }

  // If in demo mode but no user selected and not on user selection page
  if (isDemoMode && !user && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight1 mx-auto mb-4"></div>
          <p className="text-text mb-2">Redirecting to user selection...</p>
          <p className="text-gray-400 text-sm">Please wait while we redirect you to select a demo user.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {children}
      
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        type={toastType}
        duration={4000}
      />
    </ErrorBoundary>
  );
};

export default AuthGuard;