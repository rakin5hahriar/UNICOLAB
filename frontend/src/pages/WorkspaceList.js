import React from 'react';
import { useParams } from 'react-router-dom';
import WorkspaceListComponent from '../components/workspaces/WorkspaceList';

const WorkspaceListPage = () => {
  const { courseId } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Course Workspaces</h1>
      <WorkspaceListComponent courseId={courseId} />
    </div>
  );
};

export default WorkspaceListPage; 