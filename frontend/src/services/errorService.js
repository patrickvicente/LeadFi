/**
 * Centralized error handling service for the frontend.
 * Provides consistent error handling, logging, and user-friendly error messages.
 */

class ErrorService {
  constructor() {
    this.errorHandlers = new Map();
    this.retryQueue = new Map();
    this.errorHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Register a global error handler for specific error types
   */
  registerErrorHandler(errorType, handler) {
    this.errorHandlers.set(errorType, handler);
  }

  /**
   * Handle API errors with automatic retry and user-friendly messages
   */
  handleAPIError(error, context = {}) {
    const errorInfo = this.parseAPIError(error);
    
    // Log error for debugging
    this.logError(errorInfo, context);
    
    // Add to error history
    this.addToHistory(errorInfo, context);
    
    // Check if we should automatically retry
    if (this.shouldRetry(errorInfo, context)) {
      return this.scheduleRetry(errorInfo, context);
    }
    
    // Apply registered error handlers
    if (this.errorHandlers.has(errorInfo.type)) {
      return this.errorHandlers.get(errorInfo.type)(errorInfo, context);
    }
    
    return errorInfo;
  }

  /**
   * Parse API error response into standardized format
   */
  parseAPIError(error) {
    const baseError = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      type: 'unknown',
      message: 'An unexpected error occurred',
      statusCode: null,
      details: {},
      retryable: false
    };

    if (!error) {
      return baseError;
    }

    // Network errors
    if (!error.response && error.request) {
      return {
        ...baseError,
        type: 'network',
        message: 'Network error. Please check your connection and try again.',
        retryable: true
      };
    }

    // No response (network timeout, etc.)
    if (!error.response) {
      return {
        ...baseError,
        type: 'connection',
        message: 'Unable to connect to server. Please try again later.',
        retryable: true
      };
    }

    const { status, data } = error.response;
    
    // Parse structured API errors
    if (data && typeof data === 'object') {
      const errorInfo = {
        ...baseError,
        statusCode: status,
        type: data.error_code || this.getErrorTypeFromStatus(status),
        message: data.message || baseError.message,
        details: data.details || {}
      };

      // Set retryable based on error type and status
      errorInfo.retryable = this.isRetryableError(status, errorInfo.type);
      
      return errorInfo;
    }

    // Fallback for non-structured errors
    return {
      ...baseError,
      statusCode: status,
      type: this.getErrorTypeFromStatus(status),
      message: this.getMessageFromStatus(status),
      retryable: this.isRetryableError(status)
    };
  }

  /**
   * Get error type from HTTP status code
   */
  getErrorTypeFromStatus(status) {
    const statusMap = {
      400: 'validation',
      401: 'authentication',
      403: 'authorization',
      404: 'not_found',
      409: 'conflict',
      422: 'validation',
      429: 'rate_limit',
      500: 'server',
      502: 'server',
      503: 'server',
      504: 'timeout'
    };
    
    return statusMap[status] || 'unknown';
  }

  /**
   * Get user-friendly message from HTTP status code
   */
  getMessageFromStatus(status) {
    const messageMap = {
      400: 'Invalid request. Please check your input and try again.',
      401: 'Authentication required. Please log in and try again.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'This action conflicts with existing data.',
      422: 'The provided data is invalid. Please check and try again.',
      429: 'Too many requests. Please wait a moment and try again.',
      500: 'Server error. Please try again later.',
      502: 'Server is temporarily unavailable. Please try again later.',
      503: 'Service is temporarily unavailable. Please try again later.',
      504: 'Request timed out. Please try again.'
    };
    
    return messageMap[status] || 'An unexpected error occurred.';
  }

  /**
   * Determine if an error is retryable
   */
  isRetryableError(status, errorType = null) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const retryableTypes = ['network', 'connection', 'timeout', 'server'];
    
