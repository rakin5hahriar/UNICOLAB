import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaSpinner, 
  FaExclamationTriangle, 
  FaUsers, 
  FaSave, 
  FaUserPlus 
} from 'react-icons/fa';
import CollaborativeEditor from '../components/documents/CollaborativeEditor';
import { initialSlateValue } from '../components/documents/initialSlateValue';
import config from '../config/config';
import { useAuth } from '../context/AuthContext';
import './DocumentEditorPage.css';

const DocumentEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [showCollaboratorForm, setShowCollaboratorForm] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${config.apiUrl}/api/documents/${id}`, {
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

  const handleSaveContent = async (content) => {
    try {
      console.log('Saving document content:', content);
      setSaving(true);
      
      // Make sure we have content to save
      if (!content) {
        console.error('No content to save');
        setSaving(false);
        return;
      }
      
      const response = await axios.put(
        `${config.apiUrl}/api/documents/${id}`, 
        { content },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Document saved successfully:', response.data);
      
      // Update the local document state with the saved content
      setDocument(prev => ({
        ...prev,
        content
      }));
      
      setSaving(false);
      toast.success('Document saved successfully!');
    } catch (err) {
      console.error('Error saving document content:', err);
      setSaving(false);
      toast.error('Failed to save document. Please try again later.');
    }
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    
    if (!collaboratorEmail.trim()) {
      return;
    }

    try {
      console.log('Adding collaborator with email:', collaboratorEmail);
      
      const response = await axios.post(
        `${config.apiUrl}/api/documents/${id}/collaborators`,
        { email: collaboratorEmail },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Collaborator added successfully:', response.data);
      
      // Update the document state with the new collaborator
      setDocument(response.data);
      setCollaboratorEmail('');
      setShowCollaboratorForm(false);
      toast.success('Collaborator added successfully!');
    } catch (err) {
      console.error('Error adding collaborator:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add collaborator. Please try again later.';
      toast.error(errorMessage);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    try {
      const response = await axios.delete(
        `${config.apiUrl}/api/documents/${id}/collaborators/${collaboratorId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setDocument(response.data);
      toast.success('Collaborator removed successfully!');
    } catch (err) {
      console.error('Error removing collaborator:', err);
      toast.error('Failed to remove collaborator. Please try again later.');
    }
  };

  const isOwner = document?.owner?._id === user?.id;

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
    <div className="document-editor-page">
      <div className="document-editor-header">
        <div className="document-editor-nav">
          <button 
            className="btn btn-sm btn-outline-secondary" 
            onClick={() => navigate('/documents')}
          >
            <FaArrowLeft /> Back to Documents
          </button>
          <h1>{document.title}</h1>
        </div>
        
        <div className="document-editor-actions">
          {saving && (
            <div className="saving-indicator">
              <FaSpinner className="spinner" /> Saving...
            </div>
          )}
          
          <div className="collaborators-container">
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={() => setShowCollaboratorForm(!showCollaboratorForm)}
              title="Add collaborator"
              disabled={!isOwner}
            >
              <FaUserPlus /> {document.collaborators.length > 0 ? document.collaborators.length : ''}
            </button>
            
            {showCollaboratorForm && (
              <div className="collaborator-form">
                <h3>Add Collaborator</h3>
                <form onSubmit={handleAddCollaborator}>
                  <input
                    type="email"
                    value={collaboratorEmail}
                    onChange={(e) => setCollaboratorEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                  <button type="submit" className="btn btn-sm btn-primary">
                    Add
                  </button>
                </form>
                
                {document.collaborators.length > 0 && (
                  <div className="collaborators-list">
                    <h4>Current Collaborators</h4>
                    <ul>
                      {document.collaborators.map(collaborator => (
                        <li key={collaborator._id}>
                          {collaborator.username} ({collaborator.email})
                          {isOwner && (
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleRemoveCollaborator(collaborator._id)}
                              title="Remove collaborator"
                            >
                              &times;
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="document-editor-content">
        <CollaborativeEditor
          documentId={id}
          initialContent={document.content || JSON.stringify(initialSlateValue)}
          onContentChange={handleSaveContent}
          userName={user?.username || user?.name || 'Anonymous'}
          userColor={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
        />
      </div>
    </div>
  );
};

export default DocumentEditorPage; 