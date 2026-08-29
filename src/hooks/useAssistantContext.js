import { useState, useCallback, useRef } from 'react';

export default function useAssistantContext() {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversationsList, setConversationsList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [context, setContext] = useState({ patient_id: null, treatment_id: null });
  const [pendingSelection, setPendingSelection] = useState(null);
  const [patientOptions, setPatientOptions] = useState([]);
  const [treatmentOptions, setTreatmentOptions] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUsageMetadata, setLastUsageMetadata] = useState(null);

  const idCounter = useRef(1);

  const addMessage = useCallback((role, text) => {
    const id = `m_${idCounter.current++}`;
    const ts = new Date().toISOString();
    setMessages((m) => [...m, { id, role, text, timestamp: ts }]);
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    setContext({ patient_id: null, treatment_id: null });
    setPendingSelection(null);
    setPatientOptions([]);
    setTreatmentOptions([]);
    setLastAction(null);
    setLoading(false);
    setLastUsageMetadata(null);
  }, []);

  return {
    open,
    setOpen,
    conversationId,
    setConversationId,
    conversationsList,
    setConversationsList,
    messages,
    setMessages,
    addMessage,
    context,
    setContext,
    pendingSelection,
    setPendingSelection,
    patientOptions,
    setPatientOptions,
    treatmentOptions,
    setTreatmentOptions,
    lastAction,
    setLastAction,
    loading,
    setLoading,
    lastUsageMetadata,
    setLastUsageMetadata,
    reset,
  };
}
