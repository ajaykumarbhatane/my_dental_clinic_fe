import React from 'react';

export default function AssistantGenderSelection({ options = [], onSelect }) {
  const genderOptions = options && options.length > 0 ? options : [
    { id: 'male', label: 'Male' },
    { id: 'female', label: 'Female' },
    { id: 'other', label: 'Other' },
    { id: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs mb-3">
      <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
        Select Gender:
      </div>
      <div className="grid grid-cols-2 gap-2">
        {genderOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.label)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-600 hover:border-blue-600 hover:text-white transition active:scale-95 text-center shadow-2xs"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
