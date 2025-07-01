/**
 * Number formatting utilities for financial data
 */

/**
 * Format number with commas for thousands separator
 * @param {number|string} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number with commas
 */
export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') {
    return '0';
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    return '0';
  }
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Format volume numbers (typically large numbers with 2 decimal places)
 * @param {number|string} value - The volume to format
 * @returns {string} Formatted volume
 */
export const formatVolume = (value) => {
  return formatNumber(value, 2);
};

/**
 * Format fee amounts (typically smaller numbers with 2 decimal places)
 * @param {number|string} value - The fee to format
 * @returns {string} Formatted fee
 */
export const formatFee = (value) => {
  return formatNumber(value, 2);
};

/**
 * Format currency with $ symbol
 * @param {number|string} value - The amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency
 */
export const formatCurrency = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') {
    return '$0.00';
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    return '$0.00';
  }
  
  return '$' + formatNumber(num, decimals);
};

/**
 * Format large numbers with K, M, B suffixes
 * @param {number|string} value - The number to format
 * @returns {string} Formatted number with suffix
 */
export const formatCompactNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return '0';
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    return '0';
  }
  
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  
  return formatNumber(num, 2);
};

/**
 * Format percentage
 * @param {number|string} value - The percentage value (0-100 or 0-1)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @param {boolean} isDecimal - Whether input is decimal (0-1) or percentage (0-100)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 2, isDecimal = false) => {
  if (value === null || value === undefined || value === '') {
    return '0%';
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    return '0%';
  }
  
  const percentage = isDecimal ? num * 100 : num;
  return percentage.toFixed(decimals) + '%';
}; 