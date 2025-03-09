import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to Student Workspace</h1>
        <p>Organize your courses, take notes, track assignments, and collaborate with peers</p>
        <div className="cta-buttons">
          {isAuthenticated ? (
            <>
              <Link to="/courses" className="btn btn-primary">
                My Courses
              </Link>
              <Link to="/courses/add" className="btn btn-success">
                Add New Course
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary">
                Login
              </Link>
              <Link to="/register" className="btn btn-success">
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="app-description">
        <h2>Key Features</h2>
        <p>
          Student Workspace is a comprehensive MERN (MongoDB, Express, React, Node.js) application 
          designed to help students organize their academic life in one place.
        </p>
      </div>

      <div className="features-section">
        <h2>Course-Based Workspace Management</h2>
        <div className="features">
          <div className="feature">
            <i className="fas fa-book-open"></i>
            <h3>Course Workspaces</h3>
            <p>Create individual workspaces for each of your courses, where you can store lecture notes, assignments, readings, and other materials.</p>
          </div>
          <div className="feature">
            <i className="fas fa-sticky-note"></i>
            <h3>Note-Taking System</h3>
            <p>Take interactive notes with features like checklists, formatting, and organization by topic.</p>
          </div>
          <div className="feature">
            <i className="fas fa-tasks"></i>
            <h3>Assignment Tracker</h3>
            <p>Manage and set priorities to assignments, projects, and exams for each course, with due dates and completion tracking.</p>
          </div>
          <div className="feature">
            <i className="fas fa-folder-open"></i>
            <h3>Resource Organization</h3>
            <p>Organize all your course materials in a structured way with customizable workspaces and color-coding.</p>
          </div>
        </div>
      </div>

      <div className="features-section alt-bg">
        <h2>Coming Soon</h2>
        <div className="features">
          <div className="feature">
            <i className="fas fa-users"></i>
            <h3>Collaboration</h3>
            <p>Work on group projects in shared workspaces with real-time editing and commenting features.</p>
          </div>
          <div className="feature">
            <i className="fas fa-calendar-alt"></i>
            <h3>Academic Calendar</h3>
            <p>Sync with Google Calendar to visualize your workload and plan effectively.</p>
          </div>
          <div className="feature">
            <i className="fas fa-cloud-upload-alt"></i>
            <h3>Cloud Integration</h3>
            <p>Seamless integration with Google Drive for easy access and sharing of academic resources.</p>
          </div>
          <div className="feature">
            <i className="fas fa-chart-line"></i>
            <h3>Progress Tracking</h3>
            <p>Track your performance across courses, visualizing completion rates for assignments and projects.</p>
          </div>
        </div>
      </div>

      <div className="get-started-section">
        <h2>Get Started Today</h2>
        <p>Join thousands of students who are already organizing their academic life with Student Workspace.</p>
        {!isAuthenticated && (
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary">
              Create Your Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 