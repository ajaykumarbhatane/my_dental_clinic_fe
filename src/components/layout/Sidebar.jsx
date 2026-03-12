import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Stethoscope, Settings } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/patients', icon: Users, label: 'Patients' },
    { path: '/treatments', icon: Stethoscope, label: 'Treatments' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="bg-white shadow-lg h-full w-64">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">Dental Clinic</h1>
      </div>
      <nav className="mt-6">
        <ul>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${
                    isActive ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700' : ''
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;