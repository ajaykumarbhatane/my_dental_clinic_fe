import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  CreditCard,
  Crown,
  Lock,
  Package,
  RefreshCw,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { subscriptionService } from '../../api/subscriptionService';

const durationOptions = [30, 90, 180, 365];

const unwrapList = (response) => {
  const data = response?.data;
  return Array.isArray(data) ? data : data?.results || [];
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
};

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

const getErrorMessage = (error) => (
  error?.response?.data?.detail
  || error?.response?.data?.duration_days?.[0]
  || error?.response?.data?.error
  || 'We could not load subscription information. Please try again.'
);

const SkeletonBlock = ({ className = '' }) => (
  <div className={`skeleton rounded-xl ${className}`} aria-hidden="true" />
);

const SectionHeading = ({ eyebrow, title, description, action }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">{eyebrow}</p>
      <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
      {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
    </div>
    {action}
  </div>
);

const Stat = ({ icon: Icon, label, value, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={17} aria-hidden="true" />
      </div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
};

const ActiveSubscriptionCard = ({ subscription, onChoosePlan }) => {
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
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-950"
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
  const planName = subscription.plan?.name || subscription.current_plan?.name || 'Current plan';
  const statusLabel = (subscription.status || 'active').toLowerCase() === 'active' ? 'Active' : (subscription.status || 'Active');

  return (
    <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-slate-950 via-blue-900 to-cyan-600 p-6 text-white shadow-[0_24px_60px_-28px_rgba(29,78,216,0.7)] sm:p-7">
      <div className="relative z-10">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_185px] xl:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white/90 ring-1 ring-white/20">
                <Crown size={13} aria-hidden="true" /> Current plan
              </span>
              <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-[11px] font-semibold text-emerald-50 ring-1 ring-emerald-200/30">
                {statusLabel}
              </span>
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">{planName}</h2>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-100">
              <span className="inline-flex items-center gap-2"><CalendarDays size={14} aria-hidden="true" /> Start {formatDate(subscription.start_date)}</span>
              <span className="inline-flex items-center gap-2"><CalendarDays size={14} aria-hidden="true" /> End {formatDate(subscription.end_date)}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-blue-100">Plan value</p>
            <p className="mt-1 text-2xl font-semibold text-white">{formatCurrency(subscription.amount)}</p>
            <p className="mt-1 text-xs text-blue-100">{subscription.duration_days} days</p>
            {/* <p className="mt-2 text-xs text-blue-100">End date: {formatDate(subscription.end_date)}</p> */}
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm text-blue-50">
              <span className="font-medium">Usage</span>
              <span className="font-semibold text-white">{remainingDays} days remaining</span>
            </div>
            <div
              className="h-3.5 overflow-hidden rounded-full bg-white/15 ring-1 ring-white/15"
              role="progressbar"
              aria-label="Subscription time used"
              aria-valuemin="0"
              aria-valuemax={totalDays}
              aria-valuenow={daysUsed}
            >
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-200 to-white transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
            {/* <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-blue-100">
              <span>Started {formatDate(subscription.start_date)}</span>
              <span>Ends {formatDate(subscription.end_date)}</span>
            </div> */}
          </div>

          {/* <button
            type="button"
            disabled
            title="Renewal will be available in a future release"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/12 px-4 py-2.5 text-sm font-semibold text-white opacity-75 ring-1 ring-white/20"
          >
            <RefreshCw size={16} aria-hidden="true" /> Renew <span className="text-[10px] uppercase tracking-[0.2em] text-blue-100">Soon</span>
          </button> */}
        </div>
      </div>
    </section>
  );
};

const FeatureGrid = ({ features = [], hasSubscription }) => {
  const fallbackFeatures = [
    { code: 'sms', name: 'SMS', description: 'Reach patients with timely updates.', available: false },
    { code: 'report', name: 'Reports', description: 'Understand clinic performance at a glance.', available: false },
    { code: 'ai', name: 'AI tools', description: 'Accelerate everyday clinical workflows.', available: false },
    { code: 'whatsapp', name: 'WhatsApp', description: 'Keep conversations close to your workflow.', available: false },
  ];
  const items = features.length ? features.map((item) => ({ ...item, available: true })) : fallbackFeatures;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((feature) => (
        <div key={feature.code || feature.id || feature.name} className="group rounded-[20px] border border-slate-200 bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5">
          <div className="flex items-center justify-between gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${feature.available ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              {feature.available ? <Check size={17} aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${feature.available ? 'text-emerald-600' : 'text-slate-400'}`}>
              {feature.available ? 'Included' : hasSubscription ? 'Not included' : 'Locked'}
            </span>
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">{feature.name}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">{feature.description || 'A focused capability for your clinic.'}</p>
        </div>
      ))}
    </div>
  );
};

