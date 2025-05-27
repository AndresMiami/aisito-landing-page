// filepath: api-service/src/utils/formatting.js
/**
 * formatting.js - Utility functions for formatting data in the Miami AI Concierge
 * 
 * This module provides functions for formatting various types of data,
 * such as dates and currency, to ensure consistency across the application.
 */

/**
 * Format a date to a specified format.
 * @param {Date} date - The date to format.
 * @param {string} format - The format string (e.g., 'YYYY-MM-DD').
 * @returns {string} - The formatted date string.
 */
export function formatDate(date, format) {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Format a number as currency.
 * @param {number} amount - The amount to format.
 * @param {string} currency - The currency code (e.g., 'USD').
 * @returns {string} - The formatted currency string.
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format a string to title case.
 * @param {string} str - The string to format.
 * @returns {string} - The formatted title case string.
 */
export function formatTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}