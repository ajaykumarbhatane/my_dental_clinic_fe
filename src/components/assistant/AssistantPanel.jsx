import React, { useState } from 'react';
import AssistantMessage from './AssistantMessage';
import AssistantInput from './AssistantInput';
import AssistantAction from './AssistantAction';
import AssistantPatientSelection from './AssistantPatientSelection';
import AssistantTreatmentSelection from './AssistantTreatmentSelection';
import { PlusCircle, History, Trash2, MessageSquare, X, Sparkles, Bot } from 'lucide-react';

export default function AssistantPanel({ state, actions }) {
  const {
    messages,
    loading,
    lastUsageMetadata,
    pendingSelection,
    conversationsList,
    conversationId,
  } = state;

  const {
    onSend,
    onOpenPatient,
    onOpenTreatment,
    onSelectPatient,
    onSelectTreatment,
    onConfirmAddPatient,
    onCancelAddPatient,
    onNewChat,
    onSelectConversation,
    onDeleteConversation,
    onClose,
  } = actions;

  const [showHistory, setShowHistory] = useState(false);

  const samplePrompts = [
    "Create patient Mauli Bande",
    "Show patient Prasad",
    "Show today's appointments",
    "Set planned amount to 50000",
  ];

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 overflow-hidden">
      {/* 1. FIXED HEADER */}
      <div className="flex-none border-b border-slate-200 bg-white px-4 py-3 shadow-2xs z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 leading-tight">Clinic Assistant</h2>
              <p className="text-[11px] font-medium text-slate-500">Conversational · Persistent</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onNewChat}
              title="Start New Chat"
              aria-label="Start new chat"
              className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 active:bg-blue-200 transition"
            >
              <PlusCircle size={14} />
              <span className="hidden sm:inline">New</span>
            </button>

            <button
              onClick={() => setShowHistory(!showHistory)}
              title="Recent Conversations"
              aria-label="Toggle history panel"
              className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition ${
                showHistory
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <History size={14} />
              <span className="hidden sm:inline">History</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                title="Close Assistant"
                aria-label="Close assistant"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* History Dropdown / Popover Sheet */}
        {showHistory && (
          <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-inner">
            <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Recent Conversations
            </div>
            {!conversationsList || conversationsList.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400">No recent conversations</div>
            ) : (
              <div className="space-y-1">
                {conversationsList.map((c) => {
                  const isActive = c.id === conversationId;
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition cursor-pointer ${
                        isActive
                          ? 'bg-blue-100/70 text-blue-800 font-semibold'
                          : 'hover:bg-white text-slate-700'
                      }`}
                      onClick={() => {
                        onSelectConversation(c.id);
                        setShowHistory(false);
                      }}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <MessageSquare
                          size={13}
                          className={isActive ? 'text-blue-600' : 'text-slate-400'}
                        />
                        <span className="truncate">{c.title || 'Conversation'}</span>
                      </div>
                      {onDeleteConversation && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(c.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 transition"
                          title="Delete Chat"
                          aria-label="Delete chat"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. SCROLLABLE MESSAGE AREA (ONLY THIS AREA SCROLLS) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/50">
        {!messages || messages.length === 0 ? (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center px-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-3 shadow-2xs">
              <Bot size={24} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">How can I help you today?</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-[240px]">
              Ask questions or manage patients, treatments, and appointments.
            </p>

            <div className="mt-5 w-full space-y-2 max-w-[280px]">
              {samplePrompts.map((promptText) => (
                <button
                  key={promptText}
                  onClick={() => onSend(promptText)}
                  className="w-full text-left text-xs bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-700 font-medium transition shadow-2xs truncate"
                >
                  "{promptText}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <AssistantMessage key={m.id} message={m} />
            ))}

            {loading && (
              <div className="flex justify-start mb-3">
                <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-500 shadow-2xs">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  </span>
                  <span>AI is thinking...</span>
                </div>
              </div>
            )}
          </>
        )}

        <AssistantAction
          action={state.lastAction}
          pendingSelection={pendingSelection}
          onOpenPatient={onOpenPatient}
          onOpenTreatment={onOpenTreatment}
          onConfirmAddPatient={onConfirmAddPatient}
          onCancelAddPatient={onCancelAddPatient}
        />

        <AssistantPatientSelection options={state.patientOptions} onSelect={onSelectPatient} />

        <AssistantTreatmentSelection options={state.treatmentOptions} onSelect={onSelectTreatment} />
      </div>

      {/* 3. FIXED COMPOSER AT BOTTOM */}
      <div className="flex-none border-t border-slate-200 bg-white p-3 shadow-lg z-10">
        <AssistantInput onSend={onSend} disabled={loading} />
        {lastUsageMetadata && (
          <div className="mt-1.5 px-1 text-[10px] text-slate-400 font-medium flex justify-between">
            <span>{lastUsageMetadata.model || 'OpenAI'}</span>
            <span>
              {lastUsageMetadata.tool_call_count || 0} tools ·{' '}
              {lastUsageMetadata.latency_ms ? `${lastUsageMetadata.latency_ms}ms` : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
