import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create an axios instance for file uploads
const fileApi = axios.create({
  baseURL: `${API_URL}/files`,
  // Don't set Content-Type here as it will be set automatically for multipart/form-data
});

// Add a request interceptor to include the auth token
fileApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Upload file with progress tracking
export const uploadFile = async (formData, onProgress) => {
  try {
    // Important: Do not set Content-Type header when uploading files
    // Axios will automatically set the correct Content-Type with boundary for multipart/form-data
    const response = await fileApi.post('/', formData, {
      headers: {
        // Remove Content-Type header to let the browser set it with the boundary
        'Content-Type': undefined
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        if (onProgress) {
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  } catch (error) {
    console.error('File upload error:', error);
    throw error.response?.data || { message: error.message };
  }
};

// Delete file
export const deleteFile = async (filename) => {
  try {
    const response = await fileApi.delete(`/${filename}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

const fileApiService = {
  uploadFile,
  deleteFile,
};

export default fileApiService; 