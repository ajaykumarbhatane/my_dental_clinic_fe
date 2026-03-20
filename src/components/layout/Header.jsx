import { Menu, User, LogOut, ChevronDown, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const dropdownRef = useRef(null);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const formatDateAndTime = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${day} ${month} ${year}, ${time}`;
  };

  return (
    <header className="relative bg-white border-b border-gray-100 shadow-sm px-4 md:px-6 py-2">
      
      {/* Mobile Menu Button (Fixed Top-Left) */}
      <button
        onClick={onMenuClick}
        className="md:hidden absolute top-2 left-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-1">

        {/* Left Section */}
        <div className="flex-1 pl-10 md:pl-0">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 leading-tight">
            Welcome back, Dr. {getUserDisplayName()}
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-0.5">
            <p className="text-sm text-gray-500">
              Manage your dental clinic efficiently
            </p>

            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
              <Clock className="w-4 h-4 text-blue-600" />
              {formatDateAndTime(currentTime)}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center self-end md:self-auto">
          <div className="relative" ref={dropdownRef}>
            
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
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

                <div className="px-4 py-3 border-b bg-gray-50">
                  <p className="text-sm font-semibold text-gray-900">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email}
                  </p>
                  <div className="mt-2 inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {getUserRole()}
                  </div>
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

                <hr />

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