import React from 'react';
import { Link } from 'react-router-dom';
import { deleteWorkspace } from '../../api/workspaceApi';

const WorkspaceList = ({ workspaces, courseId, onWorkspaceDeleted }) => {
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this workspace? This will also delete all items in this workspace.')) {
      try {
        await deleteWorkspace(id);
        if (onWorkspaceDeleted) {
          onWorkspaceDeleted(id);
        } else {
          // If no callback is provided, reload the page
          window.location.reload();
        }
      } catch (err) {
        console.error('Failed to delete workspace:', err);
        alert('Failed to delete workspace. Please try again.');
      }
    }
  };

  if (workspaces.length === 0) {
    return (
      <div className="empty-state">
        <p>No workspaces found for this course.</p>
        <Link to={`/courses/${courseId}/workspaces/add`} className="btn btn-primary">
          Create Your First Workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="workspace-list">
      <div className="workspace-grid">
        {workspaces.map((workspace) => (
          <div
            key={workspace._id}
            className="workspace-card"
            style={{ borderColor: workspace.color }}
          >
            <div
              className="workspace-card-header"
              style={{ backgroundColor: workspace.color }}
            >
              <div className="workspace-icon">
                <i className={`fas fa-${workspace.icon}`}></i>
              </div>
              <h3>{workspace.name}</h3>
            </div>
            <div className="workspace-card-body">
              {workspace.description && <p>{workspace.description}</p>}
            </div>
            <div className="workspace-card-footer">
              <Link
                to={`/workspaces/${workspace._id}`}
                className="btn btn-info"
              >
                Open Workspace
              </Link>
              <Link
                to={`/workspaces/edit/${workspace._id}`}
                className="btn btn-secondary"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(workspace._id)}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkspaceList; 