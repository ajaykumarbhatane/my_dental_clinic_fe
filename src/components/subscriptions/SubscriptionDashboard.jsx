import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  CreditCard,
  Crown,
  Info,
  Lock,
  MessageSquare,
  Package,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { subscriptionService } from '../../api/subscriptionService';
import { useEntitlements } from '../../context/EntitlementContext';
import normalizeApiError from '../../utils/errorUtils';
import { loadRazorpay } from '../../services/razorpay';
import razorpayNative from '../../services/razorpayNative';
import {
  createSubscriptionOrder,
  verifySubscriptionPayment,
} from '../../services/subscriptionPaymentService';

const TABS = [
  { id: 'plans', label: 'Available' },
  { id: 'active', label: 'Active' },
  { id: 'history', label: 'Subscription' },
];

const durationOptions = [30, 90, 180, 365];

const getFeatureIcon = (feature) => {
  const code = (feature?.code || feature?.name || '').toLowerCase();
  if (code.includes('sms')) return MessageSquare;
  if (code.includes('report') || code.includes('analytic')) return BarChart3;
  if (code.includes('ai')) return Sparkles;
  if (code.includes('whatsapp')) return Phone;
  if (code.includes('patient') || code.includes('user')) return Users;
  if (code.includes('security') || code.includes('backup')) return ShieldCheck;
  return CheckCircle2;
};

import { formatCurrencyINR } from '../../utils/currencyUtils';

const unwrapList = (response) => {
  const data = response?.data;
  return Array.isArray(data) ? data : data?.results || [];
};

const formatCurrency = (value) => formatCurrencyINR(value, { fractionDigits: 0, allowNullAsZero: true });

