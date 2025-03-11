import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import WorkspaceList from '../components/workspaces/WorkspaceList';

const WorkspacesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Workspaces</h1>
        <div className="page-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/workspaces/new')}
          >
            <FaPlus /> Create Workspace
          </button>
        </div>
      </div>
      <p className="page-description">
        Workspaces help you organize your learning resources and materials for different topics or projects.
      </p>
      <WorkspaceList />
    </div>
  );
};

export default WorkspacesPage; 