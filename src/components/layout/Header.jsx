import { Menu, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { clinicApi } from '../../api/clinicApi';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const dropdownRef = useRef(null);



  // Close dropdown outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
        const clinics = response?.data || [];
        if (Array.isArray(clinics) && clinics.length > 0) {
          setClinicName(clinics[0]?.name || '');
        }
      } catch (error) {
        console.warn('Could not resolve clinic name:', error);
      }
    };

    resolveClinicName();
  }, [user]);



  return (
    <header className="fixed top-0 left-0 right-0 h-14 md:h-16 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-full px-3 sm:px-4 md:px-6 flex items-center justify-between md:ml-64">

        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Clinic Info */}
          <div className="min-w-[120px]">
            <p className="text-xs text-gray-500">Welcome to,</p>
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
              {getUserClinicName()}
            </p>
          </div>

        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative" ref={dropdownRef}>
            
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white font-semibold">
                {getUserDisplayName().charAt(0).toUpperCase()}
              </div>

              <div className="hidden sm:block text-left">
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
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">

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
                    navigate('/settings');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
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
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
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