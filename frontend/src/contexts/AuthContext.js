import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password, rememberMe = false) => {
    try {
      const result = await authService.login(email, password);
      
      if (result.success) {
        setUser(result.data.user);
        return true;
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Register function
  const register = async (name, email, password) => {
    try {
      console.log('Registering with:', { name, email, password: '****' });
      
      const userData = { 
        name, 
        email, 
        password 
      };
      
      const result = await authService.register(userData);
      
      if (result.success) {
        setUser(result.data.user);
        return true;
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Create a guest user
  const createGuestUser = (name = 'Guest User') => {
    const guestUser = {
      id: 'guest-' + Math.random().toString(36).substr(2, 9),
      name: name,
      isGuest: true
    };
    setUser(guestUser);
    localStorage.setItem('user', JSON.stringify(guestUser));
    return guestUser;
  };

  // Update user profile
  const updateProfile = async (updates) => {
    if (!user) return false;
    
    try {
      const result = await authService.updateProfile(updates);
      
      if (result.success) {
        setUser(result.data);
        return true;
      } else {
        throw new Error(result.error || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  // Auth context value
  const value = {
    user,
    loading,
    login,
    logout,
    register,
    createGuestUser,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 