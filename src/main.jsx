import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary'

// Global error overlay (catches errors that occur outside React render cycle)
const showErrorOverlay = (message, stack) => {
  const existing = document.getElementById('global-error-overlay');
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = 'global-error-overlay';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.65)';
  overlay.style.color = 'white';
  overlay.style.padding = '24px';
  overlay.style.zIndex = '9999';
  overlay.style.overflowY = 'auto';
  overlay.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';

  const title = document.createElement('h1');
  title.textContent = '💥 Runtime error';
  title.style.marginTop = '0';
  title.style.fontSize = '1.5rem';
  overlay.appendChild(title);

  const msg = document.createElement('pre');
  msg.textContent = message;
  msg.style.whiteSpace = 'pre-wrap';
  msg.style.marginBottom = '16px';
  overlay.appendChild(msg);

  if (stack) {
    const stackEl = document.createElement('pre');
    stackEl.textContent = stack;
    stackEl.style.whiteSpace = 'pre-wrap';
    overlay.appendChild(stackEl);
  }

  document.body.appendChild(overlay);
};

window.addEventListener('error', (event) => {
  showErrorOverlay(event.message, event.error?.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  showErrorOverlay('Unhandled promise rejection', event.reason?.stack || event.reason);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)