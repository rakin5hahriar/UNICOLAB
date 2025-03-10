import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deleteWorkspace, getWorkspacesByCourse } from '../../api/workspaceApi';
import { toast } from 'react-toastify';
import '../../pages/WorkspacePage.css';

const WorkspaceList = ({ courseId, onWorkspaceDeleted }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!courseId) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await getWorkspacesByCourse(courseId);
        setWorkspaces(data || []);
      } catch (err) {
        console.error('Error fetching workspaces:', err);
        setError(err.message || 'Failed to fetch workspaces');
        toast.error('Failed to fetch workspaces. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [courseId, refreshKey]);

  const handleDeleteClick = (workspace) => {
    setWorkspaceToDelete(workspace);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!workspaceToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteWorkspace(workspaceToDelete._id);
      
      setWorkspaces(prevWorkspaces => 
        prevWorkspaces.filter(w => w._id !== workspaceToDelete._id)
      );
      
      if (onWorkspaceDeleted) {
        onWorkspaceDeleted(workspaceToDelete._id);
      }
      
      toast.success('Workspace deleted successfully');
      setShowDeleteModal(false);
      setWorkspaceToDelete(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to delete workspace:', err);
      toast.error('Failed to delete workspace. Please try again.');
      setError('Failed to delete workspace. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="fas fa-circle-notch fa-spin"></i>
        </div>
        <p>Loading workspaces...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">
          <i className="fas fa-exclamation-circle"></i>
        </div>
        <h3>Error Loading Workspaces</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          <i className="fas fa-redo"></i> Try Again
        </button>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="empty-workspaces">
        <div className="empty-icon">
          <i className="fas fa-folder-open"></i>
        </div>
        <h3>No Workspaces Yet</h3>
        <p>Create your first workspace to organize your course materials.</p>
        <Link 
          to={`/courses/${courseId}/workspaces/add`} 
          className="btn-primary"
        >
          <i className="fas fa-plus"></i> Create First Workspace
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="workspaces-grid">
        {workspaces.map((workspace) => (
          <div key={workspace._id} className="workspace-card">
            <div className="workspace-header">
              <div className="workspace-icon">
                <i className="fas fa-folder"></i>
              </div>
              <h3>{workspace.name}</h3>
            </div>
            <div className="workspace-content">
              {workspace.description && (
                <p className="workspace-description">{workspace.description}</p>
              )}
              <div className="workspace-meta">
                <span>
                  <i className="fas fa-clock"></i>
                  {new Date(workspace.createdAt).toLocaleDateString()}
                </span>
                <span>
                  <i className="fas fa-file"></i>
                  {workspace.itemCount || 0} items
                </span>
              </div>
            </div>
            <div className="workspace-actions">
              <Link 
                to={`/workspaces/${workspace._id}`} 
                className="btn-view"
              >
                <i className="fas fa-folder-open"></i> View Items
              </Link>
              <Link 
                to={`/workspaces/edit/${workspace._id}`} 
                className="btn-edit"
              >
                <i className="fas fa-edit"></i> Edit
              </Link>
              <button 
                onClick={() => handleDeleteClick(workspace)}
                className="btn-delete"
                disabled={isDeleting}
              >
                <i className="fas fa-trash-alt"></i> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Workspace</h3>
            <p>Are you sure you want to delete <strong>{workspaceToDelete?.name}</strong>? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
                disabled={isDeleting}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i> Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash-alt"></i> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkspaceList; 