import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getWorkspaceById, deleteWorkspace, getWorkspaceItems } from '../../api/workspaceApi';
import WorkspaceItemList from '../workspaceItems/WorkspaceItemList';
import WorkspaceItemForm from '../workspaceItems/WorkspaceItemForm';
import { useCollaboration } from '../../contexts/CollaborationContext';
import CollaborationOverlay from '../CollaborationOverlay';
import ActiveUsers from '../ActiveUsers';
import CommentSection from '../CommentSection';
import '../../pages/WorkspacePage.css';

// Global variable to track which workspaces have been joined
// This prevents multiple join attempts across component remounts
const joinedWorkspaces = new Set();

const WorkspaceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { joinWorkspace, leaveWorkspace, enterOfflineMode } = useCollaboration();
  const hasJoinedRef = useRef(false);
  const joinAttemptTimeoutRef = useRef(null);
  const fetchedRef = useRef(false);

  // Single useEffect for fetching data and joining workspace
  useEffect(() => {
    // Only fetch data once
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      
      const fetchWorkspaceAndItems = async () => {
        try {
          setLoading(true);
          const workspaceData = await getWorkspaceById(id);
          setWorkspace(workspaceData);

          const itemsData = await getWorkspaceItems(id);
          setItems(itemsData);
          setLoading(false);
        } catch (err) {
          setError(err.message || 'Failed to fetch workspace details');
          setLoading(false);
          
          // Enter offline mode on error
          if (typeof enterOfflineMode === 'function') {
            enterOfflineMode();
          }
        }
      };
      
      fetchWorkspaceAndItems();
    }
    
    // Return cleanup function
    return () => {};
  }, [id, enterOfflineMode]);
  
  // Separate useEffect for joining workspace - runs only once
  useEffect(() => {
    // Only join if we haven't already joined this workspace
    if (!hasJoinedRef.current && !joinedWorkspaces.has(id)) {
      console.log(`Attempting to join workspace ${id} for the first time`);
      hasJoinedRef.current = true;
      joinedWorkspaces.add(id);
      
      // Clear any existing timeout
      if (joinAttemptTimeoutRef.current) {
        clearTimeout(joinAttemptTimeoutRef.current);
      }
      
      // Join the workspace after a short delay
      joinAttemptTimeoutRef.current = setTimeout(() => {
        try {
          const user = JSON.parse(localStorage.getItem('user'));
          if (user) {
            // Use a more unique ID to prevent duplicate notifications
            const uniqueId = `${user._id || user.id}-${Date.now()}`;
            console.log(`Joining workspace with ID: ${uniqueId}`);
            
            // Try to join the workspace
            const joinSuccess = joinWorkspace(id, uniqueId, user.name);
            
            // If joining fails, enter offline mode
            if (!joinSuccess) {
              console.log('Failed to join workspace, entering offline mode');
              if (typeof enterOfflineMode === 'function') {
                enterOfflineMode();
              }
            }
          } else {
            // No user found, enter offline mode
            console.log('No user found, entering offline mode');
            if (typeof enterOfflineMode === 'function') {
              enterOfflineMode();
            }
          }
        } catch (error) {
          console.error('Error joining workspace:', error);
          if (typeof enterOfflineMode === 'function') {
            enterOfflineMode();
          }
        }
      }, 500);
    }
    
    // Cleanup function to leave workspace
    return () => {
      // Clear any pending timeout
      if (joinAttemptTimeoutRef.current) {
        clearTimeout(joinAttemptTimeoutRef.current);
        joinAttemptTimeoutRef.current = null;
      }
      
      // Only leave if we've joined
      if (hasJoinedRef.current) {
        console.log(`Leaving workspace ${id}`);
        leaveWorkspace(id);
        hasJoinedRef.current = false;
        joinedWorkspaces.delete(id);
      }
    };
  }, [id, joinWorkspace, leaveWorkspace, enterOfflineMode]);

  const handleDelete = async () => {
    try {
      await deleteWorkspace(id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to delete workspace');
    }
  };

  if (loading) {
    return (
      <div className="workspace-page">
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workspace-page">
        <div className="empty-state">
          <i className="fas fa-exclamation-circle"></i>
          <h3>Error</h3>
          <p>{error}</p>
          <Link to="/dashboard" className="workspace-btn view-workspace-btn">
            <i className="fas fa-arrow-left"></i>
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="workspace-page">
        <div className="empty-state">
          <i className="fas fa-folder-open"></i>
          <h3>Workspace Not Found</h3>
          <p>The workspace you're looking for doesn't exist or has been deleted.</p>
          <Link to="/dashboard" className="workspace-btn view-workspace-btn">
            <i className="fas fa-arrow-left"></i>
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-page">
      <div className="workspace-detail">
        <div className="workspace-detail-header">
          <div className="workspace-detail-info">
            <h1>{workspace.name}</h1>
            <p>{workspace.description}</p>
          </div>
          <div className="workspace-detail-actions">
            <Link
              to={`/workspace-items/new/${workspace._id}`}
              className="workspace-btn view-workspace-btn"
            >
              <i className="fas fa-plus"></i>
              Add Item
            </Link>
            <Link
              to={`/workspaces/edit/${workspace._id}`}
              className="workspace-btn edit-workspace-btn"
            >
              <i className="fas fa-edit"></i>
              Edit Workspace
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="workspace-btn delete-workspace-btn"
            >
              <i className="fas fa-trash-alt"></i>
              Delete Workspace
            </button>
          </div>
        </div>

        <div className="workspace-collaboration">
          <ActiveUsers />
          <CollaborationOverlay workspaceId={id} />
          <CommentSection 
            workspaceId={id} 
            userId={JSON.parse(localStorage.getItem('user'))?._id} 
            username={JSON.parse(localStorage.getItem('user'))?.name} 
          />
        </div>

        <div className="workspace-items-header">
          <h2>Workspace Items</h2>
        </div>
        {items.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-box-open"></i>
            <h3>No Items Yet</h3>
            <p>Start adding items to your workspace to get started.</p>
            <Link
              to={`/workspace-items/new/${workspace._id}`}
              className="workspace-btn view-workspace-btn"
            >
              <i className="fas fa-plus"></i>
              Add Your First Item
            </Link>
          </div>
        ) : (
          <div className="workspace-items-grid">
            <WorkspaceItemList
              items={items}
              onItemDeleted={(itemId) => setItems(items.filter(item => item._id !== itemId))}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Workspace</h3>
            <p>Are you sure you want to delete this workspace? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="workspace-btn edit-workspace-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="workspace-btn delete-workspace-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDetail; 