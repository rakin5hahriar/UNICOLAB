import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up axios defaults
  useEffect(() => {
    // Set default headers
    axios.defaults.headers.post['Content-Type'] = 'application/json';
    
    // Set up response interceptor to handle errors
    axios.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }, []);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        // Check if token exists in localStorage
        const token = localStorage.getItem('token');
        
        if (token) {
          // Set auth token header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          try {
            // Get user data
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`);
            console.log('User profile loaded:', res.data);
            setUser(res.data);
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            // If profile fetch fails, token might be invalid
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
          }
        }
      } catch (err) {
        // Clear token if invalid
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        console.error('Auth check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Make sure we're not sending the auth header for login
      delete axios.defaults.headers.common['Authorization'];
      
      console.log('Attempting login with:', { email });
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, { 
        email, 
        password 
      });
      
      console.log('Login response:', res.data);
      
      // Save token to localStorage
      localStorage.setItem('token', res.data.token);
      
      // Set auth token header
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      // Set user data
      setUser(res.data.user || res.data);
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (name, email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Make sure we're not sending the auth header for register
      delete axios.defaults.headers.common['Authorization'];
      
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, {
        name,
        email,
        password
      });
      
      // Save token to localStorage
      localStorage.setItem('token', res.data.token);
      
      // Set auth token header
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      // Set user data
      setUser(res.data.user || res.data);
      
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Remove auth header
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear user data
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 