import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserById } from '../api/userApi';

const UserDetail = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUserById(id);
        setUser(data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch user details');
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-detail">
      <h2>User Details</h2>
      <div className="card">
        <div className="card-body">
          <h3 className="card-title">{user.name}</h3>
          <p className="card-text">
            <strong>Email:</strong> {user.email}
          </p>
          <p className="card-text">
            <strong>Role:</strong> {user.role}
          </p>
          <p className="card-text">
            <strong>Created At:</strong>{' '}
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="user-actions">
        <Link to="/users" className="btn btn-secondary">
          Back to Users
        </Link>
        <Link to={`/users/edit/${user._id}`} className="btn btn-primary">
          Edit
        </Link>
      </div>
    </div>
  );
};

export default UserDetail; 