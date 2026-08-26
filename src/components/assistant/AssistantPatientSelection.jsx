import React from 'react';

export default function AssistantPatientSelection({ options = [], onSelect }) {
  if (!options || options.length === 0) return null;
  return (
    <div className="space-y-3">
      {options.map((p) => (
        <div key={p.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{p.full_name || `${p.first_name || ''} ${p.last_name || ''}`}</div>
              <div className="text-sm text-slate-600">{p.extra || ''}</div>
            </div>
            <div>
              <button onClick={() => onSelect(p)} className="rounded-2xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Select</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
