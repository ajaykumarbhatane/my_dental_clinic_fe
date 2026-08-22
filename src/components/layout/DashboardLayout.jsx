import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import Sidebar from './Sidebar';
import Header from './Header';
import SubscriptionExpiryModal from '../subscription/SubscriptionExpiryModal';
import { useSubscriptionExpiry } from '../../hooks/useSubscriptionExpiry';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // 🔥 important
  const { subscription, isModalOpen, closeModal } = useSubscriptionExpiry();

  // Handle Android back button when modal is open
  useEffect(() => {
    if (!isModalOpen || !Capacitor.isNativePlatform()) {
      return undefined;
    }

    let listenerHandle = null;
    let isSubscribed = true;

    CapacitorApp.addListener('backButton', () => {
      closeModal();
    }).then((handle) => {
      if (!isSubscribed) {
        handle.remove();
      } else {
        listenerHandle = handle;
      }
    });

    return () => {
      isSubscribed = false;
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [isModalOpen, closeModal]);

  const handleMenuClick = () => {
    if (window.innerWidth >= 768) {
      setIsExpanded((prev) => !prev);
    } else {
      setSidebarOpen(true);
    }
  };

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-gray-50 box-border">

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
          flex-1 flex flex-col min-w-0 overflow-hidden pt-14 md:pt-16
          transition-all duration-300
          ${isExpanded ? 'md:ml-64' : 'md:ml-16'}
        `}
      >
        <Header onMenuClick={handleMenuClick} />

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50 p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Subscription Expiry Modal */}
      <SubscriptionExpiryModal
        isOpen={isModalOpen}
        subscription={subscription}
        onClose={closeModal}
      />
    </div>
  );
};

export default DashboardLayout;