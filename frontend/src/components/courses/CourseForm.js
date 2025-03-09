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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isAddMode) {
        await createCourse(formData);
      } else {
        await updateCourse(id, formData);
      }
      setLoading(false);
      navigate('/courses');
    } catch (err) {
      setError(err.message || 'Failed to save course');
      setLoading(false);
    }
  };

  if (loading && !isAddMode) return <div className="loading">Loading course...</div>;

  return (
    <div className="course-form">
      <h2>{isAddMode ? 'Add New Course' : 'Edit Course'}</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Course Title*</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g., Introduction to Computer Science"
          />
        </div>
        <div className="form-group">
          <label htmlFor="code">Course Code</label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g., CS101"
          />
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
        <div className="form-row">
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
            />
          </div>
        </div>
        <div className="form-buttons">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isAddMode ? 'Add Course' : 'Update Course'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/courses')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm; 