import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getWorkspaceById as getWorkspace, deleteWorkspace } from '../api/workspaceApi';
import { getWorkspaceItems, deleteWorkspaceItem } from '../api/workspaceApi';
import { checkApiConnection } from '../utils/apiCheck';
import './WorkspacePage.css';

const WorkspaceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemsError, setItemsError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [itemsRetryCount, setItemsRetryCount] = useState(0);

  // Fetch workspace data
  useEffect(() => {
    const fetchWorkspaceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check API connection first
        const isConnected = await checkApiConnection();
        if (!isConnected) {
          setError('Cannot connect to the server. Please check your connection and try again.');
          return;
        }
        
        // Fetch workspace data
        const workspaceData = await getWorkspace(id);
        if (!workspaceData) {
          setError('Workspace not found or has been deleted.');
          return;
        }
        
        setWorkspace(workspaceData);
      } catch (err) {
        console.error('Error fetching workspace data:', err);
        if (err.message && typeof err.message === 'string') {
          setError(`Failed to load workspace: ${err.message}`);
        } else {
          setError('Failed to load workspace. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceData();
  }, [id, retryCount]);

  // Fetch workspace items separately
  useEffect(() => {
    const fetchWorkspaceItems = async () => {
      if (!workspace) return;
      
      try {
        setItemsLoading(true);
        setItemsError(null);
        
        // Fetch workspace items
        const itemsData = await getWorkspaceItems(id);
        setItems(itemsData || []);
      } catch (err) {
        console.error('Error fetching workspace items:', err);
        setItemsError('Failed to load workspace items. You can still view and edit workspace details.');
      } finally {
        setItemsLoading(false);
      }
    };

    fetchWorkspaceItems();
  }, [id, workspace, itemsRetryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleRetryItems = () => {
    setItemsRetryCount(prev => prev + 1);
  };

  const handleDeleteWorkspace = async () => {
    try {
      setLoading(true);
      await deleteWorkspace(id);
      toast.success('Workspace deleted successfully');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting workspace:', err);
      toast.error('Failed to delete workspace. Please try again later.');
      setError('Failed to delete workspace. Please try again later.');
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      setItemsLoading(true);
      await deleteWorkspaceItem(itemId);
      setItems(items.filter(item => item._id !== itemId));
      toast.success('Item deleted successfully');
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error('Failed to delete item. Please try again later.');
      setItemsError('Failed to delete item. Please try again later.');
    } finally {
      setItemsLoading(false);
    }
  };

  const confirmDeleteItem = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="workspace-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workspace-page">
        <div className="error-container">
          <div className="error-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <h3>Error Loading Workspace</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={handleRetry} className="workspace-btn view-workspace-btn">
              <i className="fas fa-sync-alt"></i> Retry
            </button>
            <button onClick={() => navigate('/dashboard')} className="workspace-btn edit-workspace-btn">
              <i className="fas fa-arrow-left"></i> Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="workspace-page">
        <div className="error-container">
          <div className="error-icon">
            <i className="fas fa-folder-open"></i>
          </div>
          <h3>Workspace Not Found</h3>
          <p>The workspace you're looking for doesn't exist or has been deleted.</p>
          <div className="error-actions">
            <button onClick={() => navigate('/dashboard')} className="workspace-btn view-workspace-btn">
              <i className="fas fa-arrow-left"></i> Back to Dashboard
            </button>
            <button onClick={() => navigate('/workspaces/new')} className="workspace-btn edit-workspace-btn">
              <i className="fas fa-plus"></i> Create New Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-page">
      <div className="workspace-detail">
        <div className="workspace-detail-header">
          <div className="workspace-detail-info">
            <h1>
              <i className={`fas fa-${workspace.icon || 'folder'}`}></i>
              {workspace.name}
            </h1>
            {workspace.description && <p>{workspace.description}</p>}
            <div className="workspace-meta">
              <span>
                <i className="fas fa-graduation-cap"></i>
                {workspace.course?.name || 'Unknown Course'}
              </span>
              <span>
                <i className="fas fa-calendar-alt"></i>
                Created: {new Date(workspace.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="workspace-detail-actions">
            <Link to={`/workspace-items/new/${workspace._id}`} className="workspace-btn view-workspace-btn">
              <i className="fas fa-plus"></i> Add Item
            </Link>
            <Link to={`/workspaces/edit/${workspace._id}`} className="workspace-btn edit-workspace-btn">
              <i className="fas fa-edit"></i> Edit
            </Link>
            <button onClick={() => setShowDeleteModal(true)} className="workspace-btn delete-workspace-btn">
              <i className="fas fa-trash-alt"></i> Delete
            </button>
          </div>
        </div>

        <div className="workspace-items">
          <div className="workspace-items-header">
            <h2>Workspace Items</h2>
            {itemsError && (
              <div className="items-error-banner">
                <i className="fas fa-exclamation-triangle"></i>
                <span>{itemsError}</span>
                <button onClick={handleRetryItems} className="retry-btn">
                  <i className="fas fa-sync-alt"></i> Retry
                </button>
              </div>
            )}
          </div>
          
          {itemsLoading ? (
            <div className="items-loading">
              <div className="loading-spinner"></div>
              <p>Loading items...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-box-open"></i>
              <h3>No Items Yet</h3>
              <p>This workspace doesn't have any items yet. Add your first item to get started.</p>
              <Link to={`/workspace-items/new/${workspace._id}`} className="workspace-btn view-workspace-btn">
                <i className="fas fa-plus"></i> Add Your First Item
              </Link>
            </div>
          ) : (
            <div className="workspace-items-grid">
              {items.map((item) => (
                <div key={item._id} className={`workspace-item-card item-type-${item.type || 'default'}`}>
                  <div className="workspace-item-header">
                    <h3>{item.title}</h3>
                    <div className="item-type">{item.type}</div>
                  </div>
                  <div className="workspace-item-content">
                    {item.type === 'note' && <p>{item.content?.substring(0, 100)}...</p>}
                    {item.type === 'assignment' && (
                      <div className="assignment-info">
                        <div className="assignment-status">
                          <span className={`status-badge status-${item.status || 'not-started'}`}>
                            {item.status === 'not-started' ? 'Not Started' : 
                             item.status === 'in-progress' ? 'In Progress' : 'Completed'}
                          </span>
                          {item.priority && (
                            <span className={`priority-badge priority-${item.priority}`}>
                              {item.priority}
                            </span>
                          )}
                        </div>
                        {item.dueDate && (
                          <div className="due-date">
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}
                    {item.type === 'file' && (
                      <div className="file-info">
                        <i className="fas fa-file"></i>
                        <span>{item.fileName || 'Unnamed file'}</span>
                      </div>
                    )}
                  </div>
                  <div className="workspace-item-actions">
                    <Link to={`/workspace-items/${item._id}`} className="btn-view">
                      <i className="fas fa-eye"></i>
                    </Link>
                    <Link to={`/workspace-items/edit/${item._id}`} className="btn-edit">
                      <i className="fas fa-edit"></i>
                    </Link>
                    <button onClick={() => confirmDeleteItem(item)} className="btn-delete">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Workspace Modal */}
      {showDeleteModal && !itemToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Workspace</h3>
            <p>Are you sure you want to delete <strong>{workspace.name}</strong>?</p>
            <p>This action cannot be undone and all items in this workspace will be permanently deleted.</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleDeleteWorkspace} className="btn-danger">
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Item</h3>
            <p>Are you sure you want to delete <strong>{itemToDelete.title}</strong>?</p>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={() => handleDeleteItem(itemToDelete._id)} className="btn-danger">
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDetail; 