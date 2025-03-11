import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import WorkspaceForm from './WorkspaceForm';
import config from '../../config/config';

const EditWorkspace = ({ workspaceId }) => {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.apiUrl}/workspaces/${workspaceId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setWorkspace(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching workspace:', err);
      setError('Failed to load workspace data. Please try again later.');
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspace();
    } else {
      setError('Workspace ID is required');
      setLoading(false);
    }
  }, [workspaceId, fetchWorkspace]);

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="loading-spinner" size={30} />
        <p>Loading workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <FaExclamationTriangle size={30} />
        <p className="error-message">{error}</p>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate(`/workspaces/${workspaceId}`)}
        >
          Back to Workspace
        </button>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="error-container">
        <FaExclamationTriangle size={30} />
        <p className="error-message">Workspace not found.</p>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/workspaces')}
        >
          Back to Workspaces
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Edit Workspace</h1>
      <WorkspaceForm workspace={workspace} isEditing={true} />
    </div>
  );
};

export default EditWorkspace; 