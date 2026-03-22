import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Stethoscope, Settings, Film, X, Phone } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/patients', icon: Users, label: 'Patients' },
    { path: '/treatments', icon: Stethoscope, label: 'Treatments' },
    { path: '/treatment-videos', icon: Film, label: 'Treatment Videos' },
    { path: '/customer-care', icon: Phone, label: 'Customer Care' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className={`fixed top-14 left-0 z-50 h-screen w-64 bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 text-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>

      {/* 🔷 BRAND SECTION */}
      <div className="px-6 py-6 border-b border-blue-700">
        <div className="flex items-center gap-3">

          {/* Logo */}
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Stethoscope className="w-7 h-7 text-blue-900" />
          </div>

          {/* Name + Tagline */}
          <div>
            <h1 className="text-xl font-bold tracking-wide">DentalPro</h1>
            <p className="text-xs text-blue-200">Smart Clinic Management</p>
          </div>
        </div>
      </div>

      {/* 📱 MOBILE CLOSE BUTTON */}
      <div className="md:hidden px-4 pt-2">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-blue-700 transition"
        >
          <X />
        </button>
      </div>

      {/* 🧭 NAVIGATION */}
      <nav className="flex-1 mt-4 px-3 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`group flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-blue-900 shadow-lg scale-[1.03]'
                      : 'text-blue-100 hover:bg-blue-700/60 hover:scale-[1.02]'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 transition ${
                    isActive ? 'text-blue-600' : 'group-hover:text-white'
                  }`} />

                  <span className="flex-1">{item.label}</span>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 💎 FOOTER BRANDING */}
      <div className="px-4 py-5 border-t border-blue-700 mt-auto bg-blue-900/40 backdrop-blur-sm">
        <div className="text-center space-y-1">
          <p className="text-xs text-blue-200">
            © 2026 DentalPro
          </p>
          <p className="text-[11px] text-blue-300">
            Developed by Ajaykumar & Dr. Swati Lahane
          </p>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;