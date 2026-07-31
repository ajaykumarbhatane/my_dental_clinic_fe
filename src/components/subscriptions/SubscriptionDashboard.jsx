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

  const parsedDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return 'Not available';

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
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
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
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-700 p-6 text-white shadow-xl shadow-blue-900/10 sm:p-8">
        <div className="relative z-10 max-w-xl">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Sparkles size={23} aria-hidden="true" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200">Your workspace</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">No active subscription</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-blue-100">
            Choose a plan to unlock the tools that help your clinic run with less friction.
          </p>
          <button
            type="button"
            onClick={onChoosePlan}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-950"
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

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-500 p-6 text-white shadow-xl shadow-blue-700/15 sm:p-8">
      <div className="relative z-10">
        <div className="flex flex-col gap-7 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20">
                <Crown size={14} aria-hidden="true" /> Current plan
              </span>
              <span className="rounded-full bg-emerald-400/20 px-3 py-1.5 text-xs font-semibold text-emerald-50 ring-1 ring-emerald-200/20">
                {subscription.status || 'Active'}
              </span>
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight">{planName}</h2>
            <p className="mt-2 text-sm text-blue-100">Your clinic workspace is covered through {formatDate(subscription.end_date)}.</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15 xl:min-w-[180px]">
            <p className="text-xs text-blue-100">Plan value</p>
            <p className="mt-1 text-2xl font-semibold">{formatCurrency(subscription.amount)}</p>
            <p className="mt-1 text-xs text-blue-100">{subscription.duration_days} days</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-3 flex items-end justify-between gap-4 text-sm">
              <span className="font-medium text-blue-50">Plan usage</span>
              <span className="font-semibold text-white">{daysUsed} / {totalDays} days</span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-blue-950/30 ring-1 ring-white/10"
              role="progressbar"
              aria-label="Subscription time used"
              aria-valuemin="0"
              aria-valuemax={totalDays}
              aria-valuenow={daysUsed}
            >
              <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-blue-100">
              <span>{remainingDays} days remaining</span>
              <span>Expires {formatDate(subscription.end_date)}</span>
            </div>
          </div>
          <button
            type="button"
            disabled
            title="Renewal will be available in a future release"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white opacity-75 ring-1 ring-white/20"
          >
            <RefreshCw size={16} aria-hidden="true" /> Renew <span className="text-[10px] uppercase tracking-wider text-blue-100">Coming soon</span>
          </button>
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
        <div key={feature.code || feature.id || feature.name} className="group rounded-2xl border border-slate-200 bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5">
          <div className="flex items-start justify-between gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${feature.available ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              {feature.available ? <Check size={17} aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${feature.available ? 'text-emerald-600' : 'text-slate-400'}`}>
              {feature.available ? 'Included' : hasSubscription ? 'Not included' : 'Locked'}
            </span>
          </div>
          <h3 className="mt-5 text-sm font-semibold text-slate-900">{feature.name}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">{feature.description || 'A focused capability for your clinic.'}</p>
        </div>
      ))}
    </div>
  );
};

const PlanFeatureList = ({ features = [] }) => (
  <ul className="mt-5 space-y-3">
    {features.length ? features.slice(0, 5).map((feature) => (
      <li key={feature.id || feature.code || feature.name} className="flex items-start gap-2 text-sm text-slate-600">
        <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden="true" />
        <span>{feature.name}</span>
      </li>
    )) : (
      <li className="text-sm text-slate-400">Feature details coming soon</li>
    )}
  </ul>
);

const SubscriptionPlanCard = ({ plan, selectedDuration, onDurationChange, onPurchase, purchasing }) => {
  const selectedPricing = getPricing(plan, selectedDuration);
  const isFeatured = plan.code === 'pro' || plan.code === 'advance';
  return (
    <article className={`relative flex min-w-[285px] flex-1 flex-col rounded-[26px] border bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10 ${isFeatured ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'}`}>
      {isFeatured && <span className="absolute right-5 top-5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">Popular</span>}
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isFeatured ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
          {isFeatured ? <Zap size={20} aria-hidden="true" /> : <Package size={19} aria-hidden="true" />}
        </div>
        <div>
          <h3 className="font-semibold text-slate-950">{plan.name}</h3>
          <p className="text-xs text-slate-500">{plan.description || 'A considered plan for growing clinics.'}</p>
        </div>
      </div>
      <div className="mt-7 flex items-end gap-2">
        <span className="text-4xl font-semibold tracking-tight text-slate-950">{formatCurrency(selectedPricing?.price)}</span>
        <span className="pb-1 text-sm text-slate-500">/ {selectedPricing?.duration_days || selectedDuration} days</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label={`${plan.name} duration`}>
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
      <PlanFeatureList features={plan.features || []} />
      <button
        type="button"
        disabled={!selectedPricing || purchasing}
        onClick={() => onPurchase(plan, Number(selectedPricing?.duration_days || selectedDuration))}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {purchasing ? 'Activating...' : 'Choose plan'} <ArrowRight size={16} aria-hidden="true" />
      </button>
    </article>
  );
};

