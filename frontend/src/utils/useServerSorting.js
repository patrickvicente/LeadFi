import { useState, useCallback } from 'react';

/**
 * Custom hook for server-side sorting functionality
 * @param {Function} onSortChange - Callback function that gets called when sort changes
 * @returns {Object} - Sorting state and functions
 */
export const useServerSorting = (onSortChange) => {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  const handleSort = useCallback((field) => {
    let newDirection = 'asc';
    
    if (sortField === field) {
      // Toggle direction if same field
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new field and default to ascending
      newDirection = 'asc';
    }
    
    setSortField(field);
    setSortDirection(newDirection);
    
    // Trigger the callback to fetch sorted data from server
    if (onSortChange) {
      onSortChange(field, newDirection);
    }
  }, [sortField, sortDirection, onSortChange]);

  const resetSort = useCallback(() => {
    setSortField(null);
    setSortDirection('asc');
    
    // Trigger callback with null values to reset server sorting
    if (onSortChange) {
      onSortChange(null, 'asc');
    }
  }, [onSortChange]);

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return '↑↓'; // Both arrows when not sorted
    }
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getSortClasses = (field) => {
    const baseClasses = "cursor-pointer hover:bg-gray-700 select-none transition-colors";
    const activeClasses = sortField === field ? "bg-gray-700" : "";
    return `${baseClasses} ${activeClasses}`;
  };

  const getSortParams = () => {
    return {
      sort_by: sortField,
      sort_order: sortDirection
    };
  };

  return {
    sortField,
    sortDirection,
    handleSort,
    resetSort,
    getSortIcon,
    getSortClasses,
    getSortParams
  };
};

/**
 * Sortable field configurations for different entities
 */
export const sortableFields = {
  leads: [
    'date_created',
    'status',
    'full_name',
    'company_name', 
    'type',
    'source',
    'bd_in_charge'
  ],
  customers: [
    'date_created',
    'name',
    'type',
    'country',
    'customer_uid'
  ],
  tradingVolume: [
    'date',
    'customer_uid', 
    'volume',
    'fees'
  ]
}; 