import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Stethoscope, Settings, Stethoscope as StethoscopeIcon } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/patients', icon: Users, label: 'Patients' },
    { path: '/treatments', icon: Stethoscope, label: 'Treatments' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="bg-gradient-to-b from-blue-900 to-blue-800 shadow-xl h-full w-64 flex flex-col">
      {/* Logo/Brand Section */}
      <div className="px-6 py-8 border-b border-blue-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <StethoscopeIcon className="w-6 h-6 text-blue-900" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">DentalPro</h1>
            <p className="text-xs text-blue-200">Clinic Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-6 px-3">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-white text-blue-900 shadow-lg transform scale-105' 
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-blue-600' : ''}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-blue-700">
        <p className="text-xs text-blue-200 text-center">
          Dental Clinic Management System
        </p>
      </div>
    </div>
  );
};

export default Sidebar;