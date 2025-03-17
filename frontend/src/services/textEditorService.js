import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const textEditorService = {
  // Create a new document
  createDocument: async (title, content) => {
    try {
      const response = await axios.post(`${API_URL}/documents`, { title, content });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all documents
  getDocuments: async () => {
    try {
      const response = await axios.get(`${API_URL}/documents`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get a specific document
  getDocument: async (documentId) => {
    try {
      const response = await axios.get(`${API_URL}/documents/${documentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update a document
  updateDocument: async (documentId, title, content) => {
    try {
      const response = await axios.put(`${API_URL}/documents/${documentId}`, { title, content });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete a document
  deleteDocument: async (documentId) => {
    try {
      const response = await axios.delete(`${API_URL}/documents/${documentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add a collaborator
  addCollaborator: async (documentId, collaboratorId) => {
    try {
      const response = await axios.post(`${API_URL}/documents/${documentId}/collaborators`, { collaboratorId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Add axios interceptor for authentication
axios.interceptors.request.use(
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

export default textEditorService; 