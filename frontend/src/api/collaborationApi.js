import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Document API functions
 */

// Get a document by ID
export const getDocument = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/documents/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
};

// Create a new document
export const createDocument = async (documentData) => {
  try {
    const response = await axios.post(`${API_URL}/api/documents`, documentData);
    return response.data;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

// Update a document
export const updateDocument = async (id, documentData) => {
  try {
    const response = await axios.put(`${API_URL}/api/documents/${id}`, documentData);
    return response.data;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

// Delete a document
export const deleteDocument = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/documents/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Get document versions
export const getDocumentVersions = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/documents/${id}/versions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document versions:', error);
    throw error;
  }
};

// Get a specific document version
export const getDocumentVersion = async (documentId, versionId) => {
  try {
    const response = await axios.get(`${API_URL}/api/documents/${documentId}/versions/${versionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document version:', error);
    throw error;
  }
};

/**
 * Whiteboard API functions
 */

// Get all whiteboards
export const getWhiteboards = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/whiteboards`);
    return response.data;
  } catch (error) {
    console.error('Error fetching whiteboards:', error);
    throw error;
  }
};

// Get a whiteboard by ID
export const getWhiteboard = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/whiteboards/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching whiteboard:', error);
    throw error;
  }
};

// Create a new whiteboard
export const createWhiteboard = async (whiteboardData) => {
  try {
    const response = await axios.post(`${API_URL}/api/whiteboards`, whiteboardData);
    return response.data;
  } catch (error) {
    console.error('Error creating whiteboard:', error);
    throw error;
  }
};

// Update a whiteboard
export const updateWhiteboard = async (id, whiteboardData) => {
  try {
    const response = await axios.put(`${API_URL}/api/whiteboards/${id}`, whiteboardData);
    return response.data;
  } catch (error) {
    console.error('Error updating whiteboard:', error);
    throw error;
  }
};

// Delete a whiteboard
export const deleteWhiteboard = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/whiteboards/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting whiteboard:', error);
    throw error;
  }
};

/**
 * Course collaboration API functions
 */

// Get all documents for a course
export const getCourseDocuments = async (courseId) => {
  try {
    const response = await axios.get(`${API_URL}/api/courses/${courseId}/documents`);
    return response.data;
  } catch (error) {
    console.error('Error fetching course documents:', error);
    throw error;
  }
};

// Get all whiteboards for a course
export const getCourseWhiteboards = async (courseId) => {
  try {
    const response = await axios.get(`${API_URL}/api/courses/${courseId}/whiteboards`);
    return response.data;
  } catch (error) {
    console.error('Error fetching course whiteboards:', error);
    throw error;
  }
};

// Create a document for a course
export const createCourseDocument = async (courseId, documentData) => {
  try {
    const response = await axios.post(`${API_URL}/api/courses/${courseId}/documents`, documentData);
    return response.data;
  } catch (error) {
    console.error('Error creating course document:', error);
    throw error;
  }
};

// Create a whiteboard for a course
export const createCourseWhiteboard = async (courseId, whiteboardData) => {
  try {
    const response = await axios.post(`${API_URL}/api/courses/${courseId}/whiteboards`, whiteboardData);
    return response.data;
  } catch (error) {
    console.error('Error creating course whiteboard:', error);
    throw error;
  }
}; 