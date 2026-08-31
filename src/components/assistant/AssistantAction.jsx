import React from 'react';
import { formatCurrencyINR } from '../../utils/currencyUtils';

export default function AssistantAction({ action, pendingSelection, onOpenPatient, onOpenTreatment, onConfirmAddPatient, onCancelAddPatient }) {
  const hasPreview = pendingSelection && (pendingSelection.prefill || pendingSelection.confirmation);

  const type = action && action.type;

  if (!type && !hasPreview) return null;

  if (hasPreview) {
    const pre = pendingSelection.prefill || {};
    const patient = pre.patient || {};
    const treatment = pre.treatment || {};
    const visit = pre.visit || {};
    const rx = pre.prescription || {};
    const confirmation = pendingSelection.confirmation || {};

    const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="font-semibold text-slate-800 text-base">New Patient Details Preview</span>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">Ready for Confirmation</span>
        </div>

        {/* Step 1: Patient Information */}
        <div className="text-xs space-y-1">
          <div className="font-medium text-slate-500 uppercase tracking-wider">Step 1: Patient Information</div>
          <div className="text-sm font-semibold text-slate-800">{fullName || 'Name Not Set'}</div>
          <div className="text-slate-600">
            {patient.gender ? `Gender: ${patient.gender}` : ''}
            {patient.doctor_name ? ` · Doctor: ${patient.doctor_name}` : ''}
            {patient.mobile ? ` · Mobile: ${patient.mobile}` : ''}
          </div>
          {(patient.medical_history || patient.dental_history) && (
            <div className="text-slate-500 italic mt-0.5">
              {patient.medical_history ? `Medical: ${patient.medical_history}` : ''}
              {patient.medical_history && patient.dental_history ? ' | ' : ''}
              {patient.dental_history ? `Dental: ${patient.dental_history}` : ''}
            </div>
          )}
        </div>

        {/* Step 2: Treatment Details */}
        {(treatment.type_of_treatment_name || treatment.type || treatment.status) && (
          <div className="text-xs space-y-1 border-t pt-2">
            <div className="font-medium text-slate-500 uppercase tracking-wider">Step 2: Treatment Details</div>
            <div className="text-slate-700">
              <span className="font-semibold">{treatment.type_of_treatment_name || treatment.type || 'Treatment'}</span>
              {treatment.status ? ` (${treatment.status})` : ''}
              {treatment.planned_amount ? ` · Planned: ${formatCurrencyINR(treatment.planned_amount)}` : ''}
            </div>
            {(treatment.initial_findings || treatment.treatment_plan) && (
              <div className="text-slate-500 italic">
                {treatment.initial_findings ? `Findings: ${treatment.initial_findings}` : ''}
                {treatment.initial_findings && treatment.treatment_plan ? ' | ' : ''}
                {treatment.treatment_plan ? `Plan: ${treatment.treatment_plan}` : ''}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Visit Details */}
        {(visit.next_visit_date || visit.patient_payment_amount) && (
          <div className="text-xs space-y-1 border-t pt-2">
            <div className="font-medium text-slate-500 uppercase tracking-wider">Step 3: Initial Visit</div>
            <div className="text-slate-700">
              {visit.next_visit_date ? `Next Visit: ${visit.next_visit_date}` : ''}
              {visit.patient_payment_amount ? ` · Payment: ${formatCurrencyINR(visit.patient_payment_amount)} (${visit.patient_payment_type || 'Cash'})` : ''}
            </div>
          </div>
        )}

        {/* Step 4: Prescription */}
        {rx.skipped ? (
          <div className="text-xs text-slate-500 border-t pt-2">Prescription: Skipped</div>
        ) : rx.items && rx.items.length > 0 ? (
          <div className="text-xs text-slate-700 border-t pt-2">Prescription: {rx.items.length} item(s) added</div>
        ) : null}

        <div className="mt-3 flex gap-2 pt-2 border-t">
          <button onClick={() => onConfirmAddPatient(confirmation.action_token)} className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors">Confirm & Create</button>
          <button onClick={() => onCancelAddPatient(confirmation.action_token)} className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors">Cancel</button>
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
