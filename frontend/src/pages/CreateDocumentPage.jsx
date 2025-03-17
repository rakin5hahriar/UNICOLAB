import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import DocumentForm from '../components/documents/DocumentForm';
import './CreateDocumentPage.css';

const CreateDocumentPage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    if (workspaceId) {
      navigate(`/workspaces/${workspaceId}`);
    } else {
      navigate('/documents');
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={handleBack}
        >
          <FaArrowLeft /> Back
        </button>
      </div>
      
      <div className="create-document-container">
        <DocumentForm workspaceId={workspaceId} isEditing={false} />
      </div>
    </div>
  );
};

export default CreateDocumentPage; 