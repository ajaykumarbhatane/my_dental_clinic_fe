/**
 * Subscription expiry utilities
 *
 * Centralized logic for determining subscription status and expiry messages
 * Keeps components clean and logic reusable
 */

const REMINDER_THRESHOLD_DAYS = 5;

/**
 * Determines the subscription expiry state based on remaining days and status
 * @param {Object} subscription - Subscription object from API
 * @returns {Object|null} Expiry state object or null if no warning needed
 */
export const getSubscriptionExpiryState = (subscription) => {
  if (!subscription) {
    return null;
  }

  const { status, remaining_days: remainingDays, plan, end_date: endDate } = subscription;

  // No warning for non-active subscriptions unless expired
  if (status !== 'active' && status !== 'expired') {
    return null;
  }

  // Expired subscription
  if (status === 'expired' || remainingDays < 0) {
    return {
      type: 'expired',
      title: 'Your subscription has expired',
      message: `Your ${plan?.name || 'Professional'} Plan has expired. Renew your subscription to continue accessing premium clinic management features.`,
      daysRemaining: 0,
      cta: 'View Plans & Renew',
      urgencyLevel: 'critical',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      iconBgColor: 'bg-red-100',
      buttonClass: 'bg-red-600 hover:bg-red-700',
    };
  }

  // Check if within threshold
  if (remainingDays > REMINDER_THRESHOLD_DAYS) {
    return null; // No warning needed
  }

  // Determine urgency level and message based on days remaining
  let urgencyLevel, title, message, cta, bgColor, iconColor, iconBgColor, buttonClass;

  if (remainingDays === 1) {
    urgencyLevel = 'urgent';
    title = 'Your plan expires tomorrow';
    message = `Your ${plan?.name || 'Professional'} Plan expires tomorrow. Renew now to keep uninterrupted access to MyDentalClinicPro.`;
    cta = 'Renew Now';
    bgColor = 'bg-orange-50';
    iconColor = 'text-orange-600';
    iconBgColor = 'bg-orange-100';
    buttonClass = 'bg-orange-600 hover:bg-orange-700';
  } else if (remainingDays === 0) {
    urgencyLevel = 'urgent';
    title = 'Your plan expires today';
    message = `Your ${plan?.name || 'Professional'} Plan expires today. Renew now to avoid interruption to your clinic management and premium features.`;
    cta = 'Renew Now';
    bgColor = 'bg-orange-50';
    iconColor = 'text-orange-600';
    iconBgColor = 'bg-orange-100';
    buttonClass = 'bg-orange-600 hover:bg-orange-700';
  } else if (remainingDays === 2) {
    urgencyLevel = 'urgent';
    title = 'Your plan expires soon';
    message = `Your ${plan?.name || 'Professional'} Plan will expire in ${remainingDays} days. Renew now to avoid interruption to your clinic operations.`;
    cta = 'Renew Subscription';
    bgColor = 'bg-orange-50';
    iconColor = 'text-orange-600';
    iconBgColor = 'bg-orange-100';
    buttonClass = 'bg-orange-600 hover:bg-orange-700';
  } else if (remainingDays === 3) {
    urgencyLevel = 'warning';
    title = 'Your plan expires soon';
    message = `Your ${plan?.name || 'Professional'} Plan will expire in ${remainingDays} days. Renew now to keep uninterrupted access to MyDentalClinicPro.`;
    cta = 'Renew Subscription';
    bgColor = 'bg-amber-50';
    iconColor = 'text-amber-600';
    iconBgColor = 'bg-amber-100';
    buttonClass = 'bg-amber-600 hover:bg-amber-700';
  } else {
    // 4-5 days
    urgencyLevel = 'reminder';
    title = 'Your plan expires soon';
    message = `Your ${plan?.name || 'Professional'} Plan will expire in ${remainingDays} days. Renew now to avoid interruption to your clinic management and premium features.`;
    cta = 'Renew Subscription';
    bgColor = 'bg-amber-50';
    iconColor = 'text-amber-600';
    iconBgColor = 'bg-amber-100';
    buttonClass = 'bg-amber-600 hover:bg-amber-700';
  }

  return {
    type: 'warning',
    title,
    message,
    daysRemaining: remainingDays,
    cta,
    urgencyLevel,
    planName: plan?.name || 'Professional',
    expiryDate: endDate,
    bgColor,
    iconColor,
    iconBgColor,
    buttonClass,
  };
};

/**
 * Determines if a subscription warning should be displayed
 * @param {Object} subscription - Subscription object from API
 * @returns {boolean} True if warning should be shown
 */
export const shouldShowSubscriptionWarning = (subscription) => {
  const state = getSubscriptionExpiryState(subscription);
  return state !== null;
};

/**
 * Constant for the reminder threshold days
 * @returns {number} Number of days to show reminder before expiry
 */
export const getReminderThresholdDays = () => REMINDER_THRESHOLD_DAYS;
