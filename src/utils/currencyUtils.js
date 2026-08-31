/**
 * Centralized Application Currency Configuration & Utilities for MyDentalClinicPro.
 * Application Currency: Indian Rupee (INR)
 * Symbol: ₹
 * Locale: en-IN
 */

export const CURRENCY_CODE = 'INR';
export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_NAME = 'Indian Rupee';
export const LOCALE = 'en-IN';

/**
 * Format numeric amount into Indian Rupee (INR - ₹) standard display string.
 * Uses Indian numbering format (e.g. ₹1,00,000.00).
 *
 * @param {number|string|null|undefined} value - Numeric value to format.
 * @param {Object} options
 * @param {string} [options.fallback='Not provided'] - Fallback text if value is null/undefined.
 * @param {boolean} [options.allowNullAsZero=false] - If true, null/undefined formats as ₹0.00.
 * @param {number} [options.fractionDigits=2] - Number of decimal places.
 * @returns {string} Formatted currency string.
 */
export const formatCurrencyINR = (value, options = {}) => {
  const {
    fallback = 'Not provided',
    allowNullAsZero = false,
    fractionDigits = 2,
  } = options;

  if (value === null || value === undefined || value === '') {
    if (allowNullAsZero) {
      return formatCurrencyINR(0, { fractionDigits });
    }
    return fallback;
  }

  const num = Number(value);
  if (isNaN(num)) {
    return fallback;
  }

  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(num);
};

/**
 * Format numeric amount without currency symbol (e.g. 1,00,000.00).
 */
export const formatAmountWithoutSymbolINR = (value, options = {}) => {
  const { fallback = '0.00', fractionDigits = 2 } = options;
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const num = Number(value);
  if (isNaN(num)) return fallback;
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(num);
};
