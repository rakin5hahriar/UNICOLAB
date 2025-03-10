import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getCourseById, deleteCourse } from '../../api/courseApi';
import WorkspaceList from '../workspaces/WorkspaceList';
import { toast } from 'react-toastify';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the course
        const courseData = await getCourseById(id);
        if (!courseData) {
          throw new Error('Course not found');
        }
        setCourse(courseData);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(err.message || 'Failed to load course details');
        toast.error('Failed to load course details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourseData();
    }
  }, [id, refreshKey]);

  const handleDelete = async () => {
    try {
      setError(null);
      await deleteCourse(id);
      toast.success('Course deleted successfully');
      navigate('/courses');
    } catch (err) {
      console.error('Error deleting course:', err);
      setError(err.message);
      toast.error('Failed to delete course. Please try again.');
      setShowDeleteConfirm(false);
    }
  };

  const handleWorkspaceDeleted = () => {
    setRefreshKey(prev => prev + 1); // Force refresh when a workspace is deleted
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading course details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">
          <i className="fas fa-exclamation-circle"></i>
        </div>
        <h3>Error Loading Course</h3>
        <p>{error}</p>
        <button onClick={() => setRefreshKey(prev => prev + 1)} className="btn-primary">
          <i className="fas fa-sync-alt"></i> Try Again
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="error-container">
        <div className="error-icon">
          <i className="fas fa-folder-open"></i>
        </div>
        <h3>Course Not Found</h3>
        <p>The course you're looking for doesn't exist or has been deleted.</p>
        <Link to="/courses" className="btn-primary">
          <i className="fas fa-arrow-left"></i> Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="course-detail">
      <div className="course-header">
        <h1>{course.name}</h1>
        <div className="course-actions">
          <Link to={`/courses/edit/${course._id}`} className="btn-edit">
            <i className="fas fa-edit"></i> Edit Course
          </Link>
          <button onClick={() => setShowDeleteConfirm(true)} className="btn-delete">
            <i className="fas fa-trash-alt"></i> Delete Course
          </button>
        </div>
      </div>

      <div className="course-content">
        <div className="course-info-card">
          <div className="card-header">
            <h2><i className="fas fa-info-circle"></i> Course Information</h2>
          </div>
          <div className="card-body">
            {course.description ? (
              <div className="course-description">
                <h3><i className="fas fa-align-left"></i> Description</h3>
                <p>{course.description}</p>
              </div>
            ) : (
              <div className="no-description">
                <p><i className="fas fa-exclamation-circle"></i> No description available</p>
              </div>
            )}
            
            <div className="course-meta-info">
              {course.instructor && (
                <div className="meta-item">
                  <i className="fas fa-user-tie"></i>
                  <span>Instructor: {course.instructor}</span>
                </div>
              )}
              
              {course.semester && course.year && (
                <div className="meta-item">
                  <i className="fas fa-calendar-alt"></i>
                  <span>Term: {course.semester} {course.year}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="workspaces-section">
          <div className="section-header">
            <h2><i className="fas fa-folder"></i> Workspaces</h2>
            <Link to={`/courses/${course._id}/workspaces/add`} className="btn-add">
              <i className="fas fa-plus"></i> Add Workspace
            </Link>
          </div>
          
          <WorkspaceList 
            courseId={course._id} 
            onWorkspaceDeleted={handleWorkspaceDeleted}
          />
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Course</h3>
            <p>Are you sure you want to delete <strong>{course.name}</strong>?</p>
            <p>This action cannot be undone and all workspaces and items in this course will be permanently deleted.</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn-danger">
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail; 