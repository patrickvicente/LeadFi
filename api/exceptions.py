"""
Custom exceptions and error handling for the LeadFi API.
Provides standardized error responses and logging.
"""

import logging
from typing import Dict, Any, Optional
from flask import jsonify
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)

class APIError(Exception):
    """Base class for API errors with standardized error responses."""
    
    def __init__(
        self, 
        message: str, 
        status_code: int = 500, 
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for JSON response."""
        error_dict = {
            'error': True,
            'error_code': self.error_code,
            'message': self.message,
            'status_code': self.status_code
        }
        
        if self.details:
            error_dict['details'] = self.details
            
        return error_dict

class ValidationError(APIError):
    """Raised when validation fails for input data."""
    
    def __init__(self, message: str, field_errors: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=400,
            error_code="VALIDATION_ERROR",
            details={'field_errors': field_errors} if field_errors else None
        )

class NotFoundError(APIError):
    """Raised when a requested resource is not found."""
    
    def __init__(self, resource: str, identifier: str = None):
        message = f"{resource} not found"
        if identifier:
            message += f" with identifier: {identifier}"
        
        super().__init__(
            message=message,
            status_code=404,
            error_code="NOT_FOUND",
            details={'resource': resource, 'identifier': identifier}
        )

class ConflictError(APIError):
    """Raised when there's a conflict with existing data."""
    
    def __init__(self, message: str, conflicting_field: str = None):
        super().__init__(
            message=message,
            status_code=409,
            error_code="CONFLICT",
            details={'conflicting_field': conflicting_field} if conflicting_field else None
        )

class DatabaseError(APIError):
    """Raised when database operations fail."""
    
    def __init__(self, message: str = "Database operation failed", original_error: Exception = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code="DATABASE_ERROR",
            details={'original_error': str(original_error)} if original_error else None
        )

class ExternalServiceError(APIError):
    """Raised when external service calls fail."""
    
    def __init__(self, service: str, message: str = "External service error"):
        super().__init__(
            message=f"{service}: {message}",
            status_code=503,
            error_code="EXTERNAL_SERVICE_ERROR",
            details={'service': service}
        )

class AuthenticationError(APIError):
    """Raised when authentication fails."""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_ERROR"
        )

class AuthorizationError(APIError):
    """Raised when authorization fails."""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            status_code=403,
            error_code="AUTHORIZATION_ERROR"
        )

class RateLimitError(APIError):
    """Raised when rate limit is exceeded."""
    
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(
            message=message,
            status_code=429,
            error_code="RATE_LIMIT_ERROR"
        )

def handle_api_error(error: APIError):
    """Handle custom API errors and return standardized JSON response."""
    logger.error(
        f"API Error: {error.error_code} - {error.message}",
        extra={
            'error_code': error.error_code,
            'status_code': error.status_code,
            'details': error.details
        }
    )
    
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

def handle_werkzeug_error(error: HTTPException):
    """Handle standard HTTP exceptions from Werkzeug."""
    logger.warning(f"HTTP Error: {error.code} - {error.description}")
    
    error_dict = {
        'error': True,
        'error_code': 'HTTP_ERROR',
        'message': error.description,
        'status_code': error.code
    }
    
    response = jsonify(error_dict)
    response.status_code = error.code
    return response

def handle_generic_error(error: Exception):
    """Handle unexpected errors."""
    logger.error(f"Unexpected error: {str(error)}", exc_info=True)
    
    error_dict = {
        'error': True,
        'error_code': 'INTERNAL_ERROR',
        'message': 'An unexpected error occurred. Please try again later.',
        'status_code': 500
    }
    
    response = jsonify(error_dict)
    response.status_code = 500
    return response 