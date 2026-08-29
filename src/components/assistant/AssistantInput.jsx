import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

export default function AssistantInput({ onSend, disabled, placeholder = "Ask something like 'Open Ajay'..." }) {
  const [value, setValue] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.focus();
  }, []);

  const send = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="relative flex items-center rounded-xl border border-slate-300 bg-white shadow-2xs focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="max-h-28 min-h-[42px] w-full resize-none bg-transparent px-3.5 py-2.5 pr-11 text-sm text-slate-800 placeholder-slate-400 focus:outline-none disabled:opacity-50"
        aria-label="Assistant message input"
      />
      <button
        onClick={send}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 transition"
      >
        <Send size={15} />
      </button>
    </div>
  );
}
