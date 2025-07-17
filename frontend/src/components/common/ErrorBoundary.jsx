import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // Log to error reporting service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    try {
      // Create error report
      const errorReport = {
        error_id: this.state.errorId,
        message: error.message,
        stack: error.stack,
        component_stack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href,
        user_id: this.props.userId || 'anonymous'
      };

      // Log to external service (you can replace this with your error tracking service)
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorReport)
        }).catch(err => console.error('Failed to log error:', err));
      }

    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <ExclamationTriangleIcon className="h-16 w-16 text-highlight2" />
            </div>
            
            <h1 className="text-xl font-bold text-text mb-2">
              Something went wrong
            </h1>
            
            <p className="text-gray-400 mb-6">
              We're sorry, but something unexpected happened. 
              {this.state.errorId && (
                <>
                  <br />
                  <span className="text-sm">Error ID: {this.state.errorId}</span>
                </>
              )}
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Reload Page
              </button>
            </div>

            {isDevelopment && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                  Technical Details (Development Only)
                </summary>
                <div className="mt-2 p-3 bg-gray-900 rounded text-xs font-mono text-red-400 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div className="mb-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 