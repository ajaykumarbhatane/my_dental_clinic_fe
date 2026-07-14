import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Stethoscope,
  Settings, Film, Phone, X, Building
} from 'lucide-react';
import { useRef } from 'react';
import logo from '../../assets/mydentalclinicpro_logo.png';

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

    /* 📱 Mobile Width */
    w-[260px]

    /* 💻 Desktop */
    ${isExpanded ? 'md:w-64' : 'md:w-20'}

    bg-gradient-to-b from-[#0B1120] via-[#172554] to-[#1E40AF]

    text-white
    shadow-2xl
    transition-all duration-300
    flex flex-col

    border-r border-white/10

    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    md:translate-x-0
  `}
>

  {/* HEADER */}
  <div className="relative px-3 pt-2 pb-1">
    {/* Brand */}
<div className="relative px-3 pt-5 pb-4 border-b border-white/10">

  {/* Close Button */}
  <button
    onClick={onClose}
    className="
      md:hidden
      absolute top-4 right-4
      w-9 h-9
      rounded-xl
      bg-white/10
      hover:bg-white/20
      flex items-center justify-center
      transition
    "
  >
    <X className="w-5 h-5" />
  </button>

  {/* Brand Container */}
  <div
    className={`
      flex items-center
      transition-all duration-300

      ${
        isExpanded
          ? 'md:flex-row md:gap-3'
          : 'md:justify-center'
      }
    `}
  >

    {/* Logo */}
    <div
      className="
        w-11 h-11
        rounded-2xl
        bg-white
        flex items-center justify-center
        shadow-lg
        shrink-0
      "
    >
      <img
        src={logo}
        alt="Logo"
        className="w-6 h-6 object-contain"
      />
    </div>

    {/* 📱 Mobile Text */}
    <div className="ml-3 md:hidden">

      <h1 className="text-[15px] font-bold text-white leading-tight">
        My Dental
      </h1>

      <div className="flex items-center gap-1 leading-tight">
        <span className="text-cyan-300 text-sm font-semibold">
          Clinic
        </span>

        <span className="text-white text-sm">
          Pro
        </span>
      </div>

      {/* <p className="text-[10px] text-blue-200 mt-1 whitespace-nowrap">
        Smart Dental Management
      </p> */}

    </div>

    {/* 💻 Desktop Expanded Only */}
    {isExpanded && (
      <div className="hidden md:block leading-tight">

        <h1 className="text-[15px] font-bold text-white">
          My Dental
        </h1>

        <div className="flex items-center gap-1">
          <span className="text-cyan-300 text-sm font-semibold">
            Clinic
          </span>

          <span className="text-white text-sm">
            Pro
          </span>
        </div>

        <p className="text-[10px] text-blue-200 mt-1 whitespace-nowrap">
          Smart Dental Management
        </p>

      </div>
    )}

  </div>
</div>
  </div>

  {/* MENU */}
  <nav className="flex-1 px-3 py-4 overflow-y-auto">

    <ul className="space-y-2">

      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <li key={item.path} className="relative group">

            <Link
              to={item.path}
              onClick={onClose}
              title={item.label}
              aria-label={item.label}
              className={`
                flex items-center
                rounded-2xl
                transition-all duration-200

                /* 📱 Mobile */
                px-4 py-3 gap-3

                /* 💻 Desktop */
                ${isExpanded
                  ? 'md:px-4 md:justify-start'
                  : 'md:justify-center md:px-0'
                }

                ${isActive
                  ? 'bg-white text-blue-900 shadow-lg'
                  : 'hover:bg-white/10 text-white'
                }
              `}
            >

              <Icon className="w-5 h-5 shrink-0" />

              {/* Mobile */}
              <span className="md:hidden text-sm font-medium">
                {item.label}
              </span>

              {/* Desktop Expanded */}
              {isExpanded && (
                <span className="hidden md:block text-sm font-medium">
                  {item.label}
                </span>
              )}

            </Link>

          </li>
        );
      })}

    </ul>

  </nav>

  {/* FOOTER
  <div className="p-4 border-t border-white/10">

    <div className="bg-white/5 rounded-2xl p-3 text-center">

      <p className="text-xs text-blue-100">
        © 2026 MyDentalClinicPro
      </p>

      <p className="text-[10px] text-blue-300 mt-1">
        Dental SaaS Platform
      </p>

    </div>

  </div> */}

</aside>
  );
};

export default Sidebar;