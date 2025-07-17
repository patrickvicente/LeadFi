# Comprehensive Error Handling System

This document describes the comprehensive error handling system implemented across the LeadFi application, covering backend API, frontend React components, and ETL processes.

## Overview

The error handling system provides:
- **Standardized error responses** across all API endpoints
- **Automatic retry mechanisms** with exponential backoff
- **Comprehensive logging** with structured data
- **User-friendly error messages** in the frontend
- **Global error boundaries** for React components
- **ETL error tracking and reporting**

## Backend Error Handling

### Custom Exception Classes

Located in `api/exceptions.py`, the system provides specialized exception classes:

```python
from api.exceptions import ValidationError, NotFoundError, DatabaseError, ConflictError

# Example usage
raise ValidationError("Invalid email format", {"email": "Must be a valid email address"})
raise NotFoundError("Lead", "123")
raise ConflictError("Email already exists", "email")
```

#### Available Exception Classes:
- `ValidationError` - For input validation failures
- `NotFoundError` - For missing resources
- `ConflictError` - For data conflicts (duplicates, etc.)
- `DatabaseError` - For database operation failures
- `ExternalServiceError` - For third-party service failures
- `AuthenticationError` - For authentication failures
- `AuthorizationError` - For permission issues
- `RateLimitError` - For rate limiting

### Error Response Format

All API errors return a standardized JSON format:

```json
{
  "error": true,
  "error_code": "VALIDATION_ERROR",
  "message": "Invalid email format",
  "status_code": 400,
  "details": {
    "field_errors": {
      "email": "Must be a valid email address"
    }
  }
}
```

### Logging Configuration

The logging system is configured in `api/utils/logging_config.py`:

```python
from api.utils.logging_config import setup_logging, get_logger

# Setup logging (called in app.py)
setup_logging(log_level="INFO")

# Get logger in any module
logger = get_logger(__name__)
```

#### Log Files:
- `logs/leadfi_api_YYYYMMDD.log` - All application logs
- `logs/error.log` - Error-level logs only
- Console output for development

### Database Operation Logging

Database operations are automatically logged:

```python
from api.utils.logging_config import log_database_operation

log_database_operation("INSERT", "lead", {"lead_id": 123})
log_database_operation("UPDATE", "customer", {"customer_uid": "456", "fields": ["name", "email"]})
```

### Updated Resource Example

Here's how the LeadResource now handles errors:

```python
from api.exceptions import ValidationError, NotFoundError, DatabaseError
from api.utils.logging_config import get_logger, log_database_operation

class LeadResource(Resource):
    def get(self, id=None):
        try:
            if not id:
                # Validate pagination parameters
                if page < 1:
                    raise ValidationError("Page number must be greater than 0")
                
                # ... query logic ...
                log_database_operation("SELECT", "lead", {"page": page, "per_page": per_page})
                return {"leads": results}
            
            lead = Lead.query.get(id)
            if not lead:
                raise NotFoundError("Lead", str(id))
            
            return {"lead": self.schema.dump(lead)}
            
        except (ValidationError, NotFoundError) as e:
            raise e  # Let error handlers handle these
        except Exception as e:
            logger.error(f"Unexpected error: {e}", exc_info=True)
            raise DatabaseError("Error retrieving leads", e)
```

## Frontend Error Handling

### Global Error Boundary

The `ErrorBoundary` component catches JavaScript errors anywhere in the component tree:

```jsx
// Wraps the entire application in App.jsx
<ErrorBoundary>
  <Router>
    {/* Your app components */}
  </Router>
</ErrorBoundary>
```

Features:
- Automatic error reporting to backend
- Development vs production error displays
- Retry and reload options
- Unique error IDs for tracking

### Centralized Error Service

The `errorService` provides consistent error handling across the frontend:

```javascript
import errorService from './services/errorService';

// Handle API errors
try {
  const response = await api.get('/leads');
} catch (error) {
  const errorInfo = await errorService.handleAPIError(error, {
    operation: 'fetch_leads',
    maxRetries: 3
  });
  
  // Show user-friendly message
  showToast(errorService.getUserFriendlyMessage(errorInfo), 'error');
}
```

### Automatic Retry Logic

The system automatically retries failed requests:

```javascript
// Automatic retry for network errors, server errors, etc.
const response = await makeAPICall(
  () => api.get('/leads'),
  { 
    operation: 'fetch_leads',
    maxRetries: 3,
    noRetry: false  // Set to true to disable retry
  }
);
```

#### Retry Strategy:
- **Exponential backoff**: 1s, 2s, 4s, 8s...
- **Jitter**: Random delay added to prevent thundering herd
- **Max delay**: 30 seconds
- **Retryable errors**: Network, timeout, 5xx server errors

### Enhanced API Service

The API service now includes comprehensive error handling:

```javascript
// Updated interceptors handle retries automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const errorInfo = await errorService.handleAPIError(error);
    
    if (errorInfo.shouldRetry) {
      // Automatic retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, errorInfo.retryDelay));
      return api.request(error.config);
    }
    
    return Promise.reject(error);
  }
);
```

### Error Types and Messages

The system provides user-friendly error messages:

| Error Type | User Message |
|------------|--------------|
| `validation` | Please check your input and try again |
| `authentication` | Please log in and try again |
| `authorization` | You do not have permission to perform this action |
| `not_found` | The requested item was not found |
| `conflict` | This action conflicts with existing data |
| `network` | Network error. Please check your connection |
| `server` | Server error. Please try again in a few moments |

## ETL Error Handling

### ETL Error Collection

The ETL system uses structured error collection:

