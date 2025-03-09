import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Header = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <Link to="/">Student Workspace</Link>
        </div>
        <nav className="nav">
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/courses">My Courses</Link>
                </li>
                <li>
                  <Link to="/users">Users</Link>
                </li>
                {isAdmin() && (
                  <li>
                    <Link to="/users/add">Add User</Link>
                  </li>
                )}
                <li>
                  <span className="user-greeting">Hello, {user.name}</span>
                </li>
                <li>
                  <button onClick={handleLogout} className="btn-link">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login">Login</Link>
                </li>
                <li>
                  <Link to="/register">Register</Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 