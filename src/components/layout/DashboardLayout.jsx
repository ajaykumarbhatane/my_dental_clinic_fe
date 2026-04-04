import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // 🔥 important

  const handleMenuClick = () => {
    if (window.innerWidth >= 768) {
      setIsExpanded((prev) => !prev);
    } else {
      setSidebarOpen(true);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Section */}
      <div
        className={`
          flex-1 flex flex-col overflow-hidden pt-14 md:pt-16
          transition-all duration-300
          ${isExpanded ? 'md:ml-64' : 'md:ml-16'}
        `}
      >
        <Header onMenuClick={handleMenuClick} />

        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50 p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;