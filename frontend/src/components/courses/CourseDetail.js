import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getCourseById, deleteCourse } from '../../api/courseApi';
import WorkspaceList from '../workspaces/WorkspaceList';
import { toast } from 'react-toastify';
import './CourseDetail.css';

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
    }
  };

  if (loading) {
    return <div className="loading">
      <i className="fas fa-circle-notch fa-spin fa-2x"></i>
      <p>Loading course details...</p>
    </div>;
  }

  if (error) {
    return <div className="error">
      <i className="fas fa-exclamation-circle fa-2x"></i>
      <p>Error: {error}</p>
      <button 
        onClick={() => setRefreshKey(prev => prev + 1)}
        className="btn btn-primary"
      >
        Try Again
      </button>
    </div>;
  }

  if (!course) {
    return <div className="error">
      <i className="fas fa-folder-open fa-2x"></i>
      <p>Course not found</p>
      <Link to="/courses" className="btn btn-primary">
        Back to Courses
      </Link>
    </div>;
  }

  return (
    <div className="course-detail">
      <div className="course-header">
        <h2>{course.title}</h2>
        <div className="course-actions">
          <Link to={`/courses/edit/${id}`} className="btn btn-primary">
            <i className="fas fa-edit"></i> Edit Course
          </Link>
          <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-danger">
            <i className="fas fa-trash"></i> Delete Course
          </button>
        </div>
      </div>

      <div className="course-info">
        <div className="course-info-grid">
          <div className="info-item">
            <span className="info-label">Course Code</span>
            <span className="info-value">{course.code || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Instructor</span>
            <span className="info-value">{course.instructor || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Semester</span>
            <span className="info-value">{course.semester || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Year</span>
            <span className="info-value">{course.year || 'N/A'}</span>
          </div>
        </div>
        
        <div className="description-section">
          <div className="description-label">Description</div>
          {course.description ? (
            <div className="description-content">
              {course.description}
            </div>
          ) : (
            <div className="description-content no-description">
              No description available
            </div>
          )}
        </div>
      </div>

      <div className="workspaces-section">
        <div className="section-header">
          <h3>Workspaces</h3>
          <Link to={`/courses/${id}/workspaces/add`} className="btn btn-primary">
            <i className="fas fa-plus"></i> Add Workspace
          </Link>
        </div>
        {course && <WorkspaceList courseId={id} onWorkspaceDeleted={() => setRefreshKey(prev => prev + 1)} />}
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Course</h3>
            <p>Are you sure you want to delete <strong>{course.title}</strong>? This action cannot be undone and all associated workspaces will be deleted.</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
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