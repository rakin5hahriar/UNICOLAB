import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import './WorkspaceForm.css';
import config from '../../config/config';

const WorkspaceForm = ({ workspace, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: workspace?.name || '',
    description: workspace?.description || '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Workspace name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Workspace name must be less than 50 characters';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (isEditing && workspace?._id) {
        await axios.put(
          `${config.apiUrl}/workspaces/${workspace._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        navigate(`/workspaces/${workspace._id}`);
      } else {
        const response = await axios.post(
          `${config.apiUrl}/workspaces`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        navigate(`/workspaces/${response.data._id}`);
      }
    } catch (err) {
      console.error('Error submitting workspace:', err);
      
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({
          form: 'Failed to save workspace. Please try again later.'
        });
      }
      
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isEditing && workspace?._id) {
      navigate(`/workspaces/${workspace._id}`);
    } else {
      navigate('/workspaces');
    }
  };

  return (
    <div className="workspace-form-container">
      <div className="workspace-form-header">
        <h2>{isEditing ? 'Edit Workspace' : 'Create New Workspace'}</h2>
        <p>
          {isEditing 
            ? 'Update your workspace information below.' 
            : 'Fill in the details to create a new workspace.'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        {errors.form && (
          <div className="form-error">{errors.form}</div>
        )}
        
        <div className="form-group">
          <label htmlFor="name">Workspace Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-control"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter workspace name"
            required
          />
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            className="form-control"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter workspace description (optional)"
          />
          {errors.description && (
            <div className="form-error">{errors.description}</div>
          )}
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="loading-spinner" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Workspace' : 'Create Workspace'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkspaceForm; 