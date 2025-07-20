import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import errorService from '../services/errorService';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserSession = () => {
      try {
        const sessionUser = authService.getCurrentUser();
        if (sessionUser) {
          setUser(sessionUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error loading user session:', error);
        errorService.handleAPIError(error, { operation: 'load_user_session' });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserSession();
  }, []);

  const login = (userData) => {
    try {
      const success = authService.setUserSession(userData);
      if (success) {
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      errorService.handleAPIError(error, { operation: 'user_login' });
      return false;
    }
  };

  const logout = () => {
    try {
      const success = authService.clearSession();
      if (success) {
        setUser(null);
        setIsAuthenticated(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during logout:', error);
      errorService.handleAPIError(error, { operation: 'user_logout' });
      return false;
    }
  };

  const switchUser = (newUser) => {
    try {
      const success = authService.setUserSession(newUser);
      if (success) {
        setUser(newUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error switching user:', error);
      errorService.handleAPIError(error, { operation: 'switch_user' });
      return false;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    switchUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};