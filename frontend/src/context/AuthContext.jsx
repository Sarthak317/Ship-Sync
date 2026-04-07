import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  // Check if admin is logged in on mount
  useEffect(() => {
    const adminData = localStorage.getItem('shipment-tracker-admin');
    if (adminData) {
      try {
        const { email, timestamp } = JSON.parse(adminData);
        // Check if session is less than 24 hours old
        const hoursSinceLogin = (Date.now() - timestamp) / (1000 * 60 * 60);
        if (hoursSinceLogin < 24) {
          setIsAdmin(true);
          setAdminEmail(email);
        } else {
          // Session expired
          localStorage.removeItem('shipment-tracker-admin');
        }
      } catch (error) {
        localStorage.removeItem('shipment-tracker-admin');
      }
    }
  }, []);

  // Admin login function
  const loginAsAdmin = (email, password) => {
    // TODO: Replace with actual backend API call
    // For now, hardcoded credentials
    if (email === 'admin@gmail.com' && password === 'admin123') {
      const adminData = {
        email,
        timestamp: Date.now()
      };
      localStorage.setItem('shipment-tracker-admin', JSON.stringify(adminData));
      setIsAdmin(true);
      setAdminEmail(email);
      return { success: true };
    } else {
      return { success: false, error: 'Invalid admin credentials' };
    }
  };

  // Admin logout function
  const logoutAdmin = () => {
    localStorage.removeItem('shipment-tracker-admin');
    setIsAdmin(false);
    setAdminEmail('');
  };

  const value = {
    isAdmin,
    adminEmail,
    loginAsAdmin,
    logoutAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;