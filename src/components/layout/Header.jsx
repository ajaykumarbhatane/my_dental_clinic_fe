import { Menu, User, LogOut, ChevronDown, Bell, Sparkles, Eye, Phone, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { clinicApi } from '../../api/clinicApi';
import { visitApi } from '../../api/visitApi';
import { subscriptionService } from '../../api/subscriptionService';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [currentPlanName, setCurrentPlanName] = useState('');
  const [reminders, setReminders] = useState([]);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const dropdownRef = useRef(null);
  const reminderRef = useRef(null);

  // Close dropdown outside click
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (reminderRef.current && !reminderRef.current.contains(event.target)) {
        setShowReminders(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const getUserDisplayName = () => {
    if (user) {
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || user.email || 'User';
    }
    return 'Doctor';
  };

  const getUserRole = () => {
    if (user && user.role) {
      return user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }
    return 'Doctor';
  };

  const getUserClinicName = () => {
    if (clinicName) return clinicName;
    if (user?.clinic?.name) return user.clinic.name;
    if (user?.clinic_name) return user.clinic_name;
    if (Array.isArray(user?.clinics) && user.clinics.length > 0) {
      return user.clinics[0]?.name || '';
    }
    return 'No clinic assigned';
  };

  useEffect(() => {
    const resolveClinicName = async () => {
      if (!user) return;

      const fromUser =
        user?.clinic?.name ||
        user?.clinic_name ||
        (Array.isArray(user?.clinics) && user.clinics.length > 0 ? user.clinics[0]?.name : null);
      if (fromUser) {
        setClinicName(fromUser);
        return;
      }

      try {
        const response = await clinicApi.getAll();
        const clinics = response?.data?.results || response?.data || [];
        if (Array.isArray(clinics) && clinics.length > 0) {
          setClinicName(clinics[0]?.name || '');
        }
      } catch (error) {
        console.warn('Could not resolve clinic name:', error);
      }
    };

    resolveClinicName();
  }, [user]);

  useEffect(() => {
    const loadCurrentPlan = async () => {
      if (!user) {
        setCurrentPlanName('');
        return;
      }

      try {
        const response = await subscriptionService.getCurrentSubscription();
        const planName = response?.data?.plan?.name || '';
        setCurrentPlanName(planName);
      } catch (error) {
        if (error?.response?.status !== 404) {
          console.warn('Could not load current plan:', error);
        }
        setCurrentPlanName('');
      }
    };

    loadCurrentPlan();
  }, [user]);

  const getTodayLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const openReminderDetails = (reminder) => {
    if (!reminder?.treatment_id) return;
    setShowReminders(false);
    navigate(`/app/treatments/${reminder.treatment_id}${reminder.visit_id ? `?visit_id=${reminder.visit_id}` : ''}`);
  };

  const callReminderPatient = (reminder) => {
    const mobile = reminder?.mobile;
    if (!mobile) return;

    const sanitized = String(mobile).replace(/[^\d+]/g, '');
    if (!sanitized) return;

    window.location.href = `tel:${sanitized}`;
  };

  useEffect(() => {
    if (!user) return;

    const loadReminders = async () => {
      try {
        const today = getTodayLocalDate();
        const response = await visitApi.getReminders(today);
        const reminderResults = response?.data?.results || [];
        setReminders(reminderResults);
      } catch (error) {
        console.warn('Could not load reminders:', error);
      }
    };

    loadReminders();
    const interval = window.setInterval(loadReminders, 60000);
    return () => window.clearInterval(interval);
  }, [user]);



  return (
    <header className="fixed top-0 left-0 right-0 h-14 md:h-16 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-full w-full max-w-full px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2 overflow-visible">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg bg-gray-100 hover-common text-gray-600 hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative min-w-0 max-w-[55vw] sm:max-w-[220px] group">
            <p className="text-xs text-gray-500">Welcome to,</p>

            <p className="truncate text-sm font-semibold text-gray-900">
              {getUserClinicName()}
            </p>

            <div
              className="
                invisible
                absolute
                top-full
                left-0
                mt-2
                z-50
                rounded-lg
                bg-slate-900
                px-3
                py-2
                text-xs
                text-white
                opacity-0
                shadow-xl
                transition-all
                duration-200
                whitespace-nowrap
                group-hover:visible
                group-hover:opacity-100
              "
            >
              {getUserClinicName()}
            </div>
          </div>

        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative" ref={reminderRef}>
            <button
              onClick={() => setShowReminders(!showReminders)}
              className="relative p-2 rounded-lg bg-gray-100 hover-common text-gray-600 hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Upcoming reminders"
            >
              <Bell className="w-5 h-5" />
              {reminders.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {reminders.length}
                </span>
              )}
            </button>

            {showReminders && (
              isMobile ? (
                <div className="fixed inset-0 z-[60] bg-slate-950/40 md:hidden">
                  <div className="w-full h-full bg-white shadow-2xl overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Notifications</p>
                        <h3 className="text-lg font-bold text-slate-900">Today's visits</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowReminders(false)}
                        className="rounded-full bg-slate-100 p-2 text-slate-600"
                        aria-label="Close notifications"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-50">
                      {reminders.length === 0 ? (
                        <div className="flex h-full items-center justify-center px-4">
                          <p className="text-sm text-slate-500 text-center">No reminders for now.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 p-3">
                          {reminders.map((reminder) => (
                            <article key={reminder.id} className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4">
                              <div className="min-w-0">
                                <p className="text-base font-bold text-slate-900 truncate">{reminder.patient_name}</p>
                                <p className="text-sm text-slate-500">{reminder.treatment_name}</p>
                                <p className="mt-2 text-sm text-slate-700">Visit #{reminder.visit_number || reminder.visit_id}</p>
                              </div>

                              <div className="mt-4 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => openReminderDetails(reminder)}
                                  className="flex-1 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => callReminderPatient(reminder)}
                                  disabled={!reminder.mobile}
                                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Phone className="w-4 h-4" />
                                  Call
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute right-0 mt-2 w-[min(92vw,26rem)] max-w-[26rem] bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Notification center</p>
                      <p className="text-sm font-semibold text-slate-900">Today's visits</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                      {reminders.length}
                    </span>
                  </div>
                  <div className="max-h-[24rem] overflow-auto bg-slate-50">
                    {reminders.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-slate-500">No reminders for now.</p>
                    ) : reminders.map((reminder) => (
                      <div key={reminder.id} className="px-4 py-3 border-b border-slate-100 last:border-b-0 bg-white">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900">{reminder.patient_name}</p>
                          <p className="text-xs text-slate-500">{reminder.treatment_name}</p>
                          <p className="mt-1 text-xs text-slate-700">Visit #{reminder.visit_number || reminder.visit_id}</p>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => openReminderDetails(reminder)}
                            className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => callReminderPatient(reminder)}
                            disabled={!reminder.mobile}
                            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Call
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover-common hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white font-semibold">
                {getUserDisplayName().charAt(0).toUpperCase()}
              </div>

              <div className="hidden sm:block min-w-0 text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {getUserRole()}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email}
                </p>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-gray-600 transition ${
                  showDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-[min(88vw,14rem)] max-w-[14rem] bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">

                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{getUserDisplayName()}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <span className="mt-2 inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700">
                    {getUserRole()}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('settings');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover-common hover:bg-gray-50 flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  Profile Settings
                </button>

                <hr className="my-1" />

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover-common hover:bg-red-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;