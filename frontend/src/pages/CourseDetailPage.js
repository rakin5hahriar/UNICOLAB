import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CourseDetailPage.css';

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/courses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCourse(response.data);
    } catch (err) {
      console.error('Error fetching course:', err);
      setError('Failed to load course details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/courses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      navigate('/courses');
    } catch (err) {
      console.error('Error deleting course:', err);
      setError('Failed to delete course. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <div className="course-detail-loading">Loading course details...</div>;
  }

  if (error) {
    return (
      <div className="course-detail-error">
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/courses" className="back-button">Back to Courses</Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-not-found">
        <h2>Course Not Found</h2>
        <p>The course you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link to="/courses" className="back-button">Back to Courses</Link>
      </div>
    );
  }

  return (
    <div className="course-detail-page">
      <div className="course-detail-header">
        <div className="course-header-left">
          <Link to="/courses" className="back-link">
            &larr; Back to Courses
          </Link>
          <h1 className="course-title">{course.title}</h1>
          <div className="course-meta">
            {course.code && <span className="course-code">{course.code}</span>}
            {course.semester && (
              <span className="course-semester">
                {course.semester} {course.year && course.year}
              </span>
            )}
          </div>
        </div>
        <div className="course-header-actions">
          <Link to={`/courses/edit/${id}`} className="edit-course-button">
            Edit Course
          </Link>
          <button 
            className="delete-course-button"
            onClick={() => setDeleteConfirm(true)}
          >
            Delete Course
          </button>
        </div>
      </div>
      
      <div className="course-detail-content">
        <div className="course-main-info">
          <div className="course-section">
            <h2>Course Information</h2>
            <div className="course-info-grid">
              <div className="info-item">
                <h3>Instructor</h3>
                <p>{course.instructor || 'Not specified'}</p>
              </div>
              <div className="info-item">
                <h3>Code</h3>
                <p>{course.code || 'Not specified'}</p>
              </div>
              <div className="info-item">
                <h3>Semester</h3>
                <p>{course.semester || 'Not specified'}</p>
              </div>
              <div className="info-item">
                <h3>Year</h3>
                <p>{course.year || 'Not specified'}</p>
              </div>
              <div className="info-item">
                <h3>Created</h3>
                <p>{course.createdAt ? formatDate(course.createdAt) : 'Unknown'}</p>
              </div>
              <div className="info-item">
                <h3>Last Updated</h3>
                <p>{course.updatedAt ? formatDate(course.updatedAt) : 'Unknown'}</p>
              </div>
            </div>
          </div>
          
          <div className="course-section">
            <h2>Description</h2>
            <div className="course-description">
              {course.description ? (
                <p>{course.description}</p>
              ) : (
                <p className="no-description">No description available.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="course-sidebar">
          <div className="course-actions">
            <h2>Course Actions</h2>
            <div className="action-buttons">
              <Link to={`/courses/${id}/workspaces`} className="action-button">
                View Workspaces
              </Link>
              <Link to={`/courses/${id}/documents`} className="action-button">
                View Documents
              </Link>
              <Link to={`/courses/${id}/assignments`} className="action-button">
                View Assignments
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {deleteConfirm && (
        <div className="delete-confirmation-modal">
          <div className="delete-confirmation-content">
            <h2>Delete Course</h2>
            <p>Are you sure you want to delete this course? This action cannot be undone.</p>
            <div className="delete-confirmation-actions">
              <button 
                className="cancel-delete-button"
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-button"
                onClick={handleDelete}
              >
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetailPage; 