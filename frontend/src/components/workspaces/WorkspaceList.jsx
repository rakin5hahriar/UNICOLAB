import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFolder, FaCalendarAlt, FaUserAlt, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import './WorkspaceList.css';
import config from '../../config/config';
import { useAuth } from '../../context/AuthContext';
import DeleteConfirmationModal from '../common/DeleteConfirmationModal';

const WorkspaceList = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.apiUrl}/workspaces`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setWorkspaces(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching workspaces:', err);
      setError('Failed to load workspaces. Please try again later.');
      setLoading(false);
    }
  };

  const handleViewWorkspace = (workspaceId) => {
    console.log('Navigating to workspace with ID:', workspaceId);
    navigate(`/workspaces/${workspaceId}`);
  };

  const handleDeleteClick = (workspace) => {
    setWorkspaceToDelete(workspace);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${config.apiUrl}/workspaces/${workspaceToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setWorkspaces(workspaces.filter(w => w._id !== workspaceToDelete._id));
      setShowDeleteModal(false);
      setWorkspaceToDelete(null);
    } catch (err) {
      console.error('Error deleting workspace:', err);
      setError('Failed to delete workspace. Please try again later.');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setWorkspaceToDelete(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="loading-spinner" size={30} />
        <p>Loading workspaces...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <FaExclamationTriangle size={30} />
        <p className="error-message">{error}</p>
        <button className="btn btn-primary" onClick={fetchWorkspaces}>Try Again</button>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="empty-state">
        <FaFolder size={50} color="#9ca3af" />
        <h2>No Workspaces Found</h2>
        <p>You haven't created any workspaces yet. Create a new workspace to get started.</p>
        <button className="btn btn-primary" onClick={() => navigate('/workspaces/new')}>Create Workspace</button>
      </div>
    );
  }

  return (
    <div>
      <div className="workspaces-list">
        {workspaces.map((workspace) => (
          <div key={workspace._id} className="workspace-card">
            <div className="workspace-header">
              <div className="workspace-icon">
                <FaFolder />
              </div>
              <h3>{workspace.name}</h3>
            </div>
            <div className="workspace-content">
              <p className="workspace-description">
                {workspace.description || 'No description provided.'}
              </p>
              <div className="workspace-meta">
                <span>
                  <FaCalendarAlt />
                  {formatDate(workspace.createdAt)}
                </span>
                <span>
                  <FaUserAlt />
                  {workspace.owner?.username || user?.username || 'Unknown'}
                </span>
              </div>
            </div>
            <div className="workspace-actions">
              <button 
                className="btn btn-view" 
                onClick={() => handleViewWorkspace(workspace._id)}
              >
                View Workspace
              </button>
              <button 
                className="btn btn-delete" 
                onClick={() => handleDeleteClick(workspace)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Delete Workspace"
          message={`Are you sure you want to delete the workspace "${workspaceToDelete?.name}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
};

export default WorkspaceList; 