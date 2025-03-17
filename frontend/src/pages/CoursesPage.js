import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './CoursesPage.css';
import CourseCreateForm from '../components/courses/CourseCreateForm';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/courses', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCourses(response.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again later.');
      
      // Fallback to empty array
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseCreated = (newCourse) => {
    setCourses(prev => [newCourse, ...prev]);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="courses-page">
      <div className="courses-header">
        <h1>My Courses</h1>
        <button 
          className="create-course-button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Create New Course'}
        </button>
      </div>

      {showForm && (
        <CourseCreateForm 
          onSuccess={handleCourseCreated} 
          onCancel={() => setShowForm(false)} 
        />
      )}

      {loading ? (
        <div className="courses-loading">Loading courses...</div>
      ) : error ? (
        <div className="courses-error">{error}</div>
      ) : courses.length === 0 ? (
        <div className="no-courses">
          <p>You don't have any courses yet.</p>
          <button 
            className="create-course-button"
            onClick={() => setShowForm(true)}
          >
            Create Your First Course
          </button>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map(course => (
            <div key={course._id} className="course-card">
              <div className="course-card-header">
                <span className="course-code">{course.code || 'No Code'}</span>
                <span className="course-semester">
                  {course.semester ? `${course.semester} ${course.year || ''}` : 'No Semester'}
                </span>
              </div>
              <h3 className="course-title">
                <Link to={`/courses/${course._id}`}>{course.title}</Link>
              </h3>
              <p className="course-instructor">{course.instructor || 'No instructor assigned'}</p>
              <p className="course-description">
                {course.description ? (
                  course.description.length > 100 
                    ? `${course.description.substring(0, 100)}...` 
                    : course.description
                ) : 'No description available.'}
              </p>
              <div className="course-card-footer">
                <span className="course-date">Created: {formatDate(course.createdAt)}</span>
                <Link to={`/courses/${course._id}`} className="view-course-button">
                  View Course
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPage; 