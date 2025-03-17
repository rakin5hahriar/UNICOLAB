import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSpinner } from 'react-icons/fa';
import config from '../../config/config';
import './DocumentForm.css';

const DocumentForm = ({ workspaceId, document, isEditing }) => {
  const [title, setTitle] = useState(document?.title || '');
  const [isPublic, setIsPublic] = useState(document?.isPublic || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaceId || document?.workspace || '');
  const navigate = useNavigate();

  // Fetch available workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/api/workspaces`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setWorkspaces(response.data);
        
        // If no workspace is selected and we have workspaces, select the first one
        if (!selectedWorkspace && response.data.length > 0) {
          setSelectedWorkspace(response.data[0]._id);
        }
      } catch (err) {
        console.error('Error fetching workspaces:', err);
      }
    };

    fetchWorkspaces();
  }, [selectedWorkspace]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a document title');
      return;
    }

    if (!selectedWorkspace) {
      setError('Please select a workspace');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Default Slate content
      const defaultContent = JSON.stringify([
        {
          type: 'paragraph',
          children: [
            { text: 'Start typing here...' }
          ],
        },
      ]);

      const documentData = {
        title,
        isPublic,
        workspaceId: selectedWorkspace,
        content: document?.content || defaultContent
      };

      let response;
      
      if (isEditing) {
        // Update existing document
        response = await axios.put(`${config.apiUrl}/api/documents/${document._id}`, documentData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
      } else {
        // Create new document
        response = await axios.post(`${config.apiUrl}/api/documents`, documentData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
      }

      setLoading(false);
      
      // Navigate to the document editor
      navigate(`/documents/${response.data._id}`);
    } catch (err) {
      console.error('Error saving document:', err);
      setError(err.response?.data?.message || 'Failed to save document. Please try again later.');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEditing && document?._id) {
      navigate(`/documents/${document._id}`);
    } else if (workspaceId) {
      navigate(`/workspaces/${workspaceId}`);
    } else {
      navigate('/documents');
    }
  };

  return (
    <div className="document-form-container">
      <h2>{isEditing ? 'Edit Document' : 'Create New Document'}</h2>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      <form onSubmit={handleSubmit} className="document-form">
        <div className="form-group">
          <label htmlFor="title">Document Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter document title"
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="workspace">Workspace</label>
          <select
            id="workspace"
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            className="form-control"
            required
            disabled={workspaceId || isEditing}
          >
            <option value="">Select a workspace</option>
            {workspaces.map(workspace => (
              <option key={workspace._id} value={workspace._id}>
                {workspace.name}
              </option>
            ))}
          </select>
          {workspaces.length === 0 && (
            <p className="text-muted mt-2">
              No workspaces available. Please create a workspace first.
            </p>
          )}
        </div>
        
        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="form-check-input"
            />
            <label htmlFor="isPublic" className="form-check-label">
              Make document public (anyone with the link can view)
            </label>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || workspaces.length === 0}
          >
            {loading ? (
              <>
                <FaSpinner className="spinner" /> 
                {isEditing ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Save Changes' : 'Create Document'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentForm; 