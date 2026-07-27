import { Menu, User, LogOut, ChevronDown, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { clinicApi } from '../../api/clinicApi';
import { visitApi } from '../../api/visitApi';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [reminders, setReminders] = useState([]);
  const dropdownRef = useRef(null);
  const reminderRef = useRef(null);



  // Close dropdown outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (reminderRef.current && !reminderRef.current.contains(event.target)) {
        setShowReminders(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const getTodayLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg bg-gray-100 hover-common text-gray-600 hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Clinic Info */}
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
              <div className="absolute right-0 mt-2 w-[min(90vw,20rem)] max-w-[20rem] bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">Upcoming visits</p>
                  <p className="text-xs text-gray-500">Today and the next 2 days</p>
                </div>
                <div className="max-h-72 overflow-auto">
                  {reminders.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-gray-500">No reminders for now.</p>
                  ) : reminders.map((reminder) => (
                    <div key={reminder.id} className="px-4 py-3 border-b border-gray-50 last:border-b-0">
                      <p className="text-sm font-semibold text-gray-900">{reminder.patient_name}</p>
                      <p className="text-xs text-gray-500">{reminder.treatment_name}</p>
                      <p className="mt-1 text-xs text-blue-600">{reminder.message}</p>
                    </div>
                  ))}
                </div>
              </div>
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