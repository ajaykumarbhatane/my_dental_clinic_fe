import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext();

// Storage helper - gracefully handles localStorage unavailability on mobile
const StorageHelper = {
  setToken: (token) => {
    try {
      localStorage.setItem('token', token);
    } catch (e) {
      try {
        sessionStorage.setItem('token', token);
      } catch (e2) {
        console.warn('Storage unavailable, using in-memory fallback');
      }
    }
  },

  getToken: () => {
    try {
      return localStorage.getItem('token');
    } catch (e) {
      try {
        return sessionStorage.getItem('token');
      } catch (e2) {
        return null;
      }
    }
  },

  setUser: (user) => {
    try {
      localStorage.setItem('user', JSON.stringify(user));
    } catch (e) {
      try {
        sessionStorage.setItem('user', JSON.stringify(user));
      } catch (e2) {
        console.warn('Storage unavailable, using in-memory fallback');
      }
    }
  },

  getUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      try {
        const user = sessionStorage.getItem('user');
        return user ? JSON.parse(user) : null;
      } catch (e2) {
        return null;
      }
    }
  },

  clear: () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {
      try {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      } catch (e2) {}
    }
  },
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth must be used within an AuthProvider. Returning safe fallback.');
    return {
      user: null,
      token: null,
      loading: false,
      error: null,
      login: async () => ({ success: false, error: 'Auth provider not available' }),
      logout: async () => {},
      isAuthenticated: () => false,
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(StorageHelper.getToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app start
  useEffect(() => {
    const storedToken = StorageHelper.getToken();
    const storedUser = StorageHelper.getUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authApi.login({ email, password });
      const { token: newToken, user: userData } = response.data;

      // Store in storage with fallbacks
      StorageHelper.setToken(newToken);
      StorageHelper.setUser(userData);

      // Update state
      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide detailed error messages for mobile debugging
      let errorMessage = 'Login failed';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - check your internet connection';
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network error - please check your internet connection';
      } else if (error.response?.status === 0) {
        errorMessage = 'Unable to reach server - check CORS and network settings';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error - please try again later';
      }
      
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear storage and state
      StorageHelper.clear();
      setToken(null);
      setUser(null);
      setError(null);
    }
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};