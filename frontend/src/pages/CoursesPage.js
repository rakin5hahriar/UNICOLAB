import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../api/courseApi';
import './CoursesPage.css';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await getCourses();
        setCourses(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.code && course.code.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filter === 'all' || filter === 'active'; // Add more filter conditions as needed
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="courses-page">
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="courses-page">
        <div className="error-container">
          <div className="error-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-secondary"
          >
            <i className="fas fa-redo"></i> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-page">
      <div className="courses-header">
        <h1>Your Courses</h1>
        <p>Manage and explore your university courses all in one place</p>
      </div>

      <div className="courses-container">
        <div className="courses-actions">
          <div className="search-filter-group">
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-dropdown">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Courses</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <Link to="/courses/new" className="add-course-btn">
            <i className="fas fa-plus"></i>
            Add Course
          </Link>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-book-open"></i>
            <h3>No courses found</h3>
            <p>
              {searchTerm
                ? "No courses match your search criteria. Try adjusting your search terms."
                : "You haven't added any courses yet. Click the 'Add Course' button to get started."}
            </p>
            <Link to="/courses/new" className="add-course-btn">
              <i className="fas fa-plus"></i>
              Add Your First Course
            </Link>
          </div>
        ) : (
          <div className="courses-grid">
            {filteredCourses.map(course => (
              <div key={course._id} className="course-card">
                <div className="course-card-header">
                  <div className="course-icon">
                    <i className="fas fa-graduation-cap"></i>
                  </div>
                  <div className="course-info">
                    <h3>{course.title}</h3>
                    <div className="course-meta">
                      {course.code && (
                        <span>
                          <i className="fas fa-hashtag"></i>
                          {course.code}
                        </span>
                      )}
                      {course.instructor && (
                        <span>
                          <i className="fas fa-user"></i>
                          {course.instructor}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="course-content">
                  {course.description && (
                    <p className="course-description">{course.description}</p>
                  )}
                  <div className="course-actions">
                    <Link to={`/courses/${course._id}`} className="course-btn view-course-btn">
                      <i className="fas fa-eye"></i>
                      View Course
                    </Link>
                    <Link to={`/courses/edit/${course._id}`} className="course-btn edit-course-btn">
                      <i className="fas fa-edit"></i>
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesPage; 