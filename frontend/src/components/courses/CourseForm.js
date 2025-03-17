import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCourseById, createCourse, updateCourse } from '../../api/courseApi';

const CourseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAddMode = !id;

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    instructor: '',
    semester: '',
    year: new Date().getFullYear(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validation, setValidation] = useState({});

  useEffect(() => {
    if (!isAddMode) {
      const fetchCourse = async () => {
        try {
          setLoading(true);
          const course = await getCourseById(id);
          setFormData({
            title: course.title,
            code: course.code || '',
            description: course.description || '',
            instructor: course.instructor || '',
            semester: course.semester || '',
            year: course.year || new Date().getFullYear(),
          });
          setLoading(false);
        } catch (err) {
          setError(err.message || 'Failed to fetch course');
          setLoading(false);
        }
      };

      fetchCourse();
    }
  }, [id, isAddMode]);

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Course title is required';
    } else if (formData.title.trim().length > 100) {
      errors.title = 'Course title should be 100 characters or less';
    }
    
    if (formData.code && formData.code.length > 10) {
      errors.code = 'Course code should be 10 characters or less';
    }
    
    if (formData.year && (formData.year < 2000 || formData.year > 2100)) {
      errors.year = 'Year must be between 2000 and 2100';
    }
    
    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear validation error when field is edited
    if (validation[name]) {
      setValidation({
        ...validation,
        [name]: null
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Ensure all fields are properly formatted
      const courseData = {
        ...formData,
        title: formData.title.trim(),
        code: formData.code.trim(),
        description: formData.description.trim(),
        instructor: formData.instructor.trim(),
        year: formData.year ? parseInt(formData.year) : null
      };
      
      if (isAddMode) {
        await createCourse(courseData);
      } else {
        await updateCourse(id, courseData);
      }
      setLoading(false);
      navigate('/courses');
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || 'Failed to save course');
      setLoading(false);
    }
  };

  if (loading && !isAddMode) return (
    <div className="course-form-container">
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i> Loading course...
      </div>
    </div>
  );

  return (
    <div className="course-form-container">
      <h2>{isAddMode ? 'Add New Course' : 'Edit Course'}</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit} className="course-form">
        <div className="form-group">
          <label htmlFor="title" className="required">Course Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={validation.title ? 'error' : ''}
            placeholder="e.g., Introduction to Computer Science"
          />
          {validation.title && <div className="error-message">{validation.title}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="code">Course Code</label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className={validation.code ? 'error' : ''}
            placeholder="e.g., CS101"
          />
          {validation.code && <div className="error-message">{validation.code}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Brief description of the course"
          />
        </div>
        <div className="form-group">
          <label htmlFor="instructor">Instructor</label>
          <input
            type="text"
            id="instructor"
            name="instructor"
            value={formData.instructor}
            onChange={handleChange}
            placeholder="e.g., Prof. John Smith"
          />
        </div>
        <div className="course-form-row">
          <div className="form-group">
            <label htmlFor="semester">Semester</label>
            <select
              id="semester"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
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
              value={formData.year}
              onChange={handleChange}
              min="2000"
              max="2100"
              className={validation.year ? 'error' : ''}
            />
            {validation.year && <div className="error-message">{validation.year}</div>}
          </div>
        </div>
        <div className="course-form-buttons">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Saving...
              </>
            ) : (
              isAddMode ? 'Add Course' : 'Update Course'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/courses')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm; 