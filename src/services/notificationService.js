// Lightweight bridge for non-React modules (like api client) to trigger UI notifications.
let notifier = null;

export function registerNotifier(fn) {
  notifier = fn;
}

export function showSuccess(message, duration) {
  if (typeof notifier === 'function') notifier(message, 'success', duration);
}

export function showError(message, duration) {
  if (typeof notifier === 'function') notifier(message, 'error', duration);
}

export function showInfo(message, duration) {
  if (typeof notifier === 'function') notifier(message, 'info', duration);
}

export function showWarning(message, duration) {
  if (typeof notifier === 'function') notifier(message, 'warning', duration);
}

export default { registerNotifier, showSuccess, showError, showInfo, showWarning };
