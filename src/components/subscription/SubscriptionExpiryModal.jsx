/**
 * SubscriptionExpiryModal
 *
 * Professional modal component for displaying subscription expiry warnings
 * Shows different states: reminder (5-3 days), urgent (2-1 days), expired
 * Fully responsive for desktop and mobile
 * Accessible with proper ARIA attributes
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import { getSubscriptionExpiryState } from '../../utils/subscriptionUtils';

const SubscriptionExpiryModal = ({ isOpen, subscription, onClose }) => {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const focusTrapRef = useRef(null);

  const expiryState = getSubscriptionExpiryState(subscription);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modalElement = modalRef.current;
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Set initial focus to first interactive element
    firstElement.focus();

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const handleRenewClick = () => {
    onClose();
    // Navigate to subscriptions and request the subscriptions page open the renew modal
    navigate('/app/subscriptions', { state: { openRenewModal: true } });
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking directly on backdrop, not on modal
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !expiryState) {
    return null;
  }

  // Select icon based on urgency
  let IconComponent = AlertCircle;
  if (expiryState.type === 'expired') {
    IconComponent = XCircle;
  } else if (expiryState.urgencyLevel === 'urgent') {
    IconComponent = AlertTriangle;
  }

  // Format expiry date for display
  const formatExpiryDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
      onClick={handleBackdropClick}
      role="presentation"
    >
      {/* Modal */}
      <div
        ref={modalRef}
        className={`
          relative w-full max-w-md rounded-2xl bg-white shadow-2xl
          transform transition-all duration-250
          animate-fade-in
          ${expiryState.bgColor}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Close"
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* Content */}
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className={`rounded-full ${expiryState.iconBgColor} p-4`}>
              <IconComponent size={32} className={expiryState.iconColor} aria-hidden="true" />
            </div>
          </div>

          {/* Title */}
          <h2
            id="modal-title"
            className="mb-3 text-center text-xl font-semibold text-slate-900 sm:text-2xl"
          >
            {expiryState.title}
          </h2>

          {/* Plan Name and Expiry */}
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <p className="text-sm font-medium text-slate-600">
              {expiryState.planName}
            </p>
            {expiryState.expiryDate && (
              <p className="text-xs text-slate-500">
                Expires: {formatExpiryDate(expiryState.expiryDate)}
              </p>
            )}
            {expiryState.daysRemaining >= 0 && expiryState.type !== 'expired' && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/50 px-3 py-1">
                <span className={`text-sm font-semibold ${expiryState.iconColor}`}>
                  {expiryState.daysRemaining} day{expiryState.daysRemaining !== 1 ? 's' : ''} remaining
                </span>
              </div>
            )}
          </div>

          {/* Message */}
          <p
            id="modal-description"
            className="mb-7 text-center text-sm leading-6 text-slate-700"
          >
            {expiryState.message}
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            {/* Primary CTA */}
            <button
              onClick={handleRenewClick}
              className={`
                w-full rounded-xl px-6 py-3 text-base font-semibold text-white
                transition-all duration-200
                hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2
                ${expiryState.buttonClass}
              `}
              style={{
                focusRingColor: expiryState.type === 'expired' ? 'rgb(220, 38, 38)' : 'rgb(234, 88, 12)',
              }}
            >
              {expiryState.cta}
            </button>

            {/* Secondary action */}
            <button
              onClick={onClose}
              className="w-full rounded-xl border-2 border-slate-200 px-6 py-3 text-base font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpiryModal;
