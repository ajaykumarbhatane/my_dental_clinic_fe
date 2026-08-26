import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
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
  const [isExpanded, setIsExpanded] = useState(false); // 🔥 important
  const { subscription, isModalOpen, closeModal } = useSubscriptionExpiry();
  const assistant = useAssistantContext();
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Handle Android back button when modal is open
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

  function AssistantFab() {
    return (
      <>
        <button
          onClick={() => setAssistantOpen(true)}
          aria-label="Open assistant"
          className="fixed right-6 bottom-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
        >
          AI
        </button>

        {assistantOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1" onClick={() => setAssistantOpen(false)} />
            <div className="h-full w-[380px]">
              <div className="flex h-full flex-col">
                <div className="h-full bg-white">
                  <AssistantPanel
                    state={{
                      messages: assistant.messages,
                      loading: assistant.loading,
                      lastUsageMetadata: assistant.lastUsageMetadata,
                      lastAction: assistant.lastAction,
                      patientOptions: assistant.patientOptions,
                      treatmentOptions: assistant.treatmentOptions,
                    }}
                    actions={{
                      onSend: async (text) => {
                        if (assistant.loading) return;
                        assistant.addMessage('user', text);
                        assistant.setLoading(true);
                        try {
                          const resp = await apiClient.post('/voice-assistant/', { message: text, context: assistant.context });
                          const data = resp.data;
                          assistant.addMessage('assistant', data.message || 'No response');
                          assistant.setLastUsageMetadata(data.usage || null);

                          // update context and selections/actions
                          if (data.context) {
                            assistant.setContext(data.context);
                          }

                          assistant.setLastAction(data.action || null);
                          assistant.setPatientOptions((data.selection && data.selection.type === 'PATIENT') ? (data.selection.options || []) : []);
                          assistant.setTreatmentOptions((data.selection && data.selection.type === 'TREATMENT') ? (data.selection.options || []) : []);

                          // If immediate OPEN_PATIENT action, navigate
                          if (data.action && data.action.type === 'OPEN_PATIENT' && data.action.patient_id) {
                            // navigate to patient detail without reloading
                            routeTo(`/app/patients/${data.action.patient_id}`);
                            setAssistantOpen(false);
                          }

                          if (data.action && data.action.type === 'OPEN_TREATMENT' && data.action.treatment_id) {
                            const base = `/app/treatments/${data.action.treatment_id}`;
                            const url = data.action.visit_id ? `${base}?visit_id=${data.action.visit_id}` : base;
                            routeTo(url);
                            setAssistantOpen(false);
                          }

                        } catch (err) {
                          // handle common statuses with friendly messages
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
                        // send a follow-up request indicating selection
                        assistant.setPatientOptions([]);
                        assistant.addMessage('user', `Select patient ${p.full_name || p.first_name}`);
                        try {
                          assistant.setLoading(true);
                          const resp = await apiClient.post('/voice-assistant/', { message: `Select patient ${p.id}`, context: { patient_id: p.id } });
                          const data = resp.data;
                          assistant.addMessage('assistant', data.message || 'No response');
                          assistant.setContext(data.context || assistant.context);
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
                          const resp = await apiClient.post('/voice-assistant/', { message: `Select treatment ${t.id}`, context: { patient_id: assistant.context.patient_id, treatment_id: t.id } });
                          const data = resp.data;
                          assistant.addMessage('assistant', data.message || 'No response');
                          assistant.setContext(data.context || assistant.context);
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
                    }}
                  />

                  <div className="absolute left-2 top-2">
                    <button onClick={() => setAssistantOpen(false)} className="rounded-full bg-white p-1 text-slate-600">Close</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-gray-50 box-border">

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Section */}
      <div
        className={`
          flex-1 flex flex-col min-w-0 overflow-hidden pt-14 md:pt-16
          transition-all duration-300
          ${isExpanded ? 'md:ml-64' : 'md:ml-16'}
        `}
      >
        <Header onMenuClick={handleMenuClick} />

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50 p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Assistant FAB + Panel */}
      <AssistantFab />


      {/* Subscription Expiry Modal */}
      <SubscriptionExpiryModal
        isOpen={isModalOpen}
        subscription={subscription}
        onClose={closeModal}
      />
    </div>
  );
};

export default DashboardLayout;