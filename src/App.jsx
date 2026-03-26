import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import CustomerCare from './pages/CustomerCare';

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

  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

// App Routes component that uses auth context
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const isAuth = isAuthenticated();
  const appBase = '/app';

  return (
    <Router>
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
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="" replace />} />
                </Routes>
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
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;