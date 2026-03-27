import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Mail, Lock, LogIn, AlertCircle, Wifi } from 'lucide-react';
import logo from '../assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Monitor online/offline status for mobile networks
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mobile connectivity check
    if (!isOnline) {
      setError('No internet connection. Please check your network.');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.success) {
      navigate('/app');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full opacity-5 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full opacity-5 translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header with animation */}
        <div className="text-center space-y-3">

          {/* 🔷 Logo Circle */}
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20">
              <img
                src={logo}
                alt="Dental Logo"
                className="h-12 w-12 object-contain brightness-0 invert"
              />
            </div>
          </div>

          {/* 🔷 Title */}
          <h2 className="text-3xl font-semibold text-white tracking-tight">
            My Dental Clinic Pro
          </h2>

          {/* 🔷 Subtitle */}
          <p className="text-sm text-blue-100">
            Professional dental management system
          </p>

        </div>

        {/* Login Form */}
        <div className="bg-white py-10 px-8 shadow-2xl rounded-2xl backdrop-blur-sm border border-white border-opacity-20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Network Status */}
            {!isOnline && (
              <div className="flex items-start gap-3 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                <Wifi className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <p className="font-semibold">No Internet Connection</p>
                  <p className="text-xs mt-1">Please check your mobile data or WiFi connection</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-semibold">{error}</p>
                  {error.includes('Network error') && (
                    <p className="text-xs mt-1">Try checking your connection and try again</p>
                  )}
                  {error.includes('timeout') && (
                    <p className="text-xs mt-1">Server is taking too long. Try again shortly</p>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border-0 text-base font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In
                </>
              )}
            </button>

            {/* Demo Credentials */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600 text-center">
                <p className="font-semibold text-gray-700 mb-2">Demo Credentials:</p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1 font-mono text-xs">
                  <p><span className="text-gray-600">Email:</span> <span className="text-gray-900">admin@example.com</span></p>
                  <p><span className="text-gray-600">Password:</span> <span className="text-gray-900">admin123</span></p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;