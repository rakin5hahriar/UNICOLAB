import axios from 'axios';

// Create an axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
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

// Workspace API endpoints
export const getWorkspaces = async () => {
  try {
    const response = await api.get('/workspaces');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getWorkspacesByCourse = async (courseId) => {
  try {
    const response = await api.get(`/workspaces/course/${courseId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getWorkspaceById = async (id) => {
  try {
    const response = await api.get(`/workspaces/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createWorkspace = async (workspaceData) => {
  try {
    const response = await api.post('/workspaces', workspaceData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateWorkspace = async (id, workspaceData) => {
  try {
    const response = await api.put(`/workspaces/${id}`, workspaceData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteWorkspace = async (id) => {
  try {
    const response = await api.delete(`/workspaces/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Workspace Item API endpoints
export const getWorkspaceItems = async (workspaceId) => {
  try {
    const response = await api.get(`/workspaces/${workspaceId}/items`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getWorkspaceItemById = async (id) => {
  try {
    const response = await api.get(`/workspaces/items/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createWorkspaceItem = async (workspaceId, itemData) => {
  try {
    const response = await api.post(`/workspaces/${workspaceId}/items`, itemData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateWorkspaceItem = async (id, itemData) => {
  try {
    const response = await api.put(`/workspaces/items/${id}`, itemData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteWorkspaceItem = async (id) => {
  try {
    const response = await api.delete(`/workspaces/items/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export default {
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