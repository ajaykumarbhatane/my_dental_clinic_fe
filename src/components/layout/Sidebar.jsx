import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Stethoscope, Settings, Film, X, Phone, Mail, MapPin } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/patients', icon: Users, label: 'Patients' },
    { path: '/treatments', icon: Stethoscope, label: 'Treatments' },
    { path: '/treatment-videos', icon: Film, label: 'Treatment Videos' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out bg-gradient-to-b from-blue-900 to-blue-800 shadow-xl flex flex-col md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:flex`}>
      {/* Mobile Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-blue-700 md:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
            <Stethoscope className="w-6 h-6 text-blue-900" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">DentalPro</h1>
            <p className="text-xs text-blue-200 leading-tight">Clinic Patient<br />Management</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-blue-100 hover:bg-blue-700 hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Logo/Brand Section */}
      <div className="hidden md:block px-6 py-8 border-b border-blue-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
            <Stethoscope className="w-7 h-7 text-blue-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">DentalPro</h1>
            <p className="text-xs text-blue-200 leading-tight">Clinic Patient<br />Management</p>
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
                  onClick={onClose}
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
      <div className="px-4 py-4 border-t border-blue-700 mt-auto">
        {/* Customer Care Section */}
        <div className="mb-5 pb-4 border-b border-blue-600">
          <h3 className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-3">Customer Care</h3>
          <div className="space-y-2 text-xs text-blue-200">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 flex-shrink-0 text-blue-300" />
              <span className="text-xs">+91-9970609951</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 flex-shrink-0 text-blue-300" />
              <a href="mailto:support@clinic.com" className="hover:text-white transition-colors text-xs truncate">
                support@clinic.com
              </a>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-blue-300 mt-0.5" />
              <span className="text-xs">New Delhi, India</span>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <p className="text-xs text-blue-200 text-center leading-snug">
          <span className="block font-semibold mb-1">Dental Clinic Management System</span>
          @2026 Developed by Ajaykumar and Dr. Swati Bhatane. All rights reserved.<br />
          <span className="block text-xs text-blue-300 mt-1">
            Contact: +91-9970609951
          </span>
        </p>
      </div>
    </div>
  );
};

export default Sidebar;