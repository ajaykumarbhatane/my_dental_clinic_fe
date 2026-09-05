import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';

const LockedFeatureCard = ({
  featureName = 'Premium Feature',
  description = 'This feature is available with an eligible subscription plan.',
  compact = false,
}) => {
  const navigate = useNavigate();

  const handleUpgradeClick = () => {
    navigate('/app/subscriptions#subscription-plans');
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-amber-500/30 rounded-xl backdrop-blur-sm text-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-white flex items-center gap-1.5">
              {featureName}
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Locked
              </span>
            </p>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
        </div>
        <button
          onClick={handleUpgradeClick}
          className="ml-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 transition-all flex items-center gap-1 shrink-0 shadow-md"
        >
          <span>Upgrade</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950 p-8 shadow-2xl backdrop-blur-md text-center max-w-xl mx-auto my-6">
      {/* Decorative ambient background blur */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Lock Badge Icon */}
      <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl mb-4">
        <Lock className="w-8 h-8" />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-extrabold">
          ★
        </div>
      </div>

      <h3 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
        <span>🔒 {featureName}</span>
      </h3>

      <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={handleUpgradeClick}
          className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 hover:opacity-95 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>View Subscription Plans</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Unlock instantly upon plan activation • Upgrade anytime
      </p>
    </div>
  );
};

export default LockedFeatureCard;
