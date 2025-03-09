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

  if (loading) return <div className="loading">Loading courses...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="course-list">
      <div className="course-list-header">
        <h2>My Courses</h2>
        <Link to="/courses/add" className="btn btn-primary">
          Add New Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <p>You haven't added any courses yet.</p>
          <Link to="/courses/add" className="btn btn-primary">
            Add Your First Course
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
                      <strong>Instructor:</strong> {course.instructor}
                    </p>
                  )}
                  {course.semester && course.year && (
                    <p>
                      <strong>Term:</strong> {course.semester} {course.year}
                    </p>
                  )}
                </div>
              </div>
              <div className="course-card-footer">
                <Link to={`/courses/${course._id}`} className="btn btn-info">
                  View Workspaces
                </Link>
                <Link to={`/courses/edit/${course._id}`} className="btn btn-secondary">
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(course._id)}
                  className="btn btn-danger"
                >
                  Delete
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