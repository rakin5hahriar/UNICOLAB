import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaFile, 
  FaPlus, 
  FaEdit, 
  FaTrashAlt, 
  FaUsers, 
  FaSpinner, 
  FaExclamationTriangle 
} from 'react-icons/fa';
import config from '../../config/config';
import './DocumentList.css';

const DocumentList = ({ workspaceId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const url = workspaceId 
          ? `${config.apiUrl}/api/documents/workspace/${workspaceId}`
          : `${config.apiUrl}/api/documents`;
          
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setDocuments(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents. Please try again later.');
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [workspaceId]);

  const handleCreateDocument = () => {
    navigate(workspaceId 
      ? `/workspaces/${workspaceId}/documents/new`
      : '/documents/new'
    );
  };

  const handleEditDocument = (documentId) => {
    navigate(`/documents/${documentId}/edit`);
  };

  const handleViewDocument = (documentId) => {
    navigate(`/documents/${documentId}`);
  };

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axios.delete(`${config.apiUrl}/api/documents/${documentId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Remove the deleted document from the list
        setDocuments(documents.filter(doc => doc._id !== documentId));
      } catch (err) {
        console.error('Error deleting document:', err);
        alert('Failed to delete document. Please try again later.');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="documents-loading">
        <FaSpinner className="spinner" />
        <p>Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="documents-error">
        <FaExclamationTriangle />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="documents-container">
      <div className="documents-header">
        <h2>Documents</h2>
        <button 
          className="btn btn-primary create-document-btn" 
          onClick={handleCreateDocument}
        >
          <FaPlus /> New Document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="no-documents">
          <FaFile className="no-documents-icon" />
          <p>No documents found</p>
          <button 
            className="btn btn-primary" 
            onClick={handleCreateDocument}
          >
            Create your first document
          </button>
        </div>
      ) : (
        <div className="documents-list">
          {documents.map(document => (
            <div key={document._id} className="document-item">
              <div 
                className="document-info" 
                onClick={() => handleViewDocument(document._id)}
              >
                <div className="document-icon">
                  <FaFile />
                </div>
                <div className="document-details">
                  <h3>{document.title}</h3>
                  <div className="document-meta">
                    <span>Last modified: {formatDate(document.lastModified)}</span>
                    <span>Owner: {document.owner.username}</span>
                    {document.collaborators.length > 0 && (
                      <span className="collaborators">
                        <FaUsers /> {document.collaborators.length} collaborator(s)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="document-actions">
                <button 
                  className="btn btn-sm btn-outline-primary" 
                  onClick={() => handleEditDocument(document._id)}
                  title="Edit document settings"
                >
                  <FaEdit />
                </button>
                <button 
                  className="btn btn-sm btn-outline-danger" 
                  onClick={() => handleDeleteDocument(document._id)}
                  title="Delete document"
                >
                  <FaTrashAlt />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList; 