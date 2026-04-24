import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Stethoscope,
  Settings, Film, Phone, X, Building
} from 'lucide-react';
import { useRef } from 'react';

const Sidebar = ({ isOpen, onClose, isExpanded, setIsExpanded }) => {
  const location = useLocation();
  const touchStartX = useRef(null);

  // 👉 Swipe (mobile)
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!touchStartX.current) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    if (diff < -80) onClose();
  };


  const menuItems = [
    { path: '/app', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/app/patients', icon: Users, label: 'Patients' },
    { path: '/app/treatments', icon: Stethoscope, label: 'Treatments' },
    { path: '/app/treatment-videos', icon: Film, label: 'Videos' },
    { path: '/app/clinic-settings', icon: Building, label: 'Clinic Settings' },
    { path: '/app/customer-care', icon: Phone, label: 'Support' },
    { path: '/app/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className={`
        fixed top-14 md:top-16 left-0 z-50
        h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]

        w-64
        ${isExpanded ? 'md:w-64' : 'md:w-16'}

        bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800
        text-white shadow-xl transition-all duration-300
        flex flex-col

        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}
    >

      {/* 🔷 BRAND */}
      <div className={`
        px-4 py-5 flex items-center gap-4
        md:${isExpanded ? 'gap-4' : 'justify-center'}
      `}>
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
          <Stethoscope className="w-6 h-6 text-blue-900" />
        </div>

        {/* Mobile */}
        <div className="block md:hidden">
          <h1 className="text-lg font-bold">DentalPro</h1>
          <p className="text-xs text-blue-200">Smart Clinic Management</p>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          {isExpanded && (
            <>
              <h1 className="text-lg font-bold">DentalPro</h1>
              <p className="text-xs text-blue-200">Smart Clinic Management</p>
            </>
          )}
        </div>
      </div>

      {/* Mobile Close */}
      <button
        onClick={onClose}
        className="md:hidden absolute top-3 right-3 p-2 bg-blue-800 rounded"
      >
        <X className="w-5 h-5" />
      </button>

      {/* MENU */}
      <nav className="flex-1 mt-4 px-3 md:px-2">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path} className="relative group">
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center
                    py-3
                    rounded-lg transition

                    /* 📱 Mobile */
                    px-4 gap-4

                    /* 💻 Desktop Expanded */
                    ${isExpanded ? 'md:px-3 md:gap-4' : 'md:justify-center md:px-0 md:gap-0'}

                    ${isActive
                      ? 'bg-white text-blue-900'
                      : 'hover:bg-blue-700'}
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0" />

                  {/* Mobile */}
                  <span className="block md:hidden">
                    {item.label}
                  </span>

                  {/* Desktop */}
                  <span className="hidden md:block">
                    {isExpanded && item.label}
                  </span>

                  {isActive && isExpanded && (
                    <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </Link>

                {/* Tooltip */}
                {!isExpanded && (
                  <div className="
                    hidden md:block
                    absolute left-16 top-1/2 -translate-y-1/2
                    bg-black text-white text-xs px-2 py-1 rounded
                    opacity-0 group-hover:opacity-100
                    whitespace-nowrap transition
                  ">
                    {item.label}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* FOOTER */}
      <div className="p-4 text-xs text-blue-200 border-t border-blue-700 text-center">
        <span className="block md:hidden">© MyDentalClinicPro</span>
        <span className="hidden md:block">
          {isExpanded ? '© MyDentalClinicPro' : '©'}
        </span>
      </div>

    </aside>
  );
};

export default Sidebar;