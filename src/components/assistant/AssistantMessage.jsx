import React from 'react';

export default function AssistantMessage({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`mb-3 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`${isUser ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-800'} max-w-[78%] rounded-xl p-3 shadow-sm`}> 
        <div className="text-sm whitespace-pre-wrap">{message.text}</div>
        {/* optional timestamp small */}
      </div>
    </div>
  );
}
