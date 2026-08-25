import React from 'react';
import { X } from 'lucide-react';

export default function PrescriptionAIReviewModal({ isOpen, aiDraft, setAiDraft, onClose, onApply }) {
  if (!isOpen || !aiDraft) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[20px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">✨ AI Prescription Suggestion</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">AI draft — dentist must review and approve</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Diagnosis</label>
              <input className="input-ui" value={aiDraft.diagnosis || ''} onChange={(e) => setAiDraft((d) => ({ ...d, diagnosis: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Treatment Summary</label>
              <textarea rows={2} className="input-ui" value={aiDraft.treatment_summary || ''} onChange={(e) => setAiDraft((d) => ({ ...d, treatment_summary: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Medicines</label>
              <div className="space-y-3">
                {(aiDraft.medications || []).map((m, idx) => (
                  <div key={idx} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
                    <div>
                      <label className="text-xs text-slate-600">Name</label>
                      <input className="input-ui" value={m.name || ''} onChange={(e) => setAiDraft((d) => { const meds = [...d.medications]; meds[idx].name = e.target.value; return { ...d, medications: meds }; })} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600">Dosage</label>
                      <input className="input-ui" value={m.dosage || ''} onChange={(e) => setAiDraft((d) => { const meds = [...d.medications]; meds[idx].dosage = e.target.value; return { ...d, medications: meds }; })} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600">Frequency</label>
                      <input className="input-ui" value={m.frequency || ''} onChange={(e) => setAiDraft((d) => { const meds = [...d.medications]; meds[idx].frequency = e.target.value; return { ...d, medications: meds }; })} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600">Duration</label>
                      <input className="input-ui" value={m.duration || ''} onChange={(e) => setAiDraft((d) => { const meds = [...d.medications]; meds[idx].duration = e.target.value; return { ...d, medications: meds }; })} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600">Timing</label>
                      <select className="input-ui" value={m.timing || 'AFTER_FOOD'} onChange={(e) => setAiDraft((d) => { const meds = [...d.medications]; meds[idx].timing = e.target.value; return { ...d, medications: meds }; })}>
                        <option value="BEFORE_FOOD">Before Food</option>
                        <option value="AFTER_FOOD">After Food</option>
                        <option value="AFTERNOON">Afternoon</option>
                        <option value="ANYTIME">Anytime</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-600">Notes</label>
                      <input className="input-ui" value={m.notes || ''} onChange={(e) => setAiDraft((d) => { const meds = [...d.medications]; meds[idx].notes = e.target.value; return { ...d, medications: meds }; })} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Instructions</label>
              <textarea rows={3} className="input-ui" value={(aiDraft.instructions || []).join('\n')} onChange={(e) => setAiDraft((d) => ({ ...d, instructions: e.target.value.split('\n') }))} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Next Visit Advice</label>
              <input className="input-ui" value={aiDraft.next_visit_advice || ''} onChange={(e) => setAiDraft((d) => ({ ...d, next_visit_advice: e.target.value }))} />
            </div>

            <div className="text-sm text-slate-500">
              <p className="font-semibold">AI draft — dentist must review and approve</p>
              <p>Do not treat this as final.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-4 py-3">
          <button onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
          <button onClick={() => onApply(aiDraft)} className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Apply to Prescription</button>
        </div>
      </div>
    </div>
  );
}
