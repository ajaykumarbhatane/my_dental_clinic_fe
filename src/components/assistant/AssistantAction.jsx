import React from 'react';

export default function AssistantAction({ action, onOpenPatient, onOpenTreatment }) {
  if (!action) return null;

  const type = action.type;

  if (type === 'OPEN_PATIENT') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="font-semibold">Patient</div>
        <div className="mt-1 text-sm text-slate-700">{action.patient_name || ''}</div>
        <div className="mt-3">
          <button onClick={() => onOpenPatient(action.patient_id)} className="rounded-2xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Open Patient</button>
        </div>
      </div>
    );
  }

  if (type === 'OPEN_TREATMENT') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="font-semibold">Treatment</div>
        <div className="mt-1 text-sm text-slate-700">{action.treatment_name || ''}</div>
        <div className="mt-3">
          <button onClick={() => onOpenTreatment(action.treatment_id, action.visit_id)} className="rounded-2xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Open Treatment</button>
        </div>
      </div>
    );
  }

  return null;
}
