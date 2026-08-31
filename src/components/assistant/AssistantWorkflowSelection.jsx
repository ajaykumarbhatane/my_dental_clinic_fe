import React from 'react';

export default function AssistantWorkflowSelection({ options, title, onSelect, confirmStyle = false }) {
  if (!options || options.length === 0) return null;

  return (
    <div className="my-3 rounded-2xl border border-blue-100 bg-white p-3.5 shadow-2xs">
      {title && <div className="mb-2 text-xs font-semibold text-slate-700">{title}</div>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isConfirm = opt.id === 'confirm';
          return (
            <button
              key={opt.id || opt.label}
              onClick={() => onSelect(opt.label || opt.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${
                isConfirm || confirmStyle
                  ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
