/**
 * Utility functions to check API connection status
 */

import axios from 'axios';

// Get the API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Log API status to console
export const logApiStatus = () => {
  console.log('API URL:', API_URL);
};

// Check if API is reachable
export const checkApiConnection = async () => {
  try {
    // Use a simple endpoint that should always respond quickly
    const response = await axios.get(`${API_URL}/`, { 
      timeout: 3000,
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    console.log('API connection check result:', response.status);
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error('API connection check failed:', error.message);
    
    // Try one more time with a different endpoint
    try {
      const fallbackResponse = await axios.get(`${API_URL}/api/auth/status`, { 
        timeout: 3000,
        headers: { 'Cache-Control': 'no-cache' }
      });
      console.log('API fallback connection check result:', fallbackResponse.status);
      return fallbackResponse.status >= 200 && fallbackResponse.status < 300;
    } catch (fallbackError) {
      console.error('API fallback connection check failed:', fallbackError.message);
      return false;
    }
  }
};

// Get API base URL
export const getApiUrl = () => {
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

const apiCheck = {
  checkApiConnection,
  logApiStatus,
  getApiUrl
};

export default apiCheck; 