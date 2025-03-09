import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserById, createUser, updateUser } from '../api/userApi';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAddMode = !id;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAddMode) {
      const fetchUser = async () => {
        try {
          setLoading(true);
          const user = await getUserById(id);
          setFormData({
            name: user.name,
            email: user.email,
            password: '',
          });
          setLoading(false);
        } catch (err) {
          setError(err.message || 'Failed to fetch user');
          setLoading(false);
        }
      };

      fetchUser();
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
        await createUser(formData);
      } else {
        const { password, ...updateData } = formData;
        // Only include password if it's provided
        if (password) {
          updateData.password = password;
        }
        await updateUser(id, updateData);
      }
      setLoading(false);
      navigate('/users');
    } catch (err) {
      setError(err.message || 'Failed to save user');
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="user-form">
      <h2>{isAddMode ? 'Add User' : 'Edit User'}</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">
            {isAddMode ? 'Password' : 'Password (Leave blank to keep current)'}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required={isAddMode}
          />
        </div>
        <div className="form-buttons">
          <button type="submit" className="btn btn-primary">
            {isAddMode ? 'Add User' : 'Update User'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm; 