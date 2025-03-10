import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, deleteCourse } from '../../api/courseApi';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await getCourses();
        setCourses(data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch courses');
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course? This will also delete all workspaces and items associated with this course.')) {
      try {
        await deleteCourse(id);
        setCourses(courses.filter(course => course._id !== id));
      } catch (err) {
        setError(err.message || 'Failed to delete course');
      }
    }
  };

  if (loading) return (
    <div className="loading">
      <i className="fas fa-spinner fa-spin"></i> Loading courses...
    </div>
  );
  
  if (error) return (
    <div className="error">
      <i className="fas fa-exclamation-circle"></i> {error}
    </div>
  );

  return (
    <div className="course-list">
      <div className="course-list-header">
        <h2>
          My Courses
          {courses.length > 0 && (
            <span className="course-count">{courses.length}</span>
          )}
        </h2>
        <Link to="/courses/add" className="btn-primary">
          <i className="fas fa-plus"></i> Add New Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-book-open fa-3x" style={{ color: '#3498db', marginBottom: '20px' }}></i>
          <p>You haven't added any courses yet.</p>
          <Link to="/courses/add" className="btn-primary">
            <i className="fas fa-plus"></i> Add Your First Course
          </Link>
        </div>
      ) : (
        <div className="course-grid">
          {courses.map((course) => (
            <div key={course._id} className="course-card">
              <div className="course-card-header">
                <h3>{course.title}</h3>
                {course.code && <span className="course-code">{course.code}</span>}
              </div>
              <div className="course-card-body">
                {course.description && <p>{course.description}</p>}
                <div className="course-details">
                  {course.instructor && (
                    <p>
                      <i className="fas fa-user-tie" style={{ marginRight: '8px', color: '#6c757d' }}></i>
                      <strong>Instructor:</strong> {course.instructor}
                    </p>
                  )}
                  {course.semester && course.year && (
                    <p>
                      <i className="fas fa-calendar-alt" style={{ marginRight: '8px', color: '#6c757d' }}></i>
                      <strong>Term:</strong> {course.semester} {course.year}
                    </p>
                  )}
                </div>
              </div>
              <div className="course-card-footer">
                <Link to={`/courses/${course._id}`} className="btn btn-info">
                  <i className="fas fa-folder-open"></i> View Workspaces
                </Link>
                <Link to={`/courses/edit/${course._id}`} className="btn btn-secondary">
                  <i className="fas fa-edit"></i> Edit
                </Link>
                <button
                  onClick={() => handleDelete(course._id)}
                  className="btn btn-danger"
                >
                  <i className="fas fa-trash-alt"></i> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList; 