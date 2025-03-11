import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class DocumentService {
    constructor() {
        this.api = axios.create({
            baseURL: `${API_URL}/api/documents`,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Initialize token from localStorage
        const token = localStorage.getItem('token');
        if (token) {
            this.setAuthToken(token);
        }
    }

    // Set auth token for API calls
    setAuthToken(token) {
        if (token) {
            this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.api.defaults.headers.common['Authorization'];
        }
    }

    // Get all documents (owned and shared)
    async getDocuments() {
        try {
            const response = await this.api.get('/');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching documents:', error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Failed to fetch documents' 
            };
        }
    }

    // Get a document by ID
    async getDocumentById(id) {
        try {
            const response = await this.api.get(`/${id}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error(`Error fetching document ${id}:`, error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Failed to fetch document' 
            };
        }
    }

    // Create a new document
    async createDocument(documentData) {
        try {
            const response = await this.api.post('/', documentData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error creating document:', error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Failed to create document' 
            };
        }
    }

    // Update a document
    async updateDocument(id, documentData) {
        try {
            const response = await this.api.put(`/${id}`, documentData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error(`Error updating document ${id}:`, error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Failed to update document' 
            };
        }
    }

    // Delete a document
    async deleteDocument(id) {
        try {
            const response = await this.api.delete(`/${id}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error(`Error deleting document ${id}:`, error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Failed to delete document' 
            };
        }
    }

    // Share a document with another user
    async shareDocument(id, email) {
        try {
            const response = await this.api.post(`/${id}/share`, { email });
            return { success: true, data: response.data };
        } catch (error) {
            console.error(`Error sharing document ${id}:`, error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Failed to share document' 
            };
        }
    }

    // Remove share access for a user
    async removeShare(id, userId) {
        try {
            const response = await this.api.delete(`/${id}/share/${userId}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error(`Error removing share for document ${id}:`, error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Failed to remove share' 
            };
        }
    }
}

const documentService = new DocumentService();
export default documentService; 