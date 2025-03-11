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
      if (!courseId) {
        setError('Course ID is required');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const data = await getWorkspacesByCourse(courseId);
        setWorkspaces(data || []);
      } catch (err) {
        console.error('Error fetching workspaces:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch workspaces');
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
      setWorkspaces(workspaces.filter(w => w._id !== workspaceToDelete._id));
      toast.success('Workspace deleted successfully');
      if (onWorkspaceDeleted) {
        onWorkspaceDeleted();
      }
    } catch (err) {
      console.error('Error deleting workspace:', err);
      toast.error(err.response?.data?.message || 'Failed to delete workspace');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setWorkspaceToDelete(null);
    }
  };

  if (loading) {
    return <div className="loading">Loading workspaces...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button 
          onClick={() => setRefreshKey(prev => prev + 1)} 
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="empty-state">
        <p>No workspaces found for this course.</p>
        <Link to={`/courses/${courseId}/workspaces/add`} className="btn btn-primary">
          Create First Workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="workspaces-list">
      {workspaces.map((workspace) => (
        <div key={workspace._id} className="workspace-card">
          <div className="workspace-info">
            <h3>{workspace.name}</h3>
            <p>{workspace.description || 'No description available'}</p>
          </div>
          <div className="workspace-actions">
            <Link 
              to={`/workspaces/${workspace._id}`} 
              className="btn btn-primary"
            >
              View Workspace
            </Link>
            <button
              onClick={() => handleDeleteClick(workspace)}
              className="btn btn-danger"
              disabled={isDeleting}
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {showDeleteModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Delete Workspace</h3>
            <p>Are you sure you want to delete this workspace? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                onClick={handleDelete} 
                className="btn btn-danger" 
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="btn btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceList; 