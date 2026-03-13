import { User, LogOut, ChevronDown, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const dropdownRef = useRef(null);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
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

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 px-8 py-5">
      <div className="flex justify-between items-center">
        {/* Left section */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, Dr. {getUserDisplayName()}
          </h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-gray-500">
              Manage your dental clinic efficiently
            </p>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
              <Clock className="w-4 h-4 text-blue-600" />
              {formatTime(currentTime)}
            </div>
          </div>
        </div>

        {/* Right section - User menu */}
        <div className="flex items-center ml-6">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white font-semibold group-hover:shadow-lg transition-shadow">
                {getUserDisplayName().charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-900">{getUserRole()}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-900">{getUserDisplayName()}</p>
                  <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                  <div className="mt-2 inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {getUserRole()}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 group"
                >
                  <User className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  <span>Profile Settings</span>
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 group font-medium"
                >
                  <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  <span>Logout</span>
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