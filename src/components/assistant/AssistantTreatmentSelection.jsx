import React from 'react';

export default function AssistantTreatmentSelection({ options = [], onSelect }) {
  if (!options || options.length === 0) return null;
  return (
    <div className="space-y-3">
      {options.map((t) => (
        <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{t.type_of_treatment_name || t.name || 'Treatment'}</div>
              <div className="text-sm text-slate-600">{t.extra || ''}</div>
            </div>
            <div>
              <button onClick={() => onSelect(t)} className="rounded-2xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Select</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
