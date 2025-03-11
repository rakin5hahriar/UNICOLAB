import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import CreateWorkspace from '../components/workspaces/CreateWorkspace';

const CreateWorkspacePage = () => {
  const navigate = useNavigate();

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
      <CreateWorkspace />
    </div>
  );
};

export default CreateWorkspacePage; 