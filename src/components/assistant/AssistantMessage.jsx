import React from 'react';

function renderFormattedText(text) {
  if (!text) return null;

  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (!line.trim()) {
      return <div key={i} className="h-1.5" />;
    }

    // Parse bold text **bold**
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const content = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={j} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <div key={i} className="flex items-start gap-1.5 my-0.5 text-slate-700">
          <span className="text-blue-500 font-bold">•</span>
          <span>{content}</span>
        </div>
      );
    }

    return (
      <p key={i} className="my-0.5 leading-relaxed">
        {content}
      </p>
    );
  });
}

export default function AssistantMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs break-words ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-xs'
            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
        }`}
      >
        <div className="text-sm">
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
          ) : (
            renderFormattedText(message.text)
          )}
        </div>
      </div>
    </div>
  );
}
