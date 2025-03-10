import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createWorkspace, getWorkspaceById, updateWorkspace } from '../../api/workspaceApi';
import { getCourses, createCourse } from '../../api/courseApi';
import '../../pages/WorkspacePage.css';

const WorkspaceForm = ({ courseId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    course: courseId || '',
    icon: 'folder',
    color: '#3498db'
  });
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreatingNewCourse, setIsCreatingNewCourse] = useState(false);
  const [newCourseData, setNewCourseData] = useState({
    title: '',
    code: '',
    description: '',
    instructor: '',
    semester: '',
    year: new Date().getFullYear()
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const coursesData = await getCourses();
        setCourses(coursesData);
      } catch (err) {
        console.error('Error fetching courses:', err);
        toast.error('Failed to load courses. Please try again later.');
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();

    if (isEditMode) {
      const fetchWorkspace = async () => {
        try {
          setLoading(true);
          const workspaceData = await getWorkspaceById(id);
          setFormData({
            name: workspaceData.name,
            description: workspaceData.description || '',
            course: workspaceData.course,
            icon: workspaceData.icon || 'folder',
            color: workspaceData.color || '#3498db'
          });
        } catch (err) {
          console.error('Error fetching workspace:', err);
          toast.error('Failed to load workspace. Please try again later.');
          setError('Failed to load workspace. Please try again later.');
          navigate('/dashboard');
        } finally {
          setLoading(false);
        }
      };

      fetchWorkspace();
    }
  }, [id, isEditMode, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // If creating a new course, create it first
      if (isCreatingNewCourse && !isEditMode) {
        if (!newCourseData.title) {
          setError('Course title is required');
          setLoading(false);
          return;
        }

        try {
          const createdCourse = await createCourse(newCourseData);
          formData.course = createdCourse._id;
          toast.success('New course created successfully');
        } catch (err) {
          console.error('Error creating course:', err);
          toast.error(err.message || 'Failed to create course. Please try again.');
          setError(err.message || 'Failed to create course. Please try again.');
          setLoading(false);
          return;
        }
      } else if (!formData.course && !isEditMode) {
        setError('Please select a course');
        setLoading(false);
        return;
      }

      if (isEditMode) {
        await updateWorkspace(id, formData);
        toast.success('Workspace updated successfully');
        navigate(`/workspaces/${id}`);
      } else {
        const newWorkspace = await createWorkspace(formData);
        toast.success('Workspace created successfully');
        if (courseId) {
          navigate(`/courses/${courseId}`);
        } else {
          navigate(`/workspaces/${newWorkspace._id}`);
        }
      }
    } catch (err) {
      console.error('Error saving workspace:', err);
      toast.error(err.message || 'Failed to save workspace. Please try again.');
      setError(err.message || 'Failed to save workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewCourseChange = (e) => {
    const { name, value } = e.target;
    setNewCourseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleCourseCreation = () => {
    setIsCreatingNewCourse(!isCreatingNewCourse);
    if (isCreatingNewCourse) {
      // Switching back to selecting existing course
      setNewCourseData({
        title: '',
        code: '',
        description: '',
        instructor: '',
        semester: '',
        year: new Date().getFullYear()
      });
    } else {
      // Switching to creating new course
      setFormData(prev => ({
        ...prev,
        course: ''
      }));
    }
  };

  if (loading && !formData.name) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="workspace-form-container">
      <h1>{isEditMode ? 'Edit Workspace' : 'Create New Workspace'}</h1>
      
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="workspace-form">
        <div className="form-group">
          <label htmlFor="name">Workspace Name*</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter workspace name"
            required
            className={error && !formData.name ? 'error' : ''}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter workspace description"
            rows="4"
          />
        </div>
        
        {!isEditMode && (
          <div className="course-selection-toggle">
            <button
              type="button"
              className={`toggle-btn ${!isCreatingNewCourse ? 'active' : ''}`}
              onClick={() => setIsCreatingNewCourse(false)}
            >
              Select Existing Course
            </button>
            <button
              type="button"
              className={`toggle-btn ${isCreatingNewCourse ? 'active' : ''}`}
              onClick={() => setIsCreatingNewCourse(true)}
            >
              Create New Course
            </button>
          </div>
        )}
        
        {!isCreatingNewCourse ? (
          <div className="form-group">
            <label htmlFor="course">Course*</label>
            <select
              id="course"
              name="course"
              value={formData.course}
              onChange={handleChange}
              required={!isCreatingNewCourse && !isEditMode}
              className={error && !formData.course && !isCreatingNewCourse ? 'error' : ''}
              disabled={!!courseId || isEditMode}
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title} {course.code ? `(${course.code})` : ''}
                </option>
              ))}
            </select>
            {courseId && (
              <small className="form-text text-muted">
                Course is pre-selected based on where you came from.
              </small>
            )}
            {courses.length === 0 && !isCreatingNewCourse && (
              <div className="no-courses-message">
                <p>No courses found. Please create a new course.</p>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => setIsCreatingNewCourse(true)}
                >
                  Create a new course
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="new-course-form">
            <h3>Create New Course</h3>
            <div className="form-group">
              <label htmlFor="courseTitle">Course Title*</label>
              <input
                type="text"
                id="courseTitle"
                name="title"
                value={newCourseData.title}
                onChange={handleNewCourseChange}
                placeholder="Enter course title"
                required={isCreatingNewCourse}
                className={error && isCreatingNewCourse && !newCourseData.title ? 'error' : ''}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="courseCode">Course Code</label>
                <input
                  type="text"
                  id="courseCode"
                  name="code"
                  value={newCourseData.code}
                  onChange={handleNewCourseChange}
                  placeholder="e.g., CS101"
                />
              </div>
              <div className="form-group">
                <label htmlFor="courseInstructor">Instructor</label>
                <input
                  type="text"
                  id="courseInstructor"
                  name="instructor"
                  value={newCourseData.instructor}
                  onChange={handleNewCourseChange}
                  placeholder="Enter instructor name"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="courseSemester">Semester</label>
                <select
                  id="courseSemester"
                  name="semester"
                  value={newCourseData.semester}
                  onChange={handleNewCourseChange}
                >
                  <option value="">Select semester</option>
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                  <option value="Winter">Winter</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="courseYear">Year</label>
                <input
                  type="number"
                  id="courseYear"
                  name="year"
                  value={newCourseData.year}
                  onChange={handleNewCourseChange}
                  placeholder="Enter year"
                  min="2000"
                  max="2100"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="courseDescription">Description</label>
              <textarea
                id="courseDescription"
                name="description"
                value={newCourseData.description}
                onChange={handleNewCourseChange}
                placeholder="Enter course description"
                rows="3"
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="icon">Icon</label>
          <select
            id="icon"
            name="icon"
            value={formData.icon}
            onChange={handleChange}
          >
            <option value="folder">📁 Folder</option>
            <option value="book">📚 Book</option>
            <option value="file">📄 File</option>
            <option value="code">💻 Code</option>
            <option value="tasks">✅ Tasks</option>
            <option value="notes">📝 Notes</option>
            <option value="calendar">📅 Calendar</option>
            <option value="lab">🧪 Lab</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="color">Color</label>
          <input
            type="color"
            id="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => courseId ? navigate(`/courses/${courseId}`) : navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                {isEditMode ? ' Updating...' : ' Creating...'}
              </>
            ) : (
              <>
                <i className={`fas fa-${isEditMode ? 'save' : 'plus'}`}></i>
                {isEditMode ? ' Save Changes' : ' Create Workspace'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkspaceForm; 