import axios from 'axios';
import config from '../config/config';

// Create an axios instance
const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
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

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Create a more user-friendly error object
    let errorMessage = 'An unexpected error occurred';
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          errorMessage = data.message || 'Invalid request';
          break;
        case 401:
          errorMessage = 'Your session has expired. Please log in again.';
          // Clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action';
          break;
        case 404:
          errorMessage = data.message || 'Resource not found';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later';
          break;
        default:
          errorMessage = data.message || `Error ${status}: Something went wrong`;
      }
      
      return Promise.reject({
        message: errorMessage,
        status,
        data: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response from server. Please check your connection';
      return Promise.reject({
        message: errorMessage,
        isConnectionError: true
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = error.message || 'Request failed';
      return Promise.reject({
        message: errorMessage
      });
    }
  }
);

// Workspace API endpoints
export const getWorkspaces = async () => {
  try {
    const response = await api.get('/workspaces');
    return response.data;
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    throw error;
  }
};

export const getWorkspacesByCourse = async (courseId) => {
  try {
    const response = await api.get(`/workspaces/course/${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching workspaces for course ${courseId}:`, error);
    throw error;
  }
};

export const getWorkspaceById = async (id) => {
  try {
    const response = await api.get(`/workspaces/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching workspace ${id}:`, error);
    throw error;
  }
};

export const createWorkspace = async (workspaceData) => {
  try {
    const response = await api.post('/workspaces', workspaceData);
    return response.data;
  } catch (error) {
    console.error('Error creating workspace:', error);
    throw error;
  }
};

export const updateWorkspace = async (id, workspaceData) => {
  try {
    const response = await api.put(`/workspaces/${id}`, workspaceData);
    return response.data;
  } catch (error) {
    console.error(`Error updating workspace ${id}:`, error);
    throw error;
  }
};

export const deleteWorkspace = async (id) => {
  try {
    const response = await api.delete(`/workspaces/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting workspace ${id}:`, error);
    throw error;
  }
};

// Workspace Item API endpoints
export const getWorkspaceItems = async (workspaceId) => {
  try {
    const response = await api.get(`/workspace-items/workspace/${workspaceId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching items for workspace ${workspaceId}:`, error);
    throw error;
  }
};

export const getWorkspaceItemById = async (id) => {
  try {
    const response = await api.get(`/workspace-items/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching workspace item ${id}:`, error);
    throw error;
  }
};

export const createWorkspaceItem = async (workspaceId, itemData) => {
  try {
    // Ensure workspaceId is included in the request
    const response = await api.post('/workspace-items', {
      ...itemData,
      workspace: workspaceId
    });
    
    if (!response.data) {
      throw new Error('No data received from server');
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error creating item for workspace ${workspaceId}:`, error);
    throw error.response?.data?.message || error.message || 'Failed to create workspace item';
  }
};

export const updateWorkspaceItem = async (id, itemData) => {
  try {
    const response = await api.put(`/workspace-items/${id}`, itemData);
    return response.data;
  } catch (error) {
    console.error(`Error updating workspace item ${id}:`, error);
    throw error;
  }
};

export const deleteWorkspaceItem = async (id) => {
  try {
    const response = await api.delete(`/workspace-items/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting workspace item ${id}:`, error);
    throw error;
  }
};

const workspaceApi = {
  getWorkspaces,
  getWorkspacesByCourse,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceItems,
  getWorkspaceItemById,
  createWorkspaceItem,
  updateWorkspaceItem,
  deleteWorkspaceItem,
};

export default workspaceApi; 