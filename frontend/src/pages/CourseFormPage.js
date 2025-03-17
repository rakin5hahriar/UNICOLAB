import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './CourseFormPage.css';

const CourseFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [course, setCourse] = useState({
    title: '',
    code: '',
    description: '',
    instructor: '',
    semester: '',
    year: new Date().getFullYear()
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      fetchCourse();
    }
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourse(prev => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value, 10) || new Date().getFullYear() : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!course.title || !course.title.trim()) {
      setError('Course title is required');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Prepare data with proper formatting
      const courseData = {
        ...course,
        title: course.title.trim(),
        code: course.code.trim(),
        description: course.description.trim(),
        instructor: course.instructor.trim(),
        year: parseInt(course.year, 10)
      };
      
      if (isEditMode) {
        await axios.put(`/api/courses/${id}`, courseData, { headers });
        navigate(`/courses/${id}`);
      } else {
        const response = await axios.post('/api/courses', courseData, { headers });
        navigate(`/courses/${response.data._id}`);
      }
    } catch (err) {
      console.error('Error saving course:', err);
      setError(err.response?.data?.message || 'Failed to save course. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="course-form-loading">Loading course details...</div>;
  }

  return (
    <div className="course-form-page">
      <div className="course-form-header">
        <h1>{isEditMode ? 'Edit Course' : 'Create New Course'}</h1>
        <Link to={isEditMode ? `/courses/${id}` : '/courses'} className="cancel-link">
          Cancel
        </Link>
      </div>
      
      {error && <div className="course-form-error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="course-form">
        <div className="form-group">
          <label htmlFor="title">Course Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={course.title}
            onChange={handleInputChange}
            required
            placeholder="e.g. Introduction to Computer Science"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="code">Course Code</label>
            <input
              type="text"
              id="code"
              name="code"
              value={course.code}
              onChange={handleInputChange}
              placeholder="e.g. CS101"
              maxLength="10"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="semester">Semester</label>
            <select
              id="semester"
              name="semester"
              value={course.semester}
              onChange={handleInputChange}
            >
              <option value="">Select Semester</option>
              <option value="Fall">Fall</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Winter">Winter</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="year">Year</label>
            <input
              type="number"
              id="year"
              name="year"
              value={course.year}
              onChange={handleInputChange}
              min="2000"
              max="2100"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="instructor">Instructor</label>
          <input
            type="text"
            id="instructor"
            name="instructor"
            value={course.instructor}
            onChange={handleInputChange}
            placeholder="e.g. Dr. Smith"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={course.description}
            onChange={handleInputChange}
            placeholder="Enter course description..."
            rows="5"
          ></textarea>
        </div>
        
        <div className="form-actions">
          <Link to={isEditMode ? `/courses/${id}` : '/courses'} className="cancel-button">
            Cancel
          </Link>
          <button type="submit" className="submit-button" disabled={saving}>
            {saving ? 'Saving...' : isEditMode ? 'Update Course' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseFormPage; 