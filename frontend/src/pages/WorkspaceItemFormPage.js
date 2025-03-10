import React from 'react';
import { useParams } from 'react-router-dom';
import WorkspaceItemForm from '../components/workspaceItems/WorkspaceItemForm';

const WorkspaceItemFormPage = () => {
  const { workspaceId } = useParams();

  return (
    <div className="workspace-item-form-page">
      <WorkspaceItemForm workspaceId={workspaceId} />
    </div>
  );
};

export default WorkspaceItemFormPage; 