import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Sparkles } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import AssistantPanel from '../assistant/AssistantPanel';
import useAssistantContext from '../../hooks/useAssistantContext';
import apiClient from '../../api/apiClient';
import { routeTo } from '../../utils/routerNavigation';
import { showError } from '../../services/notificationService';
import SubscriptionExpiryModal from '../subscription/SubscriptionExpiryModal';
import { useSubscriptionExpiry } from '../../hooks/useSubscriptionExpiry';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { subscription, isModalOpen, closeModal } = useSubscriptionExpiry();
  const assistant = useAssistantContext();
  const [assistantOpen, setAssistantOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen || !Capacitor.isNativePlatform()) {
      return undefined;
    }

    let listenerHandle = null;
    let isSubscribed = true;

    CapacitorApp.addListener('backButton', () => {
      closeModal();
    }).then((handle) => {
      if (!isSubscribed) {
        handle.remove();
      } else {
        listenerHandle = handle;
      }
    });

    return () => {
      isSubscribed = false;
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [isModalOpen, closeModal]);

  const handleMenuClick = () => {
    if (window.innerWidth >= 768) {
      setIsExpanded((prev) => !prev);
    } else {
      setSidebarOpen(true);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setAssistantOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Lock body scroll when assistant is open on small screens
  useEffect(() => {
    if (assistantOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [assistantOpen]);

  // Fetch conversations list & active conversation on app load / open
  const fetchConversationsList = async () => {
    try {
      const resp = await apiClient.get('/voice-assistant/conversations/');
      assistant.setConversationsList(resp.data || []);
    } catch (e) {
      console.error('Failed to fetch conversations list', e);
    }
  };

  const loadActiveConversation = async () => {
    try {
      const resp = await apiClient.get('/voice-assistant/conversations/active/');
      const data = resp.data;
      if (data && data.id) {
        assistant.setConversationId(data.id);
        const formattedMsgs = (data.messages || []).map((m) => ({
          id: m.id,
          role: m.role,
          text: m.content,
          timestamp: m.created_at,
        }));
        assistant.setMessages(formattedMsgs);
        if (data.context) {
          assistant.setContext(data.context);
        }
      }
      fetchConversationsList();
    } catch (e) {
      console.error('Failed to load active conversation', e);
    }
  };

  useEffect(() => {
    loadActiveConversation();
  }, []);

  const handleNewChat = async () => {
    try {
      assistant.setLoading(true);
      const resp = await apiClient.post('/voice-assistant/conversations/new/');
      const data = resp.data;
      assistant.setConversationId(data.id);
      assistant.setMessages([]);
      assistant.setContext({ patient_id: null, treatment_id: null });
      assistant.setLastAction(null);
      assistant.setPendingSelection(null);
      fetchConversationsList();
    } catch (e) {
      showError('Failed to start new chat.');
    } finally {
      assistant.setLoading(false);
    }
  };

  const handleSelectConversation = async (convId) => {
    try {
      assistant.setLoading(true);
      const resp = await apiClient.get(`/voice-assistant/conversations/${convId}/`);
      const data = resp.data;
      if (data && data.id) {
        assistant.setConversationId(data.id);
        const formattedMsgs = (data.messages || []).map((m) => ({
          id: m.id,
          role: m.role,
          text: m.content,
          timestamp: m.created_at,
        }));
        assistant.setMessages(formattedMsgs);
        if (data.context) {
          assistant.setContext(data.context);
        }
      }
    } catch (e) {
      showError('Failed to load conversation.');
    } finally {
      assistant.setLoading(false);
    }
  };

  const handleDeleteConversation = async (convId) => {
    try {
      await apiClient.delete(`/voice-assistant/conversations/${convId}/`);
      if (assistant.conversationId === convId) {
        handleNewChat();
      } else {
        fetchConversationsList();
      }
    } catch (e) {
      showError('Failed to delete conversation.');
    }
  };

  function AssistantFab() {
    return (
      <>
        {/* Floating AI Button (Only visible when assistant is closed) */}
        {!assistantOpen && (
          <button
            onClick={() => {
              setAssistantOpen(true);
              loadActiveConversation();
            }}
            aria-label="Open AI Assistant"
            className="fixed right-6 bottom-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 active:scale-95 transition-all hover:scale-105"
          >
            <Sparkles size={24} />
          </button>
        )}

        {/* Slide-over Drawer Overlay */}
        {assistantOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-[2px] transition-opacity">
            <div className="flex-1" onClick={() => setAssistantOpen(false)} aria-label="Close assistant backdrop" />
            <div className="h-full w-full sm:w-[400px] md:w-[420px] lg:w-[420px] xl:w-[440px] max-w-full bg-white shadow-2xl border-l border-slate-200 flex flex-col transition-all duration-300">
              <AssistantPanel
                state={{
                  conversationId: assistant.conversationId,
                  conversationsList: assistant.conversationsList,
                  messages: assistant.messages,
                  loading: assistant.loading,
                  lastUsageMetadata: assistant.lastUsageMetadata,
                  lastAction: assistant.lastAction,
                  patientOptions: assistant.patientOptions,
                  doctorOptions: assistant.doctorOptions,
                  statusOptions: assistant.statusOptions,
                  paymentTypeOptions: assistant.paymentTypeOptions,
                  confirmationOptions: assistant.confirmationOptions,
                  prescriptionOptions: assistant.prescriptionOptions,
                  pendingSelection: assistant.pendingSelection,
                }}
                actions={{
                  onClose: () => setAssistantOpen(false),
                  onSend: async (text) => {
                    if (assistant.loading) return;
                    assistant.setGenderOptions([]);
                    assistant.setDoctorOptions([]);
                    assistant.setStatusOptions([]);
                    assistant.setPaymentTypeOptions([]);
                    assistant.setConfirmationOptions([]);
                    assistant.setPrescriptionOptions([]);
                    assistant.addMessage('user', text);
                    assistant.setLoading(true);
                    try {
                      const resp = await apiClient.post('/voice-assistant/', {
                        message: text,
                        conversation_id: assistant.conversationId,
                        context: assistant.context,
                      });
                      const data = resp.data;
                      assistant.addMessage('assistant', data.message || 'No response');
                      if (data.conversation_id) assistant.setConversationId(data.conversation_id);
                      assistant.setLastUsageMetadata(data.usage || null);

                      if (data.context) {
                        assistant.setContext(data.context);
                      } else if (data.action && data.action.type === 'OPEN_PATIENT' && data.action.patient_id) {
                        assistant.setContext({ patient_id: data.action.patient_id, treatment_id: null });
                      } else if (data.action && data.action.type === 'OPEN_TREATMENT' && data.action.treatment_id) {
                        assistant.setContext({ patient_id: data.action.patient_id || assistant.context.patient_id, treatment_id: data.action.treatment_id });
                      }

                      assistant.setLastAction(data.action || null);
                      assistant.setPatientOptions((data.selection && data.selection.type === 'PATIENT') ? (data.selection.options || []) : []);
                      assistant.setTreatmentOptions((data.selection && data.selection.type === 'TREATMENT') ? (data.selection.options || []) : []);
                      assistant.setDoctorOptions((data.selection && data.selection.type === 'DOCTOR') ? (data.selection.options || []) : []);
                      assistant.setGenderOptions((data.selection && data.selection.type === 'GENDER') ? (data.selection.options || []) : []);
                      assistant.setStatusOptions((data.selection && data.selection.type === 'TREATMENT_STATUS') ? (data.selection.options || []) : []);
                      assistant.setPaymentTypeOptions((data.selection && data.selection.type === 'PAYMENT_TYPE') ? (data.selection.options || []) : []);
                      assistant.setConfirmationOptions((data.selection && data.selection.type === 'ADD_PATIENT_CONFIRMATION') ? (data.selection.options || []) : []);
                      assistant.setPrescriptionOptions((data.selection && data.selection.type === 'PRESCRIPTION_CHOICE') ? (data.selection.options || []) : []);

                      if (data.action && data.action.type === 'ADD_PATIENT_PREVIEW') {
                        assistant.setPendingSelection({ confirmation: data.confirmation || null, prefill: data.prefill || null });
                      } else {
                        assistant.setPendingSelection(null);
                      }

                      if (data.action && data.action.type === 'OPEN_ADD_PATIENT') {
                        const prefill = data.prefill || {};
                        try { sessionStorage.setItem('assistant_add_patient_prefill', JSON.stringify(prefill)); } catch (e) { console.error(e); }
                        routeTo('/app/patients');
                        setAssistantOpen(false);
                        window.dispatchEvent(new CustomEvent('assistant:open_add_patient'));
                      }

                      const activePatientId = (data.action && data.action.patient_id) || (data.context && data.context.patient_id);
                      if (activePatientId) {
                        window.dispatchEvent(new CustomEvent('patient-updated', { detail: { patient_id: activePatientId } }));
                      }

                      if (data.action && data.action.type === 'OPEN_PATIENT' && data.action.patient_id) {
                        routeTo(`/app/patients/${data.action.patient_id}`);
                        setAssistantOpen(false);
                      }

                      if (data.action && data.action.type === 'OPEN_TREATMENT' && data.action.treatment_id) {
                        const base = `/app/treatments/${data.action.treatment_id}`;
                        const url = data.action.visit_id ? `${base}?visit_id=${data.action.visit_id}` : base;
                        routeTo(url);
                        setAssistantOpen(false);
                      }

                      if (data.action && data.action.type === 'SHOW_TREATMENTS') {
                        const patientId = data.action.patient_id || (data.context && data.context.patient_id) || assistant.context.patient_id;
                        if (patientId) {
                          routeTo(`/app/patients/${patientId}?tab=treatments`);
                          setAssistantOpen(false);
                        }
                      }

                      fetchConversationsList();
                    } catch (err) {
                      const status = err?.response?.status;
                      if (status === 401) showError('Authentication required. Please login again.');
                      else if (status === 429) showError('AI rate limit exceeded. Please try again later.');
                      else if (status === 504) showError('AI request timed out. Please try again.');
                      else if (status === 503) showError('AI service unavailable. Please try again later.');
                      else if (status === 400) showError('Invalid request. Please refine your message.');
                      else showError('Unable to contact assistant. Please try again.');
                    } finally {
                      assistant.setLoading(false);
                    }
                  },
                  onNewChat: handleNewChat,
                  onSelectConversation: handleSelectConversation,
                  onDeleteConversation: handleDeleteConversation,
                  onOpenPatient: (id) => {
                    routeTo(`/app/patients/${id}`);
                    setAssistantOpen(false);
                  },
                  onOpenTreatment: (treatmentId, visitId) => {
                    const base = `/app/treatments/${treatmentId}`;
                    const url = visitId ? `${base}?visit_id=${visitId}` : base;
                    routeTo(url);
                    setAssistantOpen(false);
                  },
                  onSelectPatient: async (p) => {
                    assistant.setPatientOptions([]);
                    assistant.addMessage('user', `Select patient ${p.full_name || p.first_name}`);
                    try {
                      assistant.setLoading(true);
                      const resp = await apiClient.post('/voice-assistant/', { message: `Select patient ${p.id}`, conversation_id: assistant.conversationId, context: { patient_id: p.id } });
                      const data = resp.data;
                      assistant.addMessage('assistant', data.message || 'No response');
                      if (data.context) assistant.setContext(data.context);
                      else assistant.setContext({ patient_id: p.id, treatment_id: null });
                      if (data.action && data.action.type === 'OPEN_PATIENT') {
                        routeTo(`/app/patients/${data.action.patient_id}`);
                        setAssistantOpen(false);
                      }
                    } catch (err) {
                      showError('Selection failed. Please try again.');
                    } finally {
                      assistant.setLoading(false);
                    }
                  },
                  onSelectTreatment: async (t) => {
                    assistant.setTreatmentOptions([]);
                    assistant.addMessage('user', `Select treatment ${t.id}`);
                    try {
                      assistant.setLoading(true);
                      const explicitPatientId = t.patient_id || assistant.context.patient_id;
                      const resp = await apiClient.post('/voice-assistant/', { message: `Select treatment ${t.id}`, conversation_id: assistant.conversationId, context: { patient_id: explicitPatientId, treatment_id: t.id } });
                      const data = resp.data;
                      assistant.addMessage('assistant', data.message || 'No response');
                      if (data.context) assistant.setContext(data.context);
                      else assistant.setContext({ patient_id: explicitPatientId, treatment_id: t.id });
                      if (data.action && data.action.type === 'OPEN_TREATMENT') {
                        const base = `/app/treatments/${data.action.treatment_id}`;
                        const url = data.action.visit_id ? `${base}?visit_id=${data.action.visit_id}` : base;
                        routeTo(url);
                        setAssistantOpen(false);
                      }
                    } catch (err) {
                      showError('Selection failed. Please try again.');
                    } finally {
                      assistant.setLoading(false);
                    }
                  },
                  onConfirmAddPatient: async (token) => {
                    if (assistant.loading) return;
                    assistant.addMessage('user', 'confirm');
                    assistant.setLoading(true);
                    try {
                      const resp = await apiClient.post('/voice-assistant/', { message: 'confirm', conversation_id: assistant.conversationId, context: assistant.context, action_token: token });
                      const data = resp.data;
                      assistant.addMessage('assistant', data.message || 'No response');
                      assistant.setLastAction(data.action || null);
                      assistant.setPendingSelection(null);
                      if (data.action && data.action.type === 'OPEN_PATIENT') {
                        routeTo(`/app/patients/${data.action.patient_id}`);
                        setAssistantOpen(false);
                      }
                    } catch (err) {
                      showError('Confirmation failed. Please try again.');
                    } finally {
                      assistant.setLoading(false);
                    }
                  },
                  onCancelAddPatient: async (token) => {
                    if (assistant.loading) return;
                    assistant.addMessage('user', 'cancel');
                    assistant.setLoading(true);
                    try {
                      const resp = await apiClient.post('/voice-assistant/', { message: 'cancel', conversation_id: assistant.conversationId, context: assistant.context, action_token: token });
                      const data = resp.data;
                      assistant.addMessage('assistant', data.message || 'Cancelled');
                      assistant.setLastAction(data.action || null);
                      assistant.setPendingSelection(null);
                    } catch (err) {
                      showError('Cancellation failed. Please try again.');
                    } finally {
                      assistant.setLoading(false);
                    }
                  },
                }}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
      <div className={`relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden transition-all duration-300 pt-14 md:pt-16 ${isExpanded ? 'md:pl-64' : 'md:pl-20'}`}>
        <Header onMenuClick={handleMenuClick} handleMenuClick={handleMenuClick} />
        <main className="grow p-4 md:p-6">
          {children}
        </main>
      </div>

      <AssistantFab />

      <SubscriptionExpiryModal
        isOpen={isModalOpen}
        onClose={closeModal}
        subscription={subscription}
      />
    </div>
  );
};

export default DashboardLayout;