const SubscriptionHistory = ({ history }) => {
  const [expandedId, setExpandedId] = useState(null);
  if (!history.length) {
    return <EmptyState icon={Clock3} title="No subscription history found" description="Your plan activity will appear here after your first purchase." />;
  }
  return (
    <div className="relative space-y-4 before:absolute before:bottom-5 before:left-[19px] before:top-5 before:w-px before:bg-slate-200 sm:before:left-[23px]">
      {history.map((item, index) => {
        const itemId = item.id || index;
        const expanded = expandedId === itemId;
        return (
          <article key={itemId} className="relative pl-11 sm:pl-14">
            <div className="absolute left-2 top-5 flex h-6 w-6 items-center justify-center rounded-full border-4 border-white bg-blue-600 shadow-sm sm:left-2.5" aria-hidden="true">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">{item.plan?.name || 'Subscription'}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${item.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {item.status || 'Expired'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{formatCurrency(item.amount)} · {item.duration_days} days</p>
                </div>
                <button type="button" onClick={() => setExpandedId(expanded ? null : itemId)} className="inline-flex items-center gap-2 self-start rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {expanded ? 'Hide details' : 'View details'} {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> {formatDate(item.start_date)}</span>
                <ArrowRight size={14} className="hidden text-slate-300 sm:block" aria-hidden="true" />
                <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> {formatDate(item.end_date)}</span>
              </div>
              {expanded && (
                <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
                  <div><p className="text-xs text-slate-400">Amount</p><p className="mt-1 text-sm font-semibold text-slate-800">{formatCurrency(item.amount)}</p></div>
                  <div><p className="text-xs text-slate-400">Duration</p><p className="mt-1 text-sm font-semibold text-slate-800">{item.duration_days} days</p></div>
                  <div><p className="text-xs text-slate-400">Features</p><p className="mt-1 text-sm font-semibold text-slate-800">{(item.features || []).length || 0} included</p></div>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};

const SubscriptionStats = ({ current, history }) => {
  const totalSpent = history.reduce((total, item) => total + Number(item.amount || 0), 0);
  return (
    <aside className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm"><BarChart3 size={18} /></div>
        <div><p className="text-sm font-semibold text-slate-950">Account snapshot</p><p className="text-xs text-slate-500">A quick view of your plan history</p></div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Stat icon={CreditCard} label="Subscriptions purchased" value={history.length} tone="blue" />
        <Stat icon={Crown} label="Current plan" value={current?.plan?.name || current?.current_plan?.name || 'None'} tone="cyan" />
        <Stat icon={CalendarDays} label="Active since" value={current?.start_date ? formatDate(current.start_date) : 'Not active'} tone="slate" />
        <Stat icon={Wallet} label="Total money spent" value={formatCurrency(totalSpent)} tone="green" />
        <Stat icon={Users} label="Current status" value={current?.status || 'No active plan'} tone="slate" />
      </div>
    </aside>
  );
};

const EmptyState = ({ icon: Icon = Package, title, description, action }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm"><Icon size={21} /></div>
    <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    {action}
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
    const purchaseKey = `${plan.id}-${duration}`;
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
    <div className="relative space-y-10">
      {notice && (
        <div role="status" className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border p-4 shadow-2xl ${notice.type === 'success' ? 'border-emerald-200 bg-white' : 'border-red-200 bg-white'}`}>
          <div className="flex items-start gap-3"><div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{notice.type === 'success' ? <Check size={17} /> : <AlertCircle size={17} />}</div><div><p className="text-sm font-semibold text-slate-900">{notice.message}</p><p className="mt-1 text-xs leading-5 text-slate-500">{notice.detail}</p></div><button type="button" aria-label="Dismiss notification" onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-700">×</button></div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-blue-600">BILLING & ACCESS</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Subscriptions</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Choose the tools your clinic needs, with a clear view of usage and plan history.</p></div>
        <button type="button" onClick={loadSubscriptions} className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"><RefreshCw size={15} /> Refresh</button>
      </div>

      <div id="subscription-current"><ActiveSubscriptionCard subscription={current} onChoosePlan={() => document.getElementById('subscription-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} /></div>

      <section>
        <SectionHeading eyebrow="Included with your plan" title="Features" description="Everything your current subscription makes available to your clinic." />
        <div className="mt-5"><FeatureGrid features={activeFeatures} hasSubscription={Boolean(current)} /></div>
      </section>

      <section id="subscription-plans">
        <SectionHeading eyebrow="Find the right fit" title="Available plans" description="Switch between durations to see the exact price before activating a plan." />
        {plans.length ? <div className="mt-5 flex gap-5 overflow-x-auto pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible">{plans.map((plan) => <SubscriptionPlanCard key={plan.id} plan={plan} selectedDuration={selectedDurations[plan.id] || getSelectedDuration(plan)} onDurationChange={(duration) => setSelectedDurations((previous) => ({ ...previous, [plan.id]: duration }))} onPurchase={handlePurchase} purchasing={Boolean(purchasingKey)} />)}</div> : <div className="mt-5"><EmptyState icon={Package} title="No plans available" description="Subscription plans will appear here when they are available for your clinic." /></div>}
      </section>

      <section>
        <SectionHeading eyebrow="Your account" title="Subscription history" description="A transparent timeline of plans purchased by your clinic." />
        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <SubscriptionHistory history={history} />
          <SubscriptionStats current={current} history={history} />
        </div>
      </section>
    </div>
  );
};

export default SubscriptionDashboard;