```python
from etl.utils.error_handling import ETLErrorCollector, ETLErrorType, handle_etl_operation

def process_leads(error_collector, data):
    try:
        # Validate data
        if not validate_dataframe_schema(data, required_columns, error_collector):
            return None
        
        # Process data
        for index, row in data.iterrows():
            try:
                process_row(row)
            except Exception as e:
                error_collector.add_error(
                    ETLErrorType.TRANSFORMATION_ERROR,
                    f"Failed to process row {index}",
                    details={"row_data": row.to_dict()},
                    row_index=index,
                    exception=e
                )
        
        return processed_data
        
    except Exception as e:
        error_collector.add_error(
            ETLErrorType.EXTRACTION_ERROR,
            "Failed to process leads data",
            exception=e
        )
        return None

# Usage with error handling wrapper
result, errors = handle_etl_operation(
    "process_leads",
    "google_sheets",
    process_leads,
    data
)

if errors.has_errors():
    print(f"Processing completed with {len(errors.errors)} errors")
    for error in errors.errors:
        print(f"Error: {error.message}")
```

### Data Quality Validation

```python
from etl.utils.error_handling import validate_data_quality

validation_rules = {
    'email': {'required': True, 'dtype': 'string'},
    'phone': {'required': False, 'dtype': 'string'},
    'age': {'dtype': 'int64', 'min_value': 0, 'max_value': 150}
}

is_valid = validate_data_quality(df, validation_rules, error_collector)
```

### ETL Error Types

- `EXTRACTION_ERROR` - Data source connection/reading issues
- `TRANSFORMATION_ERROR` - Data processing failures
- `VALIDATION_ERROR` - Schema or format validation failures
- `LOADING_ERROR` - Database insertion failures
- `CONNECTIVITY_ERROR` - External service connection issues
- `DATA_QUALITY_ERROR` - Data quality rule violations

## Configuration

### Environment Variables

Set these environment variables for optimal error handling:

```bash
# Logging configuration
LOG_LEVEL=INFO
LOG_FILE=/path/to/custom/log/file

# API configuration
API_TIMEOUT=30000
MAX_RETRIES=3
```

### Database Configuration

Ensure your database handles connection errors gracefully:

```python
# In db_config.py
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=300,    # Recycle connections every 5 minutes
    pool_size=10,        # Connection pool size
    max_overflow=20      # Additional connections when pool is full
)
```

## Monitoring and Alerting

### Error Metrics

The system tracks:
- Error count by type and endpoint
- Response times and failure rates
- Retry attempt statistics
- User error patterns

### Log Analysis

Use structured logging for easy analysis:

```bash
# Filter errors by type
grep "VALIDATION_ERROR" logs/leadfi_api_*.log

# Find database errors
grep "DATABASE_ERROR" logs/error.log

# Monitor API response times
grep "Response:" logs/leadfi_api_*.log | grep "status_code.*[45][0-9][0-9]"
```

### Health Check Endpoint

Monitor application health:

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "healthy",
  "message": "LeadFi API is running"
}
```

## Best Practices

### Backend Development

1. **Always use custom exceptions** instead of generic `Exception`
2. **Log database operations** for audit trails
3. **Validate input data** before processing
4. **Handle database connection errors** gracefully
5. **Use consistent error response format**

### Frontend Development

1. **Wrap components in ErrorBoundary** for fallback UI
2. **Use errorService for all API calls** to ensure consistent handling
3. **Provide user-friendly error messages** instead of technical details
4. **Implement loading states** during retry attempts
5. **Clear error states** after successful operations

### ETL Development

1. **Use ETLErrorCollector** for all ETL operations
2. **Validate data quality** before processing
3. **Process data in batches** to isolate errors
4. **Log detailed error information** for debugging
5. **Implement recovery mechanisms** for partial failures

## Troubleshooting

### Common Issues

#### "Connection refused" errors
- Check if the API server is running
- Verify the API URL configuration
- Check firewall settings

#### "Validation errors" not showing field details
- Ensure the API returns `field_errors` in the details
- Check that the frontend is using the errorService
- Verify the form validation is using the error response

#### ETL errors not being logged
- Confirm logging configuration is set up
- Check file permissions for log directory
- Verify the ETL process is using error collectors

### Debug Mode

Enable debug mode for detailed error information:

```python
# Backend - add to environment variables
DEBUG=True
LOG_LEVEL=DEBUG

# Frontend - check browser console for detailed errors
# ETL - errors will include full stack traces
```

## Migration Guide

To implement this error handling system in existing code:

### Backend Migration

1. Import custom exceptions:
```python
from api.exceptions import ValidationError, NotFoundError, DatabaseError
```

2. Replace generic error handling:
```python
# Old
try:
    # operation
except Exception as e:
    return {'error': str(e)}, 500

# New
try:
    # operation
except SpecificError as e:
    raise e
except Exception as e:
    logger.error(f"Unexpected error: {e}", exc_info=True)
    raise DatabaseError("Operation failed", e)
```

3. Add logging:
```python
from api.utils.logging_config import get_logger, log_database_operation

logger = get_logger(__name__)
```

### Frontend Migration

1. Update API calls:
```javascript
// Old
try {
  const response = await api.get('/endpoint');
} catch (error) {
  console.error(error);
  showToast('Error occurred', 'error');
}

// New
try {
  const response = await makeAPICall(
    () => api.get('/endpoint'),
    { operation: 'fetch_data' }
  );
} catch (error) {
  const errorInfo = await errorService.handleAPIError(error);
  showToast(errorService.getUserFriendlyMessage(errorInfo), 'error');
}
```

2. Add ErrorBoundary:
```jsx
// Wrap your components
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```