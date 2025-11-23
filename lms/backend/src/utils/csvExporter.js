/**
 * CSV Export Utility
 * Converts data arrays to CSV format
 */

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects
 * @param {Array} headers - Optional custom headers [key, label]
 * @returns {string} - CSV formatted string
 */
export const arrayToCSV = (data, headers = null) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  const headerLabels = headers ? headers.map(h => h[1] || h[0]) : csvHeaders;

  // Escape CSV values
  const escapeCSV = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Build CSV
  const rows = [];
  
  // Header row
  rows.push(headerLabels.map(escapeCSV).join(','));

  // Data rows
  for (const item of data) {
    const row = csvHeaders.map(header => {
      const key = Array.isArray(header) ? header[0] : header;
      const value = getNestedValue(item, key);
      return escapeCSV(value);
    });
    rows.push(row.join(','));
  }

  return rows.join('\n');
};

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to get value from
 * @param {string} path - Dot notation path (e.g., 'user.name')
 * @returns {any} - Value at path
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

/**
 * Generate CSV filename with timestamp
 * @param {string} prefix - Filename prefix
 * @returns {string} - Filename
 */
export const generateCSVFilename = (prefix = 'export') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}.csv`;
};

/**
 * Format date for CSV
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDateForCSV = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

/**
 * Format currency for CSV
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol (default: ₹)
 * @returns {string} - Formatted currency string
 */
export const formatCurrencyForCSV = (amount, currency = '₹') => {
  if (amount === null || amount === undefined) return '';
  return `${currency}${parseFloat(amount).toFixed(2)}`;
};

