import React from 'react';

export default function AssistantAction({ action, pendingSelection, onOpenPatient, onOpenTreatment, onConfirmAddPatient, onCancelAddPatient }) {
  const hasPreview = pendingSelection && (pendingSelection.prefill || pendingSelection.confirmation);

  const type = action && action.type;

  if (!type && !hasPreview) return null;

  if (hasPreview) {
    const pre = pendingSelection.prefill || {};
    const patient = pre.patient || {};
    const treatment = pre.treatment || {};
    const confirmation = pendingSelection.confirmation || {};
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="font-semibold">Add Patient Preview</div>
        <div className="mt-2 text-sm text-slate-700">{(patient.first_name || '') + (patient.last_name ? ` ${patient.last_name}` : '')}</div>
        <div className="mt-1 text-sm text-slate-600">{patient.mobile || ''}{patient.gender ? ` · ${patient.gender}` : ''}</div>
        <div className="mt-1 text-sm text-slate-600">Treatment: {treatment.type || ''} {treatment.planned_amount ? `· ₹${treatment.planned_amount}` : ''}</div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => onConfirmAddPatient(confirmation.action_token)} className="rounded-2xl bg-green-600 px-3 py-2 text-sm font-semibold text-white">Confirm & Create</button>
          <button onClick={() => onCancelAddPatient(confirmation.action_token)} className="rounded-2xl bg-gray-200 px-3 py-2 text-sm font-semibold">Cancel</button>
        </div>
      </div>
    );
  }

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
