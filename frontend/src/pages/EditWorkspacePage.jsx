import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import EditWorkspace from '../components/workspaces/EditWorkspace';

const EditWorkspacePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  console.log('EditWorkspacePage - id from params:', id);

  if (!id) {
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

  return (
    <div className="container">
      <div className="page-header">
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => navigate(`/workspaces/${id}`)}
        >
          <FaArrowLeft /> Back to Workspace
        </button>
      </div>
      <EditWorkspace workspaceId={id} />
    </div>
  );
};

export default EditWorkspacePage; 