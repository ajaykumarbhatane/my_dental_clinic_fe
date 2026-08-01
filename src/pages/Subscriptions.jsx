import { lazy, Suspense } from 'react';

const SubscriptionDashboard = lazy(() => import('../components/subscriptions/SubscriptionDashboard'));

const SubscriptionLoading = () => (
  <div className="space-y-8" aria-label="Loading subscriptions">
    <div className="skeleton h-64 rounded-[28px]" />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="skeleton h-36 rounded-2xl" />
      <div className="skeleton h-36 rounded-2xl" />
      <div className="skeleton h-36 rounded-2xl" />
      <div className="skeleton h-36 rounded-2xl" />
    </div>
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="skeleton h-96 rounded-[26px]" />
      <div className="skeleton h-96 rounded-[26px]" />
      <div className="skeleton h-96 rounded-[26px]" />
    </div>
  </div>
);

const Subscriptions = () => (
  <Suspense fallback={<SubscriptionLoading />}>
    <SubscriptionDashboard />
  </Suspense>
);

export default Subscriptions;
