import errorService from './errorService';

class AuthService {
  constructor() {
    this.SESSION_KEY = 'leadfi_demo_session';
    this.DEMO_MODE_KEY = 'demoMode';
    this.SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  }

  setUserSession(user) {
    try {
      const sessionData = {
        user,
        timestamp: Date.now(),
        sessionId: `demo_session_${Date.now()}`,
        expiresAt: Date.now() + this.SESSION_TIMEOUT
      };
      
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      localStorage.setItem(this.DEMO_MODE_KEY, 'true');
      
      return true;
    } catch (error) {
      console.error('Error setting user session:', error);
      errorService.handleAPIError(error, { operation: 'set_user_session' });
      return false;
    }
  }

  getCurrentUser() {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);
      
      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }

      // Check if session is too old (24 hours)
      const isExpired = Date.now() - session.timestamp > this.SESSION_TIMEOUT;
      if (isExpired) {
        this.clearSession();
        return null;
      }

      return session.user;
    } catch (error) {
      console.error('Error loading user session:', error);
      errorService.handleAPIError(error, { operation: 'get_current_user' });
      this.clearSession();
      return null;
    }
  }

  validateSession() {
    const user = this.getCurrentUser();
    const isDemoMode = this.isDemoMode();
    
    return {
      isValid: user !== null && isDemoMode,
      user,
      isDemoMode
    };
  }

  clearSession() {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.DEMO_MODE_KEY);
      localStorage.removeItem('demoUser'); // Clear old demo context
      return true;
    } catch (error) {
      console.error('Error clearing session:', error);
      errorService.handleAPIError(error, { operation: 'clear_session' });
      return false;
    }
  }

  isSessionValid() {
    return this.getCurrentUser() !== null;
  }

  isDemoMode() {
    return localStorage.getItem(this.DEMO_MODE_KEY) === 'true';
  }

  // Extend session (called on user activity)
  extendSession() {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.timestamp = Date.now();
        session.expiresAt = Date.now() + this.SESSION_TIMEOUT;
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      }
    } catch (error) {
      console.error('Error extending session:', error);
    }
  }
}

export const authService = new AuthService();