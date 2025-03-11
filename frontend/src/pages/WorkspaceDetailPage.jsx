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
  FaExclamationTriangle,
  FaArrowLeft,
  FaComment 
} from 'react-icons/fa';
import axios from 'axios';
import config from '../config/config';
import { useAuth } from '../context/AuthContext';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import CommentSection from '../components/CommentSection';
import '../components/workspaces/WorkspaceDetail.css';

const WorkspaceDetailPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  
  // Get the ID from the URL parameters
  const { id } = params;
  
  // Extract ID from URL path as a fallback
  const getIdFromPath = () => {
    const pathParts = location.pathname.split('/');
    return pathParts[pathParts.length - 1];
  };
  
  // Use the ID from params or from the path
  const workspaceId = id || getIdFromPath();
  
  console.log('WorkspaceDetailPage - workspaceId:', workspaceId);
  
  const [workspace, setWorkspace] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { user } = useAuth();

  const fetchWorkspaceData = useCallback(async () => {
    if (!workspaceId) {
      setError('Workspace ID is required');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      // Fetch workspace data
      const workspaceResponse = await axios.get(`${config.apiUrl}/workspaces/${workspaceId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setWorkspace(workspaceResponse.data);
      
      // Fetch resources for this workspace
      const resourcesResponse = await axios.get(`${config.apiUrl}/workspaces/${workspaceId}/resources`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
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
  }, [workspaceId, navigate]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  const handleEdit = () => {
    navigate(`/workspaces/${workspaceId}/edit`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${config.apiUrl}/workspaces/${workspaceId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setShowDeleteModal(false);
      navigate('/workspaces');
    } catch (err) {
      console.error('Error deleting workspace:', err);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleAddResource = () => {
    navigate(`/workspaces/${workspaceId}/resources/new`);
  };

  const handleViewResource = (resourceId) => {
    navigate(`/resources/${resourceId}`);
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${config.apiUrl}/resources/${resourceId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh the resources list
      fetchWorkspaceData();
    } catch (err) {
      console.error('Error deleting resource:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getResourceIcon = (resourceType) => {
    switch (resourceType) {
      case 'document':
        return <FaFile />;
      case 'link':
        return <FaLink />;
      case 'code':
        return <FaCode />;
      default:
        return <FaFile />;
    }
  };

  // Show error if no workspace ID
  if (!workspaceId) {
    return (
      <div className="container">
        <div className="error-container">
          <div className="error-icon">!</div>
          <h2>Error</h2>
          <p>Workspace ID is required</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show loading spinner
  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Loading workspace data...</p>
        </div>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="container">
        <div className="error-container">
          <div className="error-icon"><FaExclamationTriangle /></div>
          <h2>Error</h2>
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show error if workspace not found
  if (!workspace) {
    return (
      <div className="container">
        <div className="error-container">
          <div className="error-icon"><FaExclamationTriangle /></div>
          <h2>Error</h2>
          <p>Workspace not found</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/workspaces')}
          >
            Return to Workspaces
          </button>
        </div>
      </div>
    );
  }

  // Render workspace details
  return (
    <div className="container">
      <div className="page-header">
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => navigate('/workspaces')}
        >
          <FaArrowLeft /> Back to Workspaces
        </button>
      </div>
      
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
          
          <div className="workspace-resources">
            <div className="resources-header">
              <h2>Resources</h2>
              <button className="btn btn-primary btn-sm" onClick={handleAddResource}>
                <FaPlus /> Add Resource
              </button>
            </div>
            
            {resources.length === 0 ? (
              <div className="no-resources">
                <p>No resources found in this workspace.</p>
                <button className="btn btn-primary" onClick={handleAddResource}>
                  <FaPlus /> Add Your First Resource
                </button>
              </div>
            ) : (
              <div className="resources-list">
                {resources.map(resource => (
                  <div key={resource._id} className="resource-item">
                    <div className="resource-icon">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div className="resource-info" onClick={() => handleViewResource(resource._id)}>
                      <h3>{resource.name}</h3>
                      <p>{resource.description || 'No description'}</p>
                    </div>
                    <div className="resource-actions">
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDeleteResource(resource._id)}
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Add Comment Section */}
          <div className="workspace-comments mt-6">
            <div className="comments-header">
              <h2><FaComment className="inline mr-2" /> Comments</h2>
            </div>
            <CommentSection 
              workspaceId={workspaceId} 
              userId={user?.id} 
              username={user?.username} 
            />
          </div>
        </div>
      </div>
      
      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Delete Workspace"
          message="Are you sure you want to delete this workspace? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
};

export default WorkspaceDetailPage; 