const formatDate = (value) => {
  if (!value) return 'Not available';

  let parsedDate = value;

  if (value instanceof Date) {
    parsedDate = value;
  } else if (typeof value === 'string') {
    const trimmedValue = value.trim();
    const isoMatch = trimmedValue.match(/^\d{4}-\d{2}-\d{2}$/);
    const dayMonthYearMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const dayMonthYearDashMatch = trimmedValue.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);

    if (isoMatch) {
      parsedDate = new Date(trimmedValue);
    } else if (dayMonthYearMatch || dayMonthYearDashMatch) {
      const [, day, month, year] = dayMonthYearMatch || dayMonthYearDashMatch;
      parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
    } else {
      parsedDate = new Date(trimmedValue);
    }
  }

  if (parsedDate instanceof Date && Number.isNaN(parsedDate.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
};

const getPricing = (plan, duration) => (
  (plan?.pricing || []).find((item) => Number(item.duration_days) === Number(duration))
  || plan?.pricing?.[0]
  || null
);

const getSelectedDuration = (plan) => Number(plan?.pricing?.[0]?.duration_days || durationOptions[0]);

const getErrorMessage = (error) => {
  const normalized = normalizeApiError(error);
  return normalized.message || 'We could not load subscription information. Please try again.';
};

const SkeletonBlock = ({ className = '' }) => (
  <div className={`skeleton rounded-xl ${className}`} aria-hidden="true" />
);

const SectionHeading = ({ title, description, action }) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
      {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
    </div>
    {action}
  </div>
);

const PlanDetailSection = ({
  plan,
  currentSubscription,
  initialDuration,
  onBack,
  onProceedPurchase,
  isCurrentPlan,
}) => {
  const [selectedDuration, setSelectedDuration] = useState(
    Number(initialDuration || getSelectedDuration(plan))
  );

  const pricingList = plan?.pricing?.length
    ? plan.pricing
    : [90, 180, 365].map((d) => ({ duration_days: d, price: d === 90 ? 19 : d === 180 ? 35 : 65 }));

  const activePricing = getPricing(plan, selectedDuration);
  const displayPlanName = plan?.name === 'Advance' ? 'Advanced' : plan?.name || 'Subscription Plan';
  const isPopular = plan?.code === 'pro' || displayPlanName.toLowerCase().includes('pro');

  const features = plan?.features || [];

  const parseDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'string') {
      const t = val.trim();
      const isoMatch = t.match(/^\d{4}-\d{2}-\d{2}/);
      if (isoMatch) return new Date(t);
      const dmY = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dmY) {
        const [, d, m, y] = dmY;
        return new Date(Number(y), Number(m) - 1, Number(d));
      }
      return new Date(t);
    }
    return null;
  };

  const hasActiveSub = currentSubscription && currentSubscription.status === 'active';
  const endDate = parseDate(currentSubscription?.end_date);

  let activationNotice = null;
  if (hasActiveSub && !isCurrentPlan && endDate) {
    const nextStart = new Date(endDate);
    nextStart.setDate(nextStart.getDate() + 1);
    activationNotice = `This plan will be auto-activated post current plan expiry on ${formatDate(nextStart)}.`;
  } else if (!hasActiveSub) {
    activationNotice = 'Instant Activation: Available immediately upon successful payment.';
  }

  return (
    <div className="space-y-6">
      {/* Back Button Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none"
        >
          <ArrowLeft size={16} /> Back to Available Plans
        </button>
        <span className="text-xs font-medium text-slate-400">
          Available Plans / <span className="font-semibold text-slate-700">{displayPlanName} Details</span>
        </span>
      </div>

      {/* Main Plan Detail Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Hero Header & Duration Selector */}
        <div className="space-y-5 lg:col-span-5">
          <div className={`relative overflow-hidden rounded-[26px] p-6 text-white shadow-xl ${isPopular ? 'bg-gradient-to-br from-blue-700 via-blue-800 to-cyan-600' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950'}`}>
            {isPopular && (
              <span className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xs ring-1 ring-white/30">
                ⭐ MOST POPULAR
              </span>
            )}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-xs">
                {isPopular ? <Zap size={24} /> : <Package size={24} />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{displayPlanName} Plan</h2>
                <p className="text-xs text-blue-100/90">{plan?.description || 'Tailored features for your clinic.'}</p>
              </div>
            </div>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-white">{formatCurrency(activePricing?.price)}</span>
              <span className="text-sm text-blue-200">/ {selectedDuration} days</span>
            </div>

            {/* <div className="mt-2 text-xs font-medium text-blue-200/80">
              Equivalent to ~₹{(Number(activePricing?.price || 0) / (selectedDuration / 30)).toFixed(0)} per month
            </div> */}
          </div>

          <div className="rounded-[24px] border border-slate-200/90 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Subscription Duration</h3>
            <div className="mt-3 space-y-2.5">
              {pricingList.map((p) => {
                const dur = Number(p.duration_days);
                const selected = selectedDuration === dur;
                const price = Number(p.price || 0);
                const monthlyPrice = (price / (dur / 30)).toFixed(0);

                return (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setSelectedDuration(dur)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                      selected
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{dur} Days Duration</span>
                        {selected && (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">₹{monthlyPrice} / month equivalent</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-950">{formatCurrency(price)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Features & Direct Checkout */}
        <div className="flex flex-col justify-between space-y-6 lg:col-span-7">
          <div className="rounded-[24px] border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Included Features & Information</h3>
                <p className="mt-0.5 text-xs text-slate-500">Features provided directly with the {displayPlanName} Plan</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                {features.length} Features Included
              </span>
            </div>

            {/* Dynamic Features List strictly from API */}
            <div className="mt-5 grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {features.length > 0 ? (
                features.map((feature) => {
                  const IconComponent = getFeatureIcon(feature);
                  return (
                    <div
                      key={feature.id || feature.code || feature.name}
                      className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{feature.name}</h4>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {feature.description || 'Feature capability included in this plan.'}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  No feature list returned for this plan.
                </div>
              )}
            </div>

            {/* Activation Notice */}
            {activationNotice && (
              <div className={`mt-6 flex items-start gap-3 rounded-2xl p-4 text-xs font-medium ${hasActiveSub && !isCurrentPlan ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
                <Info size={18} className="shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-semibold text-sm">{activationNotice}</p>
                </div>
              </div>
            )}

            {/* Primary Action Bar */}
            <div className="mt-7 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">Total Price ({selectedDuration} days)</p>
                <p className="text-2xl font-bold text-slate-950">{formatCurrency(activePricing?.price)}</p>
              </div>

              {isCurrentPlan ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-cyan-50 border border-cyan-200 px-6 py-3.5 text-sm font-semibold text-cyan-800 cursor-default shadow-xs"
                >
                  <Check size={16} /> Current Active Plan
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onProceedPurchase(plan, selectedDuration)}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Proceed to Payment ({formatCurrency(activePricing?.price)}) <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActiveSubscriptionCard = ({ subscription, onChoosePlan, onChangePlan, onRenew }) => {
  if (!subscription) {
    return (
      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-700 p-6 text-white shadow-[0_18px_50px_-24px_rgba(29,78,216,0.65)] sm:p-7">
        <div className="relative z-10 max-w-xl">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Sparkles size={21} aria-hidden="true" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200">Current subscription</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">No active subscription</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-blue-100">
            Purchase a plan to unlock the tools that keep your clinic moving.
          </p>
          <button
            type="button"
            onClick={onChoosePlan}
            className="mt-5 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-950"
          >
            Choose a plan <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10 bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 right-20 h-72 w-72 rounded-full border border-cyan-200/10" />
      </section>
    );
  }

  const totalDays = Number(subscription.total_days || subscription.duration_days || 0);
  const remainingDays = Number(subscription.remaining_days || 0);
  const daysUsed = Number(subscription.days_used || Math.max(totalDays - remainingDays, 0));
  const progress = totalDays ? Math.min(Math.max((daysUsed / totalDays) * 100, 0), 100) : 0;
  const rawPlanName = subscription.plan?.name || subscription.current_plan?.name || 'Basic';
  const planName = rawPlanName === 'Advance' ? 'Advanced' : rawPlanName;
  const planDescription = subscription.plan?.description || subscription.current_plan?.description || `${planName} subscription plan`;
  const statusLabel = (subscription.status || 'active').toUpperCase();

  return (
    <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-slate-950 via-blue-900 to-cyan-600 p-6 text-white shadow-[0_24px_60px_-28px_rgba(29,78,216,0.7)] sm:p-7">
      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white/90 ring-1 ring-white/20 uppercase">
            <Crown size={13} aria-hidden="true" className="text-amber-300" /> Current Plan
          </span>
          <span className="rounded-full bg-emerald-400/20 px-3.5 py-1 text-[11px] font-bold tracking-wider text-emerald-300 ring-1 ring-emerald-400/30">
            {statusLabel}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">{planName}</h2>
            <p className="mt-1 text-sm text-blue-100">{planDescription}</p>
          </div>
          <div className="sm:text-right">
            <span className="text-3xl font-bold tracking-tight text-white">{formatCurrency(subscription.amount)}</span>
            <span className="text-sm font-medium text-blue-200"> / {subscription.duration_days || totalDays || 90} days</span>
          </div>
        </div>

        <div className="my-5 border-t border-white/15" />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-3.5 ring-1 ring-white/10">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-200">Start Date</p>
            <p className="mt-1 text-base font-semibold text-white">{formatDate(subscription.start_date)}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3.5 ring-1 ring-white/10">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-200">Expiry Date</p>
            <p className="mt-1 text-base font-semibold text-white">{formatDate(subscription.end_date)}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3.5 ring-1 ring-white/10">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-200">Days Remaining</p>
            <p className="mt-1 text-base font-semibold text-white">{remainingDays} days</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-blue-100">Usage</span>
            <span className="font-semibold text-white">{remainingDays} days remaining</span>
          </div>
          <div
            className="h-3.5 overflow-hidden rounded-full bg-white/15 ring-1 ring-white/15"
            role="progressbar"
            aria-label="Subscription time remaining"
            aria-valuemin="0"
            aria-valuemax={totalDays}
            aria-valuenow={remainingDays}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-white to-cyan-100 transition-all duration-700"
              style={{ width: `${Math.max(0, 100 - progress)}%` }}
            />
          </div>
        </div>

        {subscription.features?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {subscription.features.map((feature) => (
              <span key={feature.id || feature.code || feature.name} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-blue-50 ring-1 ring-white/20">
                <Check size={12} className="text-cyan-300" aria-hidden="true" /> {feature.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => onRenew && onRenew(subscription.plan || subscription.current_plan)}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-900 shadow-md transition hover:-translate-y-0.5 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-950"
          >
            <RefreshCw size={16} aria-hidden="true" /> Renew Plan
          </button>
          <button
            type="button"
            onClick={onChangePlan}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-950"
          >
            <Zap size={16} aria-hidden="true" /> Change Plan
          </button>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10 bg-white/5" />
      <div className="pointer-events-none absolute -bottom-32 right-20 h-72 w-72 rounded-full border border-cyan-200/10" />
    </section>
  );
};

const SubscriptionPlanCard = ({
  plan,
  selectedDuration,
  onDurationChange,
  onPurchase,
  onViewDetail,
  purchasing,
  isCurrentActivePlan,
  isActivating,
}) => {
  const selectedPricing = getPricing(plan, selectedDuration);
  const rawPlanName = plan.name || '';
  const displayPlanName = rawPlanName === 'Advance' ? 'Advanced' : rawPlanName;
  
  // Mark only Pro plan as Popular to avoid badge overload
  const isPopular = plan.code === 'pro' || rawPlanName.toLowerCase().includes('pro');

  let buttonLabel = 'Purchase Plan';
  let isCurrent = false;

  if (isCurrentActivePlan) {
    buttonLabel = 'Current Plan';
    isCurrent = true;
  } else if (isActivating) {
    buttonLabel = 'Activating...';
  } else if (plan.code === 'pro' || plan.code === 'advance') {
    buttonLabel = 'Upgrade Plan';
  } else {
    buttonLabel = 'Purchase Plan';
  }

  const featureBadges = (plan.features || []).slice(0, 5);

  return (
    <article className={`relative flex w-full flex-col rounded-[24px] border bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${isPopular ? 'border-blue-300 ring-2 ring-blue-500/20' : 'border-slate-200'}`}>
      {isPopular && (
        <span className="absolute right-5 top-5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
          ⭐ MOST POPULAR
        </span>
      )}

      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewDetail && onViewDetail(plan)}>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isPopular ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
          {isPopular ? <Zap size={20} aria-hidden="true" /> : <Package size={20} aria-hidden="true" />}
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-950 hover:text-blue-600 transition">{displayPlanName}</h3>
          <p className="text-xs text-slate-500">{plan.description || 'A tailored plan for your clinic operations.'}</p>
        </div>
      </div>

      <div className="mt-5 flex items-baseline gap-1.5 cursor-pointer" onClick={() => onViewDetail && onViewDetail(plan)}>
        <span className="text-3xl font-bold tracking-tight text-slate-950">{formatCurrency(selectedPricing?.price)}</span>
        <span className="text-sm font-medium text-slate-500">/ {selectedPricing?.duration_days || selectedDuration} days</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label={`${displayPlanName} duration`}>
        {(plan.pricing?.length ? plan.pricing.map((pricing) => Number(pricing.duration_days)) : durationOptions).map((duration) => {
          const available = Boolean(getPricing(plan, duration));
          const selected = Number(selectedDuration) === duration;
          return (
            <button
              key={duration}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!available || purchasing}
              onClick={() => onDurationChange(duration)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${selected ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {duration} days
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex-1 space-y-2 border-t border-slate-100 pt-4 cursor-pointer" onClick={() => onViewDetail && onViewDetail(plan)}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Included Features</p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewDetail && onViewDetail(plan); }}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            View plan details →
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {featureBadges.length ? (
            featureBadges.map((feature) => (
              <div key={feature.id || feature.code || feature.name} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check size={11} aria-hidden="true" />
                </div>
                <span>{feature.name}</span>
              </div>
            ))
          ) : (
            <span className="text-xs text-slate-400">Feature details coming soon</span>
          )}
        </div>
      </div>

      <div className="mt-6 pt-2 flex flex-col gap-2">
        {isCurrent ? (
          <button
            type="button"
            disabled
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-50 border border-cyan-200 px-4 py-3 text-sm font-semibold text-cyan-800 cursor-default shadow-sm"
          >
            <Check size={16} aria-hidden="true" /> Current Plan
          </button>
        ) : (
          <button
            type="button"
            disabled={!selectedPricing || purchasing}
            onClick={() => onViewDetail ? onViewDetail(plan) : onPurchase(plan, Number(selectedPricing?.duration_days || selectedDuration))}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-cyan-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buttonLabel} <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
};

const SubscriptionHistory = ({ history, showAllHistory = false, onToggleShowAll }) => {
  const [expandedId, setExpandedId] = useState(null);
  if (!history || !history.length) {
    return <EmptyState icon={Clock3} title="No subscription history found" description="Your plan activity will appear here after your first purchase." />;
  }

  const visibleHistory = showAllHistory ? history : history.slice(0, 5);

  const getStatusBadge = (status) => {
    const s = (status || 'expired').toLowerCase();
    if (s === 'active') {
      return { label: 'ACTIVE', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (s === 'paused') {
      return { label: 'PAUSED', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (s === 'cancelled' || s === 'canceled') {
      return { label: 'CANCELLED', className: 'bg-red-50 text-red-700 border-red-200' };
    }
    return { label: 'EXPIRED', className: 'bg-slate-100 text-slate-600 border-slate-200' };
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {visibleHistory.map((item, index) => {
          const itemId = item.id || index;
          const expanded = expandedId === itemId;
          const rawName = item.plan?.name || 'Subscription';
          const planName = rawName === 'Advance' ? 'Advanced' : rawName;
          const badge = getStatusBadge(item.status);

          return (
            <article key={itemId} className="flex flex-col rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:border-blue-300 hover:shadow-md">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-slate-950">{planName}</h3>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.className}`}>
                  ● {badge.label}
                </span>
              </div>

              <div className="mt-2 text-sm font-semibold text-slate-800">
                {formatCurrency(item.amount)} <span className="text-xs font-normal text-slate-500">• {item.duration_days} days</span>
              </div>

              <div className="my-4 border-t border-slate-100" />

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Started</span>
                  <p className="mt-0.5 font-semibold text-slate-700">{formatDate(item.start_date)}</p>
                </div>
                <div>
                  <span className="text-slate-400">Ended</span>
                  <p className="mt-0.5 font-semibold text-slate-700">{formatDate(item.end_date)}</p>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : itemId)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 focus:outline-none"
                >
                  {expanded ? 'Hide details' : 'View details'} {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {expanded && (
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs space-y-2 border border-slate-200/60">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan Duration:</span>
                    <span className="font-semibold text-slate-800">{item.duration_days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Price:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(item.amount)}</span>
                  </div>
                  {item.features?.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 block mb-1">Features:</span>
                      <div className="flex flex-wrap gap-1">
                        {item.features.map((f) => (
                          <span key={f.id || f.code || f.name} className="rounded-full bg-blue-100/70 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                            {f.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {history.length > 5 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onToggleShowAll}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showAllHistory ? 'Show latest 5' : 'View all history'} <ChevronDown size={15} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};

const EmptyState = ({ icon: Icon = Package, title, description, action }) => (
  <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm"><Icon size={21} /></div>
    <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    {action}
  </div>
);

const ConfirmPlanModal = ({ plan, duration, onCancel, onConfirm, submitting }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4">
    <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <CreditCard size={20} aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-xl font-semibold text-slate-950">
        Confirm your subscription
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        You are about to purchase{' '}
        <span className="font-semibold text-slate-900">
          {plan?.name === 'Advance' ? 'Advanced' : plan?.name}
        </span>{' '}
        for{' '}
        <span className="font-semibold text-slate-900">
          {duration} days
        </span>.
        You will be redirected to Razorpay Checkout to complete
        your payment securely.
      </p>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">Included features</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(plan?.features || []).length ? (plan?.features || []).map((feature) => (
            <span key={feature.id || feature.code || feature.name} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              {feature.name}
            </span>
          )) : <span className="text-sm text-slate-500">No feature details available</span>}
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
          Cancel
        </button>
        <button type="button" onClick={onConfirm} disabled={submitting} className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? 'Opening payment...' : 'Continue to payment'}
        </button>
      </div>
    </div>
  </div>
);

const RenewSubscriptionModal = ({ plan, initialDuration, currentSubscription, onCancel, onConfirm, submitting }) => {
  const defaultDuration = Number(currentSubscription?.duration_days || currentSubscription?.total_days || initialDuration || getSelectedDuration(plan));
  const [duration, setDuration] = useState(defaultDuration);

  const pricing = getPricing(plan, duration);

  const parseDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}/);
      if (isoMatch) return new Date(trimmed);
      const dmY = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      const dmYDash = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (dmY || dmYDash) {
        const [, day, month, year] = dmY || dmYDash;
        return new Date(Number(year), Number(month) - 1, Number(day));
      }
      const t = new Date(trimmed);
      return Number.isNaN(t.getTime()) ? null : t;
    }
    return null;
  };

  const computeEstimatedDates = (current, dur) => {
    const durDays = Number(dur) || 0;
    const endDate = parseDate(current?.end_date);
    let start = new Date();
    if (endDate) {
      start = new Date(endDate);
      start.setDate(start.getDate() + 1);
    }
    const end = new Date(start);
    end.setDate(end.getDate() + durDays - 1);
    return { start, end };
  };

  const { start: estimatedStart, end: estimatedEnd } = computeEstimatedDates(currentSubscription, duration);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><RefreshCw size={20} aria-hidden="true" /></div>
          <div>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">Schedule Renewal</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">This will schedule a renewal for your current plan. Start date is calculated as the day after the current plan ends.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Plan</h4>
            <p className="mt-1 text-sm text-slate-700">{plan?.name === 'Advance' ? 'Advanced' : plan?.name} — {plan?.description}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Duration</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {[90, 180, 365].map((d) => {
                const available = Boolean(getPricing(plan, d));
                const selected = Number(duration) === Number(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => available && setDuration(Number(d))}
                    disabled={!available}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold ${selected ? 'bg-blue-700 text-white' : 'bg-white ring-1 ring-slate-200 text-slate-700'} ${!available ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {d} days
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div>
            <p className="text-xs text-slate-500">Price</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(pricing?.price)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Selected duration</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{duration} days</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Current plan end</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(currentSubscription?.end_date)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Estimated renewal window</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(estimatedStart)} — {formatDate(estimatedEnd)}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
          <button type="button" onClick={() => onConfirm(duration)} disabled={submitting} className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Scheduling...' : 'Schedule Renewal'}</button>
        </div>
      </div>
    </div>
  );
};

const SubscriptionLoading = () => (
  <div className="space-y-6" aria-label="Loading subscriptions">
    <div className="skeleton h-12 w-64 rounded-xl" />
    <div className="skeleton h-10 w-96 rounded-xl" />
    <SkeletonBlock className="h-72" />
  </div>
);

const SubscriptionDashboard = () => {
  const { refetchEntitlements } = useEntitlements();
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedDurations, setSelectedDurations] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState('');
  const [purchasingKey, setPurchasingKey] = useState(null);
  const [notice, setNotice] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewPlan, setRenewPlan] = useState(null);
  const [renewSubmitting, setRenewSubmitting] = useState(false);
  const [activatingPlanId, setActivatingPlanId] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const tabParam = searchParams.get('tab');
  const planParam = searchParams.get('plan');
  const activeTab = TABS.some((t) => t.id === tabParam) ? tabParam : 'active';

  const selectedDetailPlan = useMemo(() => {
    if (!planParam || !plans.length) return null;
    return plans.find((p) => p.code === planParam || String(p.id) === String(planParam)) || null;
  }, [planParam, plans]);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const handleSelectPlanDetail = (plan) => {
    setSearchParams({ tab: 'plans', plan: plan.code || plan.id });
  };

  const handleBackToPlans = () => {
    if (planParam) {
      navigate(-1);
    } else {
      setSearchParams({ tab: 'plans' });
    }
  };

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setLoadingError('');
    try {
      const [plansResponse, currentResponse, historyResponse] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getCurrentSubscription().catch((error) => {
          if (error?.response?.status === 404) return { data: null };
          throw error;
        }),
        subscriptionService.getSubscriptionHistory(),
      ]);
      const nextPlans = unwrapList(plansResponse);
      setPlans(nextPlans);
      setCurrent(currentResponse?.data || null);
      setHistory(unwrapList(historyResponse));
      setSelectedDurations((previous) => nextPlans.reduce((result, plan) => ({
        ...result,
        [plan.id]: previous[plan.id] || getSelectedDuration(plan),
      }), {}));
      refetchEntitlements();
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      setLoadingError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [refetchEntitlements]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  useEffect(() => {
    if (location?.state?.openRenewModal && current) {
      const planToRenew = current?.plan || current?.current_plan;
      if (planToRenew) {
        const matched = plans.find((p) => Number(p.id) === Number(planToRenew?.id) || p.code === planToRenew?.code) || planToRenew;
        setRenewPlan(matched);
        setShowRenewModal(true);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, current, navigate, plans]);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    if (hash === '#subscription-plans') {
      handleTabChange('plans');
    } else if (hash === '#subscription-current') {
      handleTabChange('active');
    } else if (hash === '#subscription-history') {
      handleTabChange('history');
    }
  }, [loading]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const handlePurchase = async (plan, duration) => {
    const activePlanId = current?.plan?.id || current?.current_plan?.id;
    if (current?.status === 'active' && activePlanId === plan.id) {
      setNotice({ type: 'error', message: 'Plan already active', detail: `${plan.name} is already your current active plan.` });
      return;
    }

    setPendingPlan({ plan, duration });
  };

  const handleRenew = async (plan, duration) => {
    setNotice(null);
    try {
      const response = await subscriptionService.renewSubscription({ plan: plan.id, duration_days: duration });
      await loadSubscriptions();
      const historyResp = await subscriptionService.getSubscriptionHistory();
      const historyList = unwrapList(historyResp);
      const scheduled = historyList.find((h) => h.id === response?.data?.subscription_id);
      const detail = scheduled ? `Your ${plan.name} renewal is scheduled to start on ${formatDate(scheduled.start_date)}.` : `Your ${plan.name} renewal has been scheduled.`;
      setNotice({ type: 'success', message: 'Renewal scheduled', detail });
    } catch (error) {
      console.error('Renewal request failed:', error);
      setNotice({ type: 'error', message: 'Renewal failed', detail: getErrorMessage(error) });
    }
  };

  const handlePaymentSuccess = async (response, plan) => {
    try {
      setPaymentProcessing(true);
      setNotice(null);

      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
      } = response || {};

      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        throw new Error('Razorpay returned an incomplete payment response.');
      }

      await verifySubscriptionPayment({
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpaySignature: razorpay_signature,
      });

      await loadSubscriptions();
      handleTabChange('active');

      setNotice({
        type: 'success',
        message: 'Payment successful',
        detail: `${plan.name === 'Advance' ? 'Advanced' : plan.name} is now active for your clinic.`,
      });
    } catch (error) {
      console.error('Payment verification failed:', error);
      setNotice({
        type: 'error',
        message: 'Payment verification failed',
        detail: getErrorMessage(error) || 'Payment could not be verified. Please check your subscription status.',
      });
    } finally {
      setPaymentProcessing(false);
      setPurchasingKey(null);
      setActivatingPlanId(null);
      setPendingPlan(null);
    }
  };

  const openRazorpayCheckout = async (plan, duration) => {
    try {
      setPaymentProcessing(true);
      setNotice(null);

      const order = await createSubscriptionOrder({
        plan: plan.id,
        durationDays: duration,
      });

      if (!order?.razorpay_order_id || !order?.razorpay_key_id || !order?.amount) {
        throw new Error('Payment order was not created correctly by the server.');
      }

      const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
      const platform = window.Capacitor?.getPlatform?.() || 'unknown';

      if (isNative && platform === 'android') {
        const nativeResponse = await razorpayNative.openNativeRazorpay({
          key: order.razorpay_key_id,
          order_id: order.razorpay_order_id,
          amount: Number(order.amount),
          currency: order.currency || 'INR',
        });

        if (nativeResponse?.razorpay_payment_id && nativeResponse?.razorpay_order_id && nativeResponse?.razorpay_signature) {
          await handlePaymentSuccess(nativeResponse, plan);
        }
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        throw new Error('Unable to load Razorpay Checkout. Please try again.');
      }

      const options = {
        key: order.razorpay_key_id,
        amount: Number(order.amount),
        currency: order.currency || 'INR',
        name: 'MyDentalClinicPro',
        description: `${plan.name === 'Advance' ? 'Advanced' : plan.name} - ${duration} days subscription`,
        order_id: order.razorpay_order_id,
        handler: async (response) => {
          await handlePaymentSuccess(response, plan);
        },
        modal: {
          confirm_close: true,
          escape: false,
          backdropclose: false,
          animation: true,
        },
        retry: {
          enabled: true,
          max_count: 4,
        },
        theme: {
          color: '#2563EB',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('modal.ondismiss', () => {
        setPaymentProcessing(false);
        setPurchasingKey(null);
        setActivatingPlanId(null);
        setNotice({
          type: 'error',
          message: 'Payment cancelled',
          detail: 'The payment window was closed. Your subscription has not been activated.',
        });
      });

      razorpay.on('payment.failed', (response) => {
        setPaymentProcessing(false);
        setPurchasingKey(null);
        setActivatingPlanId(null);
        setNotice({
          type: 'error',
          message: 'Payment failed',
          detail: response?.error?.description || 'Your payment could not be completed. Please try again.',
        });
      });

      razorpay.open();
    } catch (error) {
      setPaymentProcessing(false);
      setPurchasingKey(null);
      setActivatingPlanId(null);
      setNotice({
        type: 'error',
        message: 'Payment could not be started',
        detail: error?.message || getErrorMessage(error),
      });
    }
  };

  const confirmPendingPurchase = async () => {
    if (!pendingPlan) return;
    const { plan, duration } = pendingPlan;
    const purchaseKey = `${plan.id}-${duration}`;
    setActivatingPlanId(plan.id);
    setPurchasingKey(purchaseKey);
    setNotice(null);
    await openRazorpayCheckout(plan, duration);
  };

  if (loading) return <SubscriptionLoading />;

  if (loadingError) {
    return (
      <div className="rounded-[26px] border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="mx-auto text-red-600" size={28} aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold text-slate-900">We could not load billing</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{loadingError}</p>
        <button type="button" onClick={loadSubscriptions} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"><RefreshCw size={16} /> Retry</button>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Toast Notification */}
      {notice && (
        <div role="status" className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border p-4 shadow-2xl ${notice.type === 'success' ? 'border-emerald-200 bg-white' : 'border-red-200 bg-white'}`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {notice.type === 'success' ? <Check size={17} /> : <AlertCircle size={17} />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{notice.message}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{notice.detail}</p>
            </div>
            <button type="button" aria-label="Dismiss notification" onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-700">×</button>
          </div>
        </div>
      )}

      {/* Modals */}
      {pendingPlan && (
        <ConfirmPlanModal
          plan={pendingPlan.plan}
          duration={pendingPlan.duration}
          submitting={Boolean(purchasingKey) || paymentProcessing}
          onCancel={() => {
            if (!paymentProcessing) setPendingPlan(null);
          }}
          onConfirm={confirmPendingPurchase}
        />
      )}

      {showRenewModal && renewPlan && (
        <RenewSubscriptionModal
          plan={renewPlan}
          currentSubscription={current}
          initialDuration={current?.duration_days || current?.total_days || getSelectedDuration(renewPlan)}
          submitting={renewSubmitting}
          onCancel={() => { setShowRenewModal(false); setRenewPlan(null); }}
          onConfirm={async (duration) => {
            setRenewSubmitting(true);
            try {
              await handleRenew(renewPlan, duration);
              setShowRenewModal(false);
              setRenewPlan(null);
            } finally {
              setRenewSubmitting(false);
            }
          }}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Billing & Subscription
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your plans, billing and subscription history
        </p>
      </div>

      {/* Responsive Full-Width Segmented Tab Bar */}
      <div className="w-full rounded-2xl bg-slate-100/90 p-1.5 border border-slate-200/80">
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`w-full py-2.5 px-1 sm:px-4 text-center text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {tab.id === 'plans' && (
                  <>
                    <span className="hidden sm:inline">Available Plans</span>
                    <span className="sm:hidden">Available</span>
                  </>
                )}
                {tab.id === 'active' && (
                  <>
                    <span className="hidden sm:inline">Active Plan</span>
                    <span className="sm:hidden">Active</span>
                  </>
                )}
                {tab.id === 'history' && (
                  <>
                    <span className="hidden sm:inline">Subscription History</span>
                    <span className="sm:hidden">History</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT - ONLY ONE RENDERED AT A TIME */}
      {activeTab === 'plans' && (
        <section id="subscription-plans" className="space-y-4">
          {selectedDetailPlan ? (
            <PlanDetailSection
              plan={selectedDetailPlan}
              currentSubscription={current}
              initialDuration={selectedDurations[selectedDetailPlan.id] || getSelectedDuration(selectedDetailPlan)}
              isCurrentPlan={current?.status === 'active' && (current?.plan?.id || current?.current_plan?.id) === selectedDetailPlan.id}
              onBack={handleBackToPlans}
              onProceedPurchase={(plan, duration) => {
                handlePurchase(plan, duration);
              }}
            />
          ) : (
            <>
              <SectionHeading
                title="Available Plans"
                description="Choose the plan that works best for your clinic"
              />
              {plans.length ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {plans.map((plan) => (
                    <SubscriptionPlanCard
                      key={plan.id}
                      plan={plan}
                      selectedDuration={selectedDurations[plan.id] || getSelectedDuration(plan)}
                      onDurationChange={(duration) => setSelectedDurations((previous) => ({ ...previous, [plan.id]: duration }))}
                      onPurchase={handlePurchase}
                      onViewDetail={handleSelectPlanDetail}
                      purchasing={Boolean(purchasingKey)}
                      isCurrentActivePlan={current?.status === 'active' && (current?.plan?.id || current?.current_plan?.id) === plan.id}
                      isActivating={activatingPlanId === plan.id}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Package}
                  title="No plans available"
                  description="Subscription plans will appear here when they are available for your clinic."
                />
              )}
            </>
          )}
        </section>
      )}

      {activeTab === 'active' && (
        <section id="subscription-current" className="space-y-4">
          <SectionHeading
            title="Active Plan"
            description="Your current subscription"
          />
          <ActiveSubscriptionCard
            subscription={current}
            onChoosePlan={() => handleTabChange('plans')}
            onChangePlan={() => handleTabChange('plans')}
            onRenew={(plan) => {
              const matched = plans.find((p) => Number(p.id) === Number(plan?.id) || p.code === plan?.code) || plan;
              setRenewPlan(matched);
              setShowRenewModal(true);
            }}
          />
        </section>
      )}

      {activeTab === 'history' && (
        <section id="subscription-history" className="space-y-4">
          <SectionHeading
            title="Subscription History"
            description="Manage your subscription history"
          />
          <SubscriptionHistory
            history={history}
            showAllHistory={showAllHistory}
            onToggleShowAll={() => setShowAllHistory((prev) => !prev)}
          />
        </section>
      )}
    </div>
  );
};

export default SubscriptionDashboard;

