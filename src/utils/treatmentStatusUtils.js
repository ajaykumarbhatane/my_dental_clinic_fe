import { useChoiceOptions } from './useChoices';

const STATUS_STYLE_MAP = {
  scheduled: 'bg-amber-100 text-amber-800 border border-amber-200',
  ongoing: 'bg-blue-100 text-blue-800 border border-blue-200',
  sent_to_lab: 'bg-purple-100 text-purple-800 border border-purple-200',
  received_from_lab: 'bg-teal-100 text-teal-800 border border-teal-200',
  completed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-800 border border-rose-200',
  on_hold: 'bg-orange-100 text-orange-800 border border-orange-200',
};

/**
 * Returns Tailwind CSS badge classes for a given treatment status value.
 * Uses a safe fallback style for unknown/new statuses.
 */
export const getTreatmentStatusStyle = (status) => {
  if (!status) return 'bg-slate-100 text-slate-700 border border-slate-200';
  const key = String(status).toLowerCase();
  return STATUS_STYLE_MAP[key] || 'bg-slate-100 text-slate-700 border border-slate-200';
};

/**
 * Returns the human-readable label for a treatment status using backend choices.
 * Falls back to title-casing the status key if choices are loading or choice not found.
 */
export const getTreatmentStatusLabel = (status, choices = []) => {
  if (!status) return '';
  if (Array.isArray(choices) && choices.length > 0) {
    const found = choices.find((item) => item.value === status);
    if (found?.label) return found.label;
  }
  return String(status)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Hook to fetch treatment status options from backend choice API.
 */
export const useTreatmentStatusChoices = (params = {}) => {
  return useChoiceOptions('treatment/status', params);
};
