"""
Error handling utilities for ETL processes.
Provides structured error handling and reporting for data ingestion operations.
"""

import logging
import traceback
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

class ETLErrorType(Enum):
    """Types of ETL errors."""
    EXTRACTION_ERROR = "extraction_error"
    TRANSFORMATION_ERROR = "transformation_error"
    VALIDATION_ERROR = "validation_error"
    LOADING_ERROR = "loading_error"
    CONNECTIVITY_ERROR = "connectivity_error"
    DATA_QUALITY_ERROR = "data_quality_error"

@dataclass
class ETLError:
    """Structured ETL error information."""
    error_type: ETLErrorType
    message: str
    source: str
    timestamp: datetime
    details: Optional[Dict[str, Any]] = None
    row_index: Optional[int] = None
    original_exception: Optional[Exception] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for logging/reporting."""
        return {
            'error_type': self.error_type.value,
            'message': self.message,
            'source': self.source,
            'timestamp': self.timestamp.isoformat(),
            'details': self.details or {},
            'row_index': self.row_index,
            'traceback': traceback.format_exception(
                type(self.original_exception), 
                self.original_exception, 
                self.original_exception.__traceback__
            ) if self.original_exception else None
        }

class ETLErrorCollector:
    """Collects and manages ETL errors during processing."""
    
    def __init__(self, source: str):
        self.source = source
        self.errors: List[ETLError] = []
        self.warnings: List[ETLError] = []
        self.logger = logging.getLogger(f'etl.{source}')
    
    def add_error(
        self, 
        error_type: ETLErrorType, 
        message: str, 
        details: Optional[Dict[str, Any]] = None,
        row_index: Optional[int] = None,
        exception: Optional[Exception] = None
    ) -> None:
        """Add an error to the collection."""
        error = ETLError(
            error_type=error_type,
            message=message,
            source=self.source,
            timestamp=datetime.utcnow(),
            details=details,
            row_index=row_index,
            original_exception=exception
        )
        
        self.errors.append(error)
        self.logger.error(f"ETL Error: {message}", extra=error.to_dict())
    
    def add_warning(
        self, 
        error_type: ETLErrorType, 
        message: str, 
        details: Optional[Dict[str, Any]] = None,
        row_index: Optional[int] = None
    ) -> None:
        """Add a warning to the collection."""
        warning = ETLError(
            error_type=error_type,
            message=message,
            source=self.source,
            timestamp=datetime.utcnow(),
            details=details,
            row_index=row_index
        )
        
        self.warnings.append(warning)
        self.logger.warning(f"ETL Warning: {message}", extra=warning.to_dict())
    
    def has_errors(self) -> bool:
        """Check if there are any errors."""
        return len(self.errors) > 0
    
    def has_warnings(self) -> bool:
        """Check if there are any warnings."""
        return len(self.warnings) > 0
    
    def get_error_summary(self) -> Dict[str, Any]:
        """Get a summary of all errors and warnings."""
        return {
            'source': self.source,
            'error_count': len(self.errors),
            'warning_count': len(self.warnings),
            'errors': [error.to_dict() for error in self.errors],
            'warnings': [warning.to_dict() for warning in self.warnings]
        }
    
    def clear(self) -> None:
        """Clear all errors and warnings."""
        self.errors.clear()
        self.warnings.clear()

def handle_etl_operation(
    operation_name: str,
    source: str,
    operation_func,
    *args,
    **kwargs
) -> Tuple[Any, ETLErrorCollector]:
    """
    Handle an ETL operation with comprehensive error handling.
    
    Args:
        operation_name: Name of the operation for logging
        source: Source identifier for error tracking
        operation_func: Function to execute
        *args: Arguments for the operation function
        **kwargs: Keyword arguments for the operation function
    
    Returns:
        Tuple of (result, error_collector)
    """
    error_collector = ETLErrorCollector(source)
    logger = logging.getLogger(f'etl.{source}')
    
    try:
        logger.info(f"Starting ETL operation: {operation_name}")
        
        # Execute the operation
        result = operation_func(error_collector, *args, **kwargs)
        
        if error_collector.has_errors():
            logger.error(f"ETL operation '{operation_name}' completed with {len(error_collector.errors)} errors")
        elif error_collector.has_warnings():
            logger.warning(f"ETL operation '{operation_name}' completed with {len(error_collector.warnings)} warnings")
        else:
            logger.info(f"ETL operation '{operation_name}' completed successfully")
        
        return result, error_collector
        
    except Exception as e:
        error_collector.add_error(
            ETLErrorType.EXTRACTION_ERROR,
            f"Unexpected error in ETL operation '{operation_name}': {str(e)}",
            exception=e
        )
        logger.error(f"ETL operation '{operation_name}' failed with unexpected error", exc_info=True)
        return None, error_collector

def validate_dataframe_schema(
    df, 
    required_columns: List[str],
    error_collector: ETLErrorCollector,
    operation_name: str = "schema_validation"
) -> bool:
    """
    Validate DataFrame schema against required columns.
    
    Args:
        df: DataFrame to validate
        required_columns: List of required column names
        error_collector: Error collector instance
        operation_name: Name for error reporting
    
    Returns:
        True if valid, False otherwise
    """
    missing_columns = [col for col in required_columns if col not in df.columns]
    
    if missing_columns:
        error_collector.add_error(
            ETLErrorType.VALIDATION_ERROR,
            f"Missing required columns in {operation_name}",
            details={'missing_columns': missing_columns, 'available_columns': list(df.columns)}
        )
        return False
    
    return True

def validate_data_quality(
    df,
    validation_rules: Dict[str, Dict[str, Any]],
    error_collector: ETLErrorCollector
) -> bool:
    """
    Validate data quality based on rules.
    
    Args:
        df: DataFrame to validate
        validation_rules: Dictionary of column validation rules
        error_collector: Error collector instance
    
    Returns:
        True if all validations pass, False otherwise
    """
    all_valid = True
    
    for column, rules in validation_rules.items():
        if column not in df.columns:
            continue
            
        # Check for null values if required
        if rules.get('required', False):
            null_count = df[column].isnull().sum()
            if null_count > 0:
                error_collector.add_error(
                    ETLErrorType.DATA_QUALITY_ERROR,
                    f"Required column '{column}' has {null_count} null values",
                    details={'column': column, 'null_count': null_count}
                )
                all_valid = False
        
        # Check data types
        if 'dtype' in rules:
            try:
                df[column].astype(rules['dtype'])
            except (ValueError, TypeError) as e:
                error_collector.add_error(
                    ETLErrorType.DATA_QUALITY_ERROR,
                    f"Column '{column}' has invalid data type",
                    details={'column': column, 'expected_type': str(rules['dtype']), 'error': str(e)}
                )
                all_valid = False
        
        # Check value ranges for numeric columns
        if 'min_value' in rules:
            invalid_count = (df[column] < rules['min_value']).sum()
            if invalid_count > 0:
                error_collector.add_warning(
                    ETLErrorType.DATA_QUALITY_ERROR,
                    f"Column '{column}' has {invalid_count} values below minimum",
                    details={'column': column, 'min_value': rules['min_value'], 'invalid_count': invalid_count}
                )
        
        if 'max_value' in rules:
            invalid_count = (df[column] > rules['max_value']).sum()
            if invalid_count > 0:
                error_collector.add_warning(
                    ETLErrorType.DATA_QUALITY_ERROR,
                    f"Column '{column}' has {invalid_count} values above maximum",
                    details={'column': column, 'max_value': rules['max_value'], 'invalid_count': invalid_count}
                )
    
    return all_valid

def log_etl_metrics(
    operation_name: str,
    source: str,
    metrics: Dict[str, Any],
    error_collector: ETLErrorCollector
) -> None:
    """
    Log ETL operation metrics.
    
    Args:
        operation_name: Name of the operation
        source: Source identifier
        metrics: Dictionary of metrics to log
        error_collector: Error collector instance
    """
    logger = logging.getLogger(f'etl.{source}')
    
    metrics_summary = {
        'operation': operation_name,
        'source': source,
        'metrics': metrics,
        'error_count': len(error_collector.errors),
        'warning_count': len(error_collector.warnings)
    }
    
    logger.info(f"ETL Metrics for {operation_name}", extra=metrics_summary) 