import React from 'react';
import { Link, useParams } from 'react-router-dom';
import WorkspaceForm from '../components/workspaces/WorkspaceForm';

const WorkspaceFormPage = () => {
  const { id, courseId } = useParams();
  const isAddMode = !id;

  return (
    <div className="workspace-form-page">
      <div className="page-breadcrumb">
        <Link to="/dashboard">
          <i className="fas fa-home"></i> Dashboard
        </Link>
        {courseId && (
          <>
            <span className="breadcrumb-separator">/</span>
            <Link to={`/courses/${courseId}`}>
              <i className="fas fa-graduation-cap"></i> Course
            </Link>
          </>
        )}
        <span className="breadcrumb-separator">/</span>
        <span className="current-page">
          <i className={`fas fa-${isAddMode ? 'plus-circle' : 'edit'}`}></i>
          {isAddMode ? 'New Workspace' : 'Edit Workspace'}
        </span>
      </div>
      
      <WorkspaceForm courseId={courseId} />
    </div>
  );
};

export default WorkspaceFormPage; 