import React from 'react';
import AssistantMessage from './AssistantMessage';
import AssistantInput from './AssistantInput';
import AssistantAction from './AssistantAction';
import AssistantPatientSelection from './AssistantPatientSelection';
import AssistantTreatmentSelection from './AssistantTreatmentSelection';

export default function AssistantPanel({ state, actions }) {
  const { messages, loading, lastUsageMetadata, pendingSelection } = state;
  const { onSend, onOpenPatient, onOpenTreatment, onSelectPatient, onSelectTreatment, onConfirmAddPatient, onCancelAddPatient } = actions;

  return (
    <div className="h-full w-full max-w-md border-l border-slate-200 bg-slate-50">
      <div className="flex h-full flex-col p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold">Clinic Assistant</div>
          <div className="text-xs text-slate-500">Read-only · Clinic-scoped</div>
        </div>
        <div className="flex-1 overflow-y-auto pr-2">
          {messages.map((m) => (
            <AssistantMessage key={m.id} message={m} />
          ))}
        </div>

        <div className="mt-3">
          <AssistantInput onSend={onSend} disabled={loading} />
        </div>

        <div className="mt-3">
          <AssistantAction action={state.lastAction} pendingSelection={pendingSelection} onOpenPatient={onOpenPatient} onOpenTreatment={onOpenTreatment} onConfirmAddPatient={onConfirmAddPatient} onCancelAddPatient={onCancelAddPatient} />
        </div>

        <div className="mt-3">
          <AssistantPatientSelection options={state.patientOptions} onSelect={onSelectPatient} />
        </div>

        <div className="mt-3">
          <AssistantTreatmentSelection options={state.treatmentOptions} onSelect={onSelectTreatment} />
        </div>

        <div className="mt-3 text-xs text-slate-500">{lastUsageMetadata ? `Usage: ${lastUsageMetadata.tool_call_count || 0} tools, ${lastUsageMetadata.openai_request_count || 0} requests` : ''}</div>
      </div>
    </div>
  );
}