    return retryableStatuses.includes(status) || 
           (errorType && retryableTypes.includes(errorType));
  }

  /**
   * Check if we should automatically retry this error
   */
  shouldRetry(errorInfo, context) {
    if (!errorInfo.retryable) return false;
    if (context.noRetry) return false;
    
    const retryKey = this.getRetryKey(errorInfo, context);
    const retryCount = this.retryQueue.get(retryKey) || 0;
    const maxRetries = context.maxRetries || 3;
    
    return retryCount < maxRetries;
  }

  /**
   * Schedule automatic retry
   */
  async scheduleRetry(errorInfo, context) {
    const retryKey = this.getRetryKey(errorInfo, context);
    const retryCount = this.retryQueue.get(retryKey) || 0;
    const delay = this.calculateRetryDelay(retryCount);
    
    this.retryQueue.set(retryKey, retryCount + 1);
    
    console.log(`Scheduling retry ${retryCount + 1} for ${retryKey} in ${delay}ms`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...errorInfo,
          shouldRetry: true,
          retryCount: retryCount + 1,
          retryDelay: delay
        });
      }, delay);
    });
  }

  /**
   * Calculate retry delay using exponential backoff
   */
  calculateRetryDelay(retryCount) {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Generate unique retry key
   */
  getRetryKey(errorInfo, context) {
    return `${context.operation || 'unknown'}_${errorInfo.type}_${errorInfo.statusCode}`;
  }

  /**
   * Clear retry count for successful operation
   */
  clearRetryCount(context) {
    const retryKey = this.getRetryKey({ type: 'success', statusCode: 200 }, context);
    this.retryQueue.delete(retryKey);
  }

  /**
   * Log error for debugging and monitoring
   */
  logError(errorInfo, context) {
    const logEntry = {
      ...errorInfo,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorService:', logEntry);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(logEntry).catch(err => 
        console.error('Failed to send error to monitoring service:', err)
      );
    }
  }

  /**
   * Send error to external monitoring service
   */
  async sendToMonitoringService(logEntry) {
    try {
      await fetch('/api/errors/frontend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      // Silently fail - don't create infinite error loops
      console.error('Monitoring service error:', error);
    }
  }

  /**
   * Add error to local history
   */
  addToHistory(errorInfo, context) {
    this.errorHistory.unshift({
      ...errorInfo,
      context,
      timestamp: new Date().toISOString()
    });

    // Limit history size
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get error history
   */
  getErrorHistory() {
    return [...this.errorHistory];
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get user-friendly error message with context
   */
  getUserFriendlyMessage(errorInfo, context = {}) {
    const operationContext = context.operation || 'operation';
    
    switch (errorInfo.type) {
      case 'validation':
        return `Please check your input and try again. ${errorInfo.message}`;
      case 'authentication':
        return 'Please log in and try again.';
      case 'authorization':
        return 'You do not have permission to perform this action.';
      case 'not_found':
        return 'The requested item was not found.';
      case 'conflict':
        return `This ${operationContext} conflicts with existing data.`;
      case 'network':
        return 'Network error. Please check your connection and try again.';
      case 'server':
        return 'Server error. Please try again in a few moments.';
      case 'rate_limit':
        return 'Too many requests. Please wait a moment and try again.';
      default:
        return errorInfo.message || 'An unexpected error occurred.';
    }
  }

  /**
   * Handle form validation errors
   */
  handleValidationErrors(errorInfo) {
    if (errorInfo.details && errorInfo.details.field_errors) {
      return {
        type: 'field_validation',
        fieldErrors: errorInfo.details.field_errors,
        message: 'Please correct the highlighted fields and try again.'
      };
    }
    
    return {
      type: 'form_validation',
      message: errorInfo.message || 'Please check your input and try again.'
    };
  }

  /**
   * Clear all error state
   */
  clearErrors() {
    this.retryQueue.clear();
    this.errorHistory = [];
  }
}

// Create singleton instance
const errorService = new ErrorService();

// Register default error handlers
errorService.registerErrorHandler('validation', (errorInfo) => 
  errorService.handleValidationErrors(errorInfo)
);

export default errorService; 