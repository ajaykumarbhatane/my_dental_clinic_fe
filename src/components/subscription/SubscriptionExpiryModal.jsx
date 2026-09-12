import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import { getSubscriptionExpiryState } from '../../utils/subscriptionUtils';
import { formatDate } from '../../utils/dateUtils';

const SubscriptionExpiryModal = ({ isOpen, subscription, onClose }) => {
  const navigate = useNavigate();
  const modalRef = useRef(null);

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

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modalElement = modalRef.current;
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement.focus();

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
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
    navigate('/app/subscriptions', { state: { openRenewModal: true } });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !expiryState) {
    return null;
  }

  let IconComponent = AlertTriangle;
  if (expiryState.type === 'expired') {
    IconComponent = XCircle;
  }

  const formattedExpiryDate = formatDate(expiryState.expiryDate);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl transition-all border border-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Icon Badge */}
          <div className="w-14 h-14 rounded-full bg-orange-100/80 text-orange-600 flex items-center justify-center mb-5 border border-orange-200/50">
            <IconComponent size={28} />
          </div>

          {/* Title */}
          <h2
            id="modal-title"
            className="text-xl sm:text-2xl font-bold text-slate-900 mb-1"
          >
            {expiryState.title}
          </h2>

          {/* Plan Name & Expiry Date */}
          <div className="space-y-1 my-2">
            <p className="text-sm font-semibold text-slate-600">
              {expiryState.planName}
            </p>
            {expiryState.expiryDate && (
              <p className="text-xs text-slate-500 font-medium">
                Expires: {formattedExpiryDate}
              </p>
            )}
            {expiryState.daysRemaining >= 0 && expiryState.type !== 'expired' && (
              <p className="text-sm font-bold text-orange-600 pt-1">
                {expiryState.daysRemaining} day{expiryState.daysRemaining !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>

          {/* Message */}
          <p
            id="modal-description"
            className="text-xs sm:text-sm text-slate-600 my-4 leading-relaxed max-w-xs"
          >
            {expiryState.message}
          </p>

          {/* Action Buttons */}
          <div className="w-full space-y-3 pt-2">
            <button
              onClick={handleRenewClick}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-500/20 transition-all"
            >
              {expiryState.cta}
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-sm transition-all"
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