const PlanFeatureList = ({ features = [] }) => (
  <div className="mt-4 flex flex-wrap gap-2">
    {features.length ? features.slice(0, 5).map((feature) => (
      <span key={feature.id || feature.code || feature.name} className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        <Check size={13} aria-hidden="true" /> {feature.name}
      </span>
    )) : (
      <span className="text-xs text-slate-400">Feature details coming soon</span>
    )}
  </div>
);

const SubscriptionPlanCard = ({ plan, selectedDuration, onDurationChange, onPurchase, purchasing, isCurrentActivePlan, isActivating }) => {
  const selectedPricing = getPricing(plan, selectedDuration);
  const isFeatured = plan.code === 'pro' || plan.code === 'advance';
  const buttonLabel = isCurrentActivePlan ? 'Current plan active' : isActivating ? 'Activating...' : 'Purchase plan';
  const featureBadges = (plan.features || []).slice(0, 4);

  return (
    <article className={`relative flex min-w-[285px] flex-1 flex-col rounded-[24px] border bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(29,78,216,0.55)] ${isFeatured ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'}`}>
      {isFeatured && <span className="absolute right-4 top-4 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">Popular</span>}
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isFeatured ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
          {isFeatured ? <Zap size={18} aria-hidden="true" /> : <Package size={18} aria-hidden="true" />}
        </div>
        <div>
          <h3 className="font-semibold text-slate-950">{plan.name}</h3>
          <p className="text-xs text-slate-500">{plan.description || 'A considered plan for growing clinics.'}</p>
        </div>
      </div>
      <div className="mt-5 flex items-end gap-2">
        <span className="text-3xl font-semibold tracking-tight text-slate-950">{formatCurrency(selectedPricing?.price)}</span>
        <span className="pb-1 text-sm text-slate-500">/ {selectedPricing?.duration_days || selectedDuration} days</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label={`${plan.name} duration`}>
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
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${selected ? 'bg-blue-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {duration} days
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {featureBadges.length ? featureBadges.map((feature) => (
          <span key={feature.id || feature.code || feature.name} className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
            <Check size={12} aria-hidden="true" /> {feature.name}
          </span>
        )) : <span className="text-xs text-slate-400">Feature details coming soon</span>}
      </div>
      <button
        type="button"
        disabled={!selectedPricing || purchasing || isCurrentActivePlan}
        onClick={() => onPurchase(plan, Number(selectedPricing?.duration_days || selectedDuration))}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {buttonLabel} <ArrowRight size={16} aria-hidden="true" />
      </button>
    </article>
  );
};

const SubscriptionHistory = ({ history, showAllHistory = false }) => {
  const [expandedId, setExpandedId] = useState(null);
  if (!history.length) {
    return <EmptyState icon={Clock3} title="No subscription history found" description="Your plan activity will appear here after your first purchase." />;
  }

  const visibleHistory = showAllHistory ? history : history.slice(0, 5);

  return (
    <div className="space-y-3">
      {visibleHistory.map((item, index) => {
        const itemId = item.id || index;
        const expanded = expandedId === itemId;
        return (
          <article key={itemId} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:border-blue-200 hover:shadow-md">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-950">{item.plan?.name || 'Subscription'}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${item.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {item.status || 'Expired'}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>{formatCurrency(item.amount)}</span>
                  <span>·</span>
                  <span>{item.duration_days} days</span>
                  <span>·</span>
                  <span>Start {formatDate(item.start_date)}</span>
                  <span>·</span>
                  <span>End {formatDate(item.end_date)}</span>
                </div>
              </div>
              <button type="button" onClick={() => setExpandedId(expanded ? null : itemId)} className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {expanded ? 'Hide details' : 'View details'} {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>
            {expanded && (
              <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                <div><p className="text-xs text-slate-400">Start date</p><p className="mt-1 text-sm font-semibold text-slate-800">{formatDate(item.start_date)}</p></div>
                <div><p className="text-xs text-slate-400">End date</p><p className="mt-1 text-sm font-semibold text-slate-800">{formatDate(item.end_date)}</p></div>
                <div><p className="text-xs text-slate-400">Amount</p><p className="mt-1 text-sm font-semibold text-slate-800">{formatCurrency(item.amount)}</p></div>
                <div><p className="text-xs text-slate-400">Duration</p><p className="mt-1 text-sm font-semibold text-slate-800">{item.duration_days} days</p></div>
                <div className="sm:col-span-2 xl:col-span-4"><p className="text-xs text-slate-400">Features</p><div className="mt-2 flex flex-wrap gap-2">{(item.features || []).length ? (item.features || []).map((feature) => <span key={feature.id || feature.code || feature.name} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{feature.name}</span>) : <span className="text-sm text-slate-500">No feature details</span>}</div></div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};

const SubscriptionStats = ({ current, history }) => {
  const totalSpent = history.reduce((total, item) => total + Number(item.amount || 0), 0);
  const stats = [
    { icon: Crown, label: 'Current plan', value: current?.plan?.name || current?.current_plan?.name || 'None', tone: 'cyan' },
    { icon: CalendarDays, label: 'Active since', value: current?.start_date ? formatDate(current.start_date) : 'Not active', tone: 'slate' },
    { icon: CreditCard, label: 'Subscriptions purchased', value: history.length, tone: 'blue' },
    { icon: Wallet, label: 'Total money spent', value: formatCurrency(totalSpent), tone: 'green' },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.tone === 'blue' ? 'bg-blue-50 text-blue-700' : stat.tone === 'cyan' ? 'bg-cyan-50 text-cyan-700' : stat.tone === 'green' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
              <stat.icon size={17} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
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
      <h3 className="mt-4 text-xl font-semibold text-slate-950">Confirm plan activation</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        You are about to activate <span className="font-semibold text-slate-900">{plan?.name}</span> for <span className="font-semibold text-slate-900">{duration} days</span>.
        The current active plan will be paused and resumed later automatically when the new plan expires.
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
          {submitting ? 'Activating...' : 'Confirm activation'}
        </button>
      </div>
    </div>
  </div>
);

const SubscriptionLoading = () => (
  <div className="space-y-8" aria-label="Loading subscriptions">
    <SkeletonBlock className="h-64" />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><SkeletonBlock className="h-36" /><SkeletonBlock className="h-36" /><SkeletonBlock className="h-36" /><SkeletonBlock className="h-36" /></div>
    <div className="grid gap-5 lg:grid-cols-3"><SkeletonBlock className="h-96" /><SkeletonBlock className="h-96" /><SkeletonBlock className="h-96" /></div>
  </div>
);

const SubscriptionDashboard = () => {
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedDurations, setSelectedDurations] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState('');
  const [purchasingKey, setPurchasingKey] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [activatingPlanId, setActivatingPlanId] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

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
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      setLoadingError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

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

  const confirmPendingPurchase = async () => {
    if (!pendingPlan) return;

    const { plan, duration } = pendingPlan;
    const purchaseKey = `${plan.id}-${duration}`;
    setActivatingPlanId(plan.id);
    setPurchasingKey(purchaseKey);
    setNotice(null);

    try {
      await subscriptionService.purchaseSubscription({ plan: plan.id, duration_days: duration });
      await loadSubscriptions();
      setNotice({ type: 'success', message: 'Subscription Activated', detail: `${plan.name} is now active for your clinic.` });
    } catch (error) {
      console.error('Subscription purchase failed:', error);
      setNotice({ type: 'error', message: 'Purchase could not be completed', detail: getErrorMessage(error) });
    } finally {
      setPurchasingKey(null);
      setActivatingPlanId(null);
      setPendingPlan(null);
    }
  };

  const activeFeatures = useMemo(() => current?.features || [], [current]);

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
      {notice && (
        <div role="status" className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border p-4 shadow-2xl ${notice.type === 'success' ? 'border-emerald-200 bg-white' : 'border-red-200 bg-white'}`}>
          <div className="flex items-start gap-3"><div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{notice.type === 'success' ? <Check size={17} /> : <AlertCircle size={17} />}</div><div><p className="text-sm font-semibold text-slate-900">{notice.message}</p><p className="mt-1 text-xs leading-5 text-slate-500">{notice.detail}</p></div><button type="button" aria-label="Dismiss notification" onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-700">×</button></div>
        </div>
      )}

      {pendingPlan && (
        <ConfirmPlanModal
          plan={pendingPlan.plan}
          duration={pendingPlan.duration}
          submitting={Boolean(purchasingKey)}
          onCancel={() => setPendingPlan(null)}
          onConfirm={confirmPendingPurchase}
        />
      )}

      {/* <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-blue-600">BILLING & ACCESS</p><h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-950">Subscriptions</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Choose the tools your clinic needs, with a clear view of usage and plan history.</p></div>
        <button type="button" onClick={loadSubscriptions} className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"><RefreshCw size={15} /> Refresh</button>
      </div> */}

      <div id="subscription-current"><ActiveSubscriptionCard subscription={current} onChoosePlan={() => document.getElementById('subscription-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} /></div>

      <section>
        <SubscriptionStats current={current} history={history} />
      </section>

      <section id="subscription-plans">
        <SectionHeading title="Available Plans" />
        {plans.length ? <div className="mt-4 flex gap-5 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible">{plans.map((plan) => <SubscriptionPlanCard key={plan.id} plan={plan} selectedDuration={selectedDurations[plan.id] || getSelectedDuration(plan)} onDurationChange={(duration) => setSelectedDurations((previous) => ({ ...previous, [plan.id]: duration }))} onPurchase={handlePurchase} purchasing={Boolean(purchasingKey)} isCurrentActivePlan={current?.status === 'active' && (current?.plan?.id || current?.current_plan?.id) === plan.id} isActivating={activatingPlanId === plan.id} />)}</div> : <div className="mt-4"><EmptyState icon={Package} title="No plans available" description="Subscription plans will appear here when they are available for your clinic." /></div>}
      </section>

      <section>
        <SectionHeading title="Current Plan Features"/>
        <div className="mt-4"><FeatureGrid features={activeFeatures} hasSubscription={Boolean(current)} /></div>
      </section>

      <section>
        <SectionHeading title="Subscription history"/>
        <div className="mt-4"><SubscriptionHistory history={history} showAllHistory={showAllHistory} /></div>
        {history.length > 5 && (
          <div className="mt-4 flex justify-center">
            <button type="button" onClick={() => setShowAllHistory((current) => !current)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {showAllHistory ? 'Show latest 5' : 'View all history'} <ChevronDown size={15} aria-hidden="true" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default SubscriptionDashboard;
