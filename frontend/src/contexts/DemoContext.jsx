import React, { createContext, useContext, useState } from 'react';

const DemoContext = createContext();

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};

export const DemoProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  const startDemo = async () => {
    setIsLoading(true);
    try {
      // Initialize demo environment using the existing endpoint
      const response = await fetch('/api/init-db?mode=full_demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize demo environment');
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        // Set demo mode but DON'T set user - let UserContext handle that
        localStorage.setItem('demoMode', 'true');
        
        return { 
          success: true, 
          message: 'Demo environment ready! Please select a user role.',
          demoData: result.demo_setup || result
        };
      } else {
        throw new Error(result.message || 'Demo initialization failed');
      }
    } catch (error) {
      console.error('Demo initialization error:', error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const stopDemo = () => {
    localStorage.removeItem('demoMode');
    // Redirect to demo landing page
    window.location.href = '/demo';
  };

  const value = {
    isLoading,
    startDemo,
    stopDemo,
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}; 