import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationContainer from './components/NotificationContainer';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Treatments from './pages/Treatments';
import TreatmentDetail from './pages/TreatmentDetail';
import TreatmentVideos from './pages/TreatmentVideos';
import Settings from './pages/Settings';
import ClinicSettings from './pages/ClinicSettings';
import CustomerCare from './pages/CustomerCare';

const Subscriptions = lazy(() => import('./pages/Subscriptions'));

const RouteLoading = () => (
  <div className="space-y-8" aria-label="Loading page">
    <div className="skeleton h-40 rounded-[28px]" />
    <div className="skeleton h-64 rounded-[28px]" />
  </div>
);

// Handle native Android back button using the same history stack as React Router.
const NativeBackHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return undefined;
    }

    let listener = null;

    const registerBackHandler = async () => {
      listener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          navigate(-1);
        } else {
          CapacitorApp.exitApp();
        }
      });
    };

    registerBackHandler();

    return () => {
      listener?.remove();
    };
  }, [navigate, location.key]);

  return null;
};

const DeepLinkHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return undefined;
    }

    const handleAppUrlOpen = (event) => {
      try {
        const url = new URL(event.url);
        if (url.protocol !== 'mydentalclinicpro:' || url.hostname !== 'app') {
          return;
        }

        if (url.pathname.startsWith('/treatments/')) {
          const treatmentId = url.pathname.split('/')[2];
          const visitId = url.searchParams.get('visit_id');
          const targetPath = `/app/treatments/${treatmentId}${visitId ? `?visit_id=${visitId}` : ''}`;
          navigate(targetPath, { replace: true });
        }
      } catch (error) {
        console.warn('Failed to handle deep link', error, { url: event.url });
      }
    };

    const handleNotificationAction = (event) => {
      const rawData = event?.notification?.data || event?.data || {};
      const deepLink = rawData?.deep_link || rawData?.url || rawData?.deepLink;
      if (!deepLink) {
        return;
      }

      try {
        const url = new URL(deepLink);
        if (url.protocol !== 'mydentalclinicpro:' || url.hostname !== 'app') {
          return;
        }

        if (url.pathname.startsWith('/treatments/')) {
          const treatmentId = url.pathname.split('/')[2];
          const visitId = url.searchParams.get('visit_id');
          const targetPath = `/app/treatments/${treatmentId}${visitId ? `?visit_id=${visitId}` : ''}`;
          navigate(targetPath, { replace: true });
        }
      } catch (error) {
        console.warn('Failed to handle notification action deep link', error, { deepLink });
      }
    };

    const listener = CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen);
    const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', handleNotificationAction);
    return () => {
      listener?.remove();
      actionListener?.remove();
    };
  }, [navigate]);

  return null;
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated() ? children : <Navigate to="/" replace />;
};

// App Routes component that uses auth context
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const isAuth = isAuthenticated();
  const appBase = '/app';

  return (
    <Router>
      <NativeBackHandler />
      <Routes>
        <Route
          path="/"
          element={isAuth ? <Navigate to={appBase} replace /> : <Landing />}
        />
        <Route
          path="/login"
          element={isAuth ? <Navigate to={appBase} replace /> : <Login />}
        />

        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Routes>
                  <Route path="" element={<Dashboard />} />
                  <Route path="patients" element={<Patients />} />
                  <Route path="patients/:id" element={<PatientDetail />} />
                  <Route path="treatments" element={<Treatments />} />
                  <Route path="treatments/:id" element={<TreatmentDetail />} />
                  <Route path="treatment-videos" element={<TreatmentVideos />} />
                  <Route path="customer-care" element={<CustomerCare />} />
                  <Route path="clinic-settings" element={<ClinicSettings />} />
                  <Route
                    path="subscriptions"
                    element={(
                      <Suspense fallback={<RouteLoading />}>
                        <Subscriptions />
                      </Suspense>
                    )}
                  />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="" replace />} />
                </Routes>
                <DeepLinkHandler />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={isAuth ? <Navigate to={appBase} replace /> : <Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
};

function App() {
  console.log('App rendering');
  return (
    <NotificationProvider>
      <AuthProvider>
        <AppRoutes />
        <NotificationContainer />
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;