/**
 * Date formatting utilities
 */

/**
 * Format a date string or Date object to dd/mm/yyyy format
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string or 'N/A' if invalid
 */
const parseDate = (dateValue) => {
  if (!dateValue) return null;

  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }

  if (typeof dateValue !== 'string') return null;

  const ddmmyyyyRegex = /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/;
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/;

  let matches = dateValue.match(ddmmyyyyRegex);
  if (matches) {
    const [, dayStr, monthStr, yearStr, hourStr = '00', minuteStr = '00', secondStr = '00'] = matches;
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    const second = Number(secondStr);

    const d = new Date(year, month - 1, day, hour, minute, second);
    if (
      d.getFullYear() === year &&
      d.getMonth() === month - 1 &&
      d.getDate() === day
    ) {
      return d;
    }
    return null;
  }

  if (isoDateRegex.test(dateValue)) {
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(dateValue);
  return isNaN(d.getTime()) ? null : d;
};

const formatDateParts = (dateObj) => {
  if (!dateObj) return 'N/A';
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateTimeParts = (dateObj) => {
  if (!dateObj) return 'N/A';
  const date = formatDateParts(dateObj);
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  return `${date} ${hours}:${minutes}:${seconds}`;
};

export const formatDate = (date) => {
  const parsedDate = parseDate(date);
  return parsedDate ? formatDateParts(parsedDate) : 'N/A';
};

export const formatDateTime = (dateTime) => {
  const parsedDate = parseDate(dateTime);
  return parsedDate ? formatDateTimeParts(parsedDate) : 'N/A';
};

export const toISODate = (date) => {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toDDMMYYYY = (date) => {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';
  return formatDateParts(parsedDate);
};

export const parseDateString = parseDate;