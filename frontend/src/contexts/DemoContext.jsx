import React, { createContext, useContext, useState, useEffect } from 'react';

const DemoContext = createContext();

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};

export const DemoProvider = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUser, setDemoUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if demo mode is active on mount
  useEffect(() => {
    const demoMode = localStorage.getItem('demoMode') === 'true';
    const demoUserData = localStorage.getItem('demoUser');
    
    if (demoMode && demoUserData) {
      setIsDemoMode(true);
      setDemoUser(JSON.parse(demoUserData));
    }
  }, []);

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
        // Set demo user (you can choose any from your RBAC setup)
        const demoUserData = {
          id: 1,
          name: 'Demo User',
          email: 'demo@leadfi.com',
          role: 'demo',
          permissions: ['read_only']
        };

        setIsDemoMode(true);
        setDemoUser(demoUserData);
        
        // Store in localStorage
        localStorage.setItem('demoMode', 'true');
        localStorage.setItem('demoUser', JSON.stringify(demoUserData));
        
        return { success: true, message: 'Demo mode activated successfully!' };
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
    setIsDemoMode(false);
    setDemoUser(null);
    localStorage.removeItem('demoMode');
    localStorage.removeItem('demoUser');
    // Redirect to demo landing page
    window.location.href = '/demo';
  };

  const value = {
    isDemoMode,
    demoUser,
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