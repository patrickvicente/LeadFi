"""
Logging configuration for the LeadFi API.
Provides structured logging with appropriate handlers and formatters.
"""

import logging
import logging.config
import os
import sys
from datetime import datetime
from typing import Dict, Any, Optional

def setup_logging(log_level: str = "INFO", log_file: Optional[str] = None) -> None:
    """
    Configure application logging with both console and file handlers.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional log file path. If None, uses default location.
    """
    
    # Create logs directory if it doesn't exist
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Set default log file if not provided
    if log_file is None:
        timestamp = datetime.now().strftime("%Y%m%d")
        log_file = os.path.join(log_dir, f"leadfi_api_{timestamp}.log")
    
    # Logging configuration
    logging_config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'standard': {
                'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
                'datefmt': '%Y-%m-%d %H:%M:%S'
            },
            'detailed': {
                'format': '%(asctime)s [%(levelname)s] %(name)s:%(lineno)d - %(message)s',
                'datefmt': '%Y-%m-%d %H:%M:%S'
            },
            'json': {
                'class': 'pythonjsonlogger.json.JsonFormatter',
                'format': '%(asctime)s %(name)s %(levelname)s %(message)s'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': log_level,
                'formatter': 'standard',
                'stream': sys.stdout
            },
            'file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': log_level,
                'formatter': 'detailed',
                'filename': log_file,
                'maxBytes': 10485760,  # 10MB
                'backupCount': 5,
                'encoding': 'utf8'
            },
            'error_file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'ERROR',
                'formatter': 'detailed',
                'filename': os.path.join(log_dir, 'error.log'),
                'maxBytes': 10485760,  # 10MB
                'backupCount': 5,
                'encoding': 'utf8'
            }
        },
        'loggers': {
            '': {  # Root logger
                'level': log_level,
                'handlers': ['console', 'file', 'error_file'],
                'propagate': False
            },
            'api': {
                'level': log_level,
                'handlers': ['console', 'file', 'error_file'],
                'propagate': False
            },
            'etl': {
                'level': log_level,
                'handlers': ['console', 'file', 'error_file'],
                'propagate': False
            },
            'werkzeug': {
                'level': 'WARNING',
                'handlers': ['console', 'file'],
                'propagate': False
            },
            'sqlalchemy.engine': {
                'level': 'WARNING',
                'handlers': ['file'],
                'propagate': False
            }
        }
    }
    
    logging.config.dictConfig(logging_config)

def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Get a logger instance with the specified name.
    
    Args:
        name: Logger name. If None, uses the calling module name.
    
    Returns:
        Configured logger instance.
    """
    if name is None:
        # Get the calling module name
        import inspect
        frame = inspect.currentframe()
        if frame and frame.f_back:
            name = frame.f_back.f_globals.get('__name__', 'unknown')
        else:
            name = 'unknown'
    
    return logging.getLogger(name)

def log_request_info(request, logger: Optional[logging.Logger] = None) -> None:
    """
    Log incoming request information.
    
    Args:
        request: Flask request object
        logger: Logger instance. If None, creates a new one.
    """
    if logger is None:
        logger = get_logger('api.request')
    
    logger.info(
        f"Request: {request.method} {request.url}",
        extra={
            'method': request.method,
            'url': request.url,
            'remote_addr': request.remote_addr,
            'user_agent': request.headers.get('User-Agent'),
            'content_length': request.content_length
        }
    )

def log_response_info(response, logger: Optional[logging.Logger] = None) -> None:
    """
    Log outgoing response information.
    
    Args:
        response: Flask response object
        logger: Logger instance. If None, creates a new one.
    """
    if logger is None:
        logger = get_logger('api.response')
    
    logger.info(
        f"Response: {response.status_code}",
        extra={
            'status_code': response.status_code,
            'content_length': response.content_length
        }
    )

def log_database_operation(operation: str, table: str, details: Optional[Dict[str, Any]] = None, logger: Optional[logging.Logger] = None) -> None:
    """
    Log database operations.
    
    Args:
        operation: Operation type (SELECT, INSERT, UPDATE, DELETE)
        table: Table name
        details: Additional operation details
        logger: Logger instance. If None, creates a new one.
    """
    if logger is None:
        logger = get_logger('api.database')
    
    if details is None:
        details = {}
    
    logger.info(
        f"Database {operation} on {table}",
        extra={
            'operation': operation,
            'table': table,
            'details': details
        }
    )

def log_etl_operation(operation: str, details: Optional[Dict[str, Any]] = None, logger: Optional[logging.Logger] = None) -> None:
    """
    Log ETL operations.
    
    Args:
        operation: Operation description
        details: Additional operation details
        logger: Logger instance. If None, creates a new one.
    """
    if logger is None:
        logger = get_logger('etl')
    
    if details is None:
        details = {}
    
    logger.info(
        f"ETL: {operation}",
        extra={
            'operation': operation,
            'details': details
        }
    ) 