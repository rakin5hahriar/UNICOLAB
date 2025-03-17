import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaFileAlt, FaEdit, FaTrashAlt, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import config from '../../config/config';
import DeleteConfirmationModal from '../common/DeleteConfirmationModal';
import './WorkspaceDocumentList.css';

const WorkspaceDocumentList = ({ workspaceId }) => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication required. Please log in again.');
          setLoading(false);
          return;
        }

        let url = `${config.apiUrl}/documents`;
        if (workspaceId) {
          url = `${config.apiUrl}/workspaces/${workspaceId}/documents`;
        }

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setDocuments(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching documents:', err);
        let errorMessage = 'Failed to load documents. Please try again later.';
        
        if (err.response?.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
          navigate('/login');
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [workspaceId, navigate]);

  const handleCreateDocument = () => {
    if (workspaceId) {
      navigate(`/workspaces/${workspaceId}/documents/new`);
    } else {
      navigate('/documents/new');
    }
  };

  const handleEditDocument = (documentId) => {
    navigate(`/documents/${documentId}/edit`);
  };

  const handleOpenDocument = (documentId) => {
    navigate(`/documents/${documentId}`);
  };

  const handleDeleteClick = (document) => {
    setDocumentToDelete(document);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${config.apiUrl}/documents/${documentToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setDocuments(documents.filter(doc => doc._id !== documentToDelete._id));
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    } catch (err) {
      console.error('Error deleting document:', err);
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDocumentToDelete(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <FaExclamationTriangle />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="workspace-document-list">
      {documents.length === 0 ? (
        <div className="empty-documents">
          <FaFileAlt className="empty-icon" />
          <p>No documents found</p>
          <button className="btn btn-primary" onClick={handleCreateDocument}>
            Create Your First Document
          </button>
        </div>
      ) : (
        <>
          <div className="documents-grid">
            {documents.map(document => (
              <div key={document._id} className="document-card">
                <div className="document-icon">
                  <FaFileAlt />
                </div>
                <div className="document-info" onClick={() => handleOpenDocument(document._id)}>
                  <h3 className="document-title">{document.title}</h3>
                  <p className="document-updated">
                    Updated: {formatDate(document.updatedAt || document.createdAt)}
                  </p>
                </div>
                <div className="document-actions">
                  <button 
                    className="btn btn-icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditDocument(document._id);
                    }}
                    title="Edit document settings"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="btn btn-icon btn-danger" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(document);
                    }}
                    title="Delete document"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {showDeleteModal && documentToDelete && (
        <DeleteConfirmationModal
          title="Delete Document"
          message={`Are you sure you want to delete "${documentToDelete.title}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
};

export default WorkspaceDocumentList; 