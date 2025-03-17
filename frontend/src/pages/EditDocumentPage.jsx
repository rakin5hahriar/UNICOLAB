import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import DocumentForm from '../components/documents/DocumentForm';
import config from '../config/config';
import './EditDocumentPage.css';

const EditDocumentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${config.apiUrl}/documents/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setDocument(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err.response?.data?.message || 'Failed to load document. Please try again later.');
        setLoading(false);
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id]);

  const handleBack = () => {
    navigate(`/documents/${id}`);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-container">
          <FaExclamationTriangle />
          <h2>Error</h2>
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/documents')}
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container">
        <div className="error-container">
          <FaExclamationTriangle />
          <h2>Error</h2>
          <p>Document not found</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/documents')}
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={handleBack}
        >
          <FaArrowLeft /> Back to Document
        </button>
      </div>
      
      <div className="edit-document-container">
        <DocumentForm document={document} isEditing={true} />
      </div>
    </div>
  );
};

export default EditDocumentPage; 