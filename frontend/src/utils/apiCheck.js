import axios from 'axios';
import config from '../config/config';

/**
 * Utility function to check if the API is reachable
 * @returns {Promise<boolean>} True if API is reachable, false otherwise
 */
export const checkApiConnection = async () => {
  try {
    const response = await axios.get(`${config.apiUrl.replace('/api', '')}`);
    console.log('API connection check:', response.status);
    return response.status === 200;
  } catch (error) {
    console.error('API connection check failed:', error);
    return false;
  }
};

/**
 * Logs API connection status to console
 */
export const logApiStatus = () => {
  console.log('API URL:', config.apiUrl);
  console.log('Upload URL:', config.uploadUrl);
  
  checkApiConnection()
    .then(isConnected => {
      if (isConnected) {
        console.log('✅ Backend API is reachable');
      } else {
        console.error('❌ Backend API is not reachable');
      }
    })
    .catch(err => {
      console.error('❌ Error checking API connection:', err);
    });
};

const apiCheck = {
  checkApiConnection,
  logApiStatus
};

export default apiCheck; 