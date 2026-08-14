// Centralized API error normalization
// Converts Axios / network / DRF errors to a safe, user-facing structure
export function normalizeApiError(error) {
  const isAxios = !!(error && error.isAxiosError);

  // Default normalized object
  const normalized = {
    status: error?.response?.status || null,
    type: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred. Please try again.',
    fieldErrors: {},
    retryable: false,
    raw: null,
  };

  // Network / no response
  if (!error?.response) {
    normalized.type = 'NETWORK_ERROR';
    normalized.message = 'Unable to connect to the server. Please check your internet connection and try again.';
    normalized.retryable = true;
    normalized.raw = error?.message || 'Network Error';
    return normalized;
  }

  const status = error.response.status;
  normalized.status = status;
  normalized.raw = error.response.data;

  // DRF validation style: { field: ["err"] }
  if (status === 400 || status === 422) {
    normalized.type = 'VALIDATION_ERROR';
    normalized.retryable = false;
    const data = error.response.data || {};
    // If DRF returns object of field errors
    if (typeof data === 'object' && !Array.isArray(data)) {
      const fieldErrors = {};
      Object.keys(data).forEach((key) => {
        const v = data[key];
        if (Array.isArray(v)) {
          fieldErrors[key] = v.join(' ');
        } else if (typeof v === 'string') {
          fieldErrors[key] = v;
        } else {
          fieldErrors[key] = JSON.stringify(v);
        }
      });
      normalized.fieldErrors = fieldErrors;
      normalized.message = 'Please check the information you entered.';
      return normalized;
    }

    // Fallback
    normalized.message = (error.response.data && error.response.data.detail) || 'Please check the information you entered.';
    return normalized;
  }

  const responseDetail = error.response.data && (error.response.data.detail || error.response.data.message);
  const detailMessage = typeof responseDetail === 'string' ? responseDetail : Array.isArray(responseDetail) ? responseDetail.join(' ') : null;

  if (status === 401) {
    normalized.type = 'AUTHENTICATION_REQUIRED';
    normalized.retryable = false;
    normalized.message = detailMessage || 'Your session has expired. Please log in again.';
    return normalized;
  }

  if (status === 403) {
    normalized.type = 'PERMISSION_DENIED';
    normalized.retryable = false;
    normalized.message = detailMessage || "You don't have permission to perform this action.";
    return normalized;
  }

  if (status === 404) {
    normalized.type = 'RESOURCE_NOT_FOUND';
    normalized.message = 'The requested information could not be found.';
    normalized.retryable = false;
    return normalized;
  }

  if (status === 409) {
    normalized.type = 'RESOURCE_CONFLICT';
    normalized.message = 'This information conflicts with existing data. Please refresh and try again.';
    normalized.retryable = false;
    return normalized;
  }

  if (status >= 500 && status < 600) {
    normalized.type = 'SERVER_ERROR';
    normalized.message = 'Something went wrong on our server. Please try again in a moment.';
    normalized.retryable = true;
    return normalized;
  }

  // Rate limit
  if (status === 429) {
    normalized.type = 'RATE_LIMIT';
    normalized.message = 'Too many requests. Please wait a moment and try again.';
    normalized.retryable = true;
    return normalized;
  }

  // Fallback to any detail message if present
  if (detailMessage) {
    normalized.message = detailMessage;
  }

  return normalized;
}

export default normalizeApiError;
