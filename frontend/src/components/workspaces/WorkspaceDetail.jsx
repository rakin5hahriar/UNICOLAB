import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  FaFolder, 
  FaCalendarAlt, 
  FaUserAlt, 
  FaPencilAlt, 
  FaTrashAlt, 
  FaPlus, 
  FaFile, 
  FaLink, 
  FaCode, 
  FaSpinner, 
  FaExclamationTriangle 
} from 'react-icons/fa';
import axios from 'axios';
import './WorkspaceDetail.css';
import config from '../../config/config';
import { useAuth } from '../../context/AuthContext';
import DeleteConfirmationModal from '../common/DeleteConfirmationModal';

const WorkspaceDetail = () => {
  const { workspaceId } = useParams();
  const location = useLocation();
  const [workspace, setWorkspace] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  console.log('Current location:', location);
  console.log('WorkspaceDetail rendered with workspaceId:', workspaceId);

  const getWorkspaceIdFromPath = () => {
    const pathParts = location.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    console.log('Extracted workspaceId from path:', id);
    return id;
  };

  const currentWorkspaceId = workspaceId || getWorkspaceIdFromPath();

  const fetchWorkspaceData = useCallback(async () => {
    try {
      console.log('Fetching workspace data for ID:', currentWorkspaceId);
      const token = localStorage.getItem('token');
      console.log('Auth token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      if (!currentWorkspaceId) {
        setError('Workspace ID is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      const workspaceResponse = await axios.get(`${config.apiUrl}/workspaces/${currentWorkspaceId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).catch(err => {
        console.error('Workspace request failed:', err.response?.status, err.response?.data);
        throw err;
      });
      
      console.log('Workspace response:', workspaceResponse.data);
      setWorkspace(workspaceResponse.data);
      
      // Fetch resources for this workspace
      const resourcesResponse = await axios.get(`${config.apiUrl}/workspaces/${currentWorkspaceId}/resources`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).catch(err => {
        console.error('Resources request failed:', err.response?.status, err.response?.data);
        throw err;
      });
      
      console.log('Resources response:', resourcesResponse.data);
      setResources(resourcesResponse.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching workspace data:', err);
      let errorMessage = 'Failed to load workspace data. Please try again later.';
      
      if (err.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
        navigate('/login');
      } else if (err.response?.status === 404) {
        errorMessage = 'Workspace not found.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  }, [currentWorkspaceId, navigate]);

  useEffect(() => {
    console.log('useEffect triggered with currentWorkspaceId:', currentWorkspaceId);
    if (currentWorkspaceId) {
      fetchWorkspaceData();
    } else {
      console.log('No workspaceId provided');
      setError('Workspace ID is required');
      setLoading(false);
    }
  }, [currentWorkspaceId, fetchWorkspaceData]);

  const handleEdit = () => {
    navigate(`/workspaces/${currentWorkspaceId}/edit`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${config.apiUrl}/workspaces/${currentWorkspaceId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      navigate('/workspaces');
    } catch (err) {
      console.error('Error deleting workspace:', err);
      setError('Failed to delete workspace. Please try again later.');
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleAddResource = () => {
    navigate(`/workspaces/${currentWorkspaceId}/resources/new`);
  };

  const handleViewResource = (resourceId) => {
    navigate(`/resources/${resourceId}`);
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      await axios.delete(`${config.apiUrl}/resources/${resourceId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      // Update resources list after deletion
      setResources(resources.filter(resource => resource._id !== resourceId));
    } catch (err) {
      console.error('Error deleting resource:', err);
      setError('Failed to delete resource. Please try again later.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getResourceIcon = (resourceType) => {
    switch (resourceType) {
      case 'file':
        return <FaFile />;
      case 'link':
        return <FaLink />;
      case 'code':
        return <FaCode />;
      default:
        return <FaFile />;
    }
  };

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
        <button className="btn btn-primary" onClick={fetchWorkspaceData}>Try Again</button>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="error-container">
        <FaExclamationTriangle size={30} />
        <p className="error-message">Workspace not found.</p>
        <button className="btn btn-primary" onClick={() => navigate('/workspaces')}>Back to Workspaces</button>
      </div>
    );
  }

  return (
    <div className="workspace-detail-container">
      <div className="workspace-header">
        <div className="workspace-title">
          <div className="workspace-icon">
            <FaFolder />
          </div>
          <div className="workspace-title-text">
            <h1>{workspace.name}</h1>
            <p>Workspace</p>
          </div>
        </div>
        <div className="workspace-actions">
          <button className="btn btn-primary" onClick={handleEdit}>
            <FaPencilAlt /> Edit
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            <FaTrashAlt /> Delete
          </button>
        </div>
      </div>
      
      <div className="workspace-content">
        <div className="workspace-description">
          {workspace.description || 'No description provided for this workspace.'}
        </div>
        
        <div className="workspace-meta">
          <div className="meta-item">
            <span className="meta-label">Created</span>
            <span className="meta-value">
              <FaCalendarAlt />
              {formatDate(workspace.createdAt)}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Owner</span>
            <span className="meta-value">
              <FaUserAlt />
              {workspace.owner?.username || user?.username || 'Unknown'}
            </span>
          </div>
        </div>
        
        <div>
          <div className="section-header">
            <h2>Resources</h2>
            <div className="section-header-actions">
              <button className="btn btn-primary" onClick={handleAddResource}>
                <FaPlus /> Add Resource
              </button>
            </div>
          </div>
          
          {resources.length > 0 ? (
            <div className="resources-list">
              {resources.map((resource) => (
                <div key={resource._id} className="resource-card">
                  <div className="resource-header">
                    <div className="resource-icon">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div>
                      <h3 className="resource-title">{resource.title}</h3>
                      <p className="resource-type">{resource.type}</p>
                    </div>
                  </div>
                  <div className="resource-actions">
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={() => handleViewResource(resource._id)}
                    >
                      View
                    </button>
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => handleDeleteResource(resource._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-resources">
              <p>No resources have been added to this workspace yet.</p>
              <button className="btn btn-primary" onClick={handleAddResource}>
                <FaPlus /> Add First Resource
              </button>
            </div>
          )}
        </div>
      </div>
      
      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Delete Workspace"
          message={`Are you sure you want to delete the workspace "${workspace.name}"? This action cannot be undone and will delete all resources within this workspace.`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
};

export default WorkspaceDetail; 