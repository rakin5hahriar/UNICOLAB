import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createWorkspace, getWorkspaceById as getWorkspace, updateWorkspace } from '../api/workspaceApi';
import { getCourses } from '../api/courseApi';
import './WorkspaceForm.css';

const WorkspaceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    course: '',
  });
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesData = await getCourses();
        setCourses(coursesData);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      }
    };

    fetchCourses();

    if (isEditMode) {
      const fetchWorkspace = async () => {
        try {
          setLoading(true);
          const workspaceData = await getWorkspace(id);
          setFormData({
            name: workspaceData.name,
            description: workspaceData.description,
            course: workspaceData.course,
          });
        } catch (err) {
          console.error('Error fetching workspace:', err);
          setError('Failed to load workspace. Please try again later.');
        } finally {
          setLoading(false);
        }
      };

      fetchWorkspace();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Workspace name is required');
      return;
    }
    
    if (!formData.course) {
      setError('Please select a course');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      if (isEditMode) {
        await updateWorkspace(id, formData);
        navigate(`/workspaces/${id}`);
      } else {
        const newWorkspace = await createWorkspace(formData);
        navigate(`/workspaces/${newWorkspace._id}`);
      }
    } catch (err) {
      console.error('Error saving workspace:', err);
      setError('Failed to save workspace. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace-form-container">
      <h1>{isEditMode ? 'Edit Workspace' : 'Create New Workspace'}</h1>
      
      {error && <div className="error-message">{error}</div>}
      
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
        
        <div className="form-group">
          <label htmlFor="course">Course*</label>
          <select
            id="course"
            name="course"
            value={formData.course}
            onChange={handleChange}
            required
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title || 'Untitled Course'}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Workspace' : 'Create Workspace'}
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkspaceForm; 