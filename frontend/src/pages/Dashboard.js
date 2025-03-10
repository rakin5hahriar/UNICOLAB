import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getCourses } from '../api/courseApi';
import { getWorkspaces } from '../api/workspaceApi';
import './Dashboard.css';

const Dashboard = () => {
  const [courses, setCourses] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalWorkspaces: 0,
    completedItems: 0,
    pendingItems: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const coursesData = await getCourses();
        const workspacesData = await getWorkspaces();
        
        setCourses(coursesData);
        setWorkspaces(workspacesData);
        
        // Calculate stats
        const completedItems = workspacesData.reduce((acc, workspace) => 
          acc + (workspace.items?.filter(item => item.status === 'completed').length || 0), 0);
        const pendingItems = workspacesData.reduce((acc, workspace) => 
          acc + (workspace.items?.filter(item => item.status !== 'completed').length || 0), 0);
        
        setStats({
          totalCourses: coursesData.length,
          totalWorkspaces: workspacesData.length,
          completedItems,
          pendingItems
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard">
      <div className="welcome-message">
        <h2>Welcome back, {user?.name || 'Student'}!</h2>
        <p>Here's an overview of your courses and workspaces.</p>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading your data...</p>
        </div>
      ) : (
        <div className="dashboard-content">
          {/* Stats Section */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-book"></i>
              </div>
              <h4>{stats.totalCourses}</h4>
              <p>Total Courses</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-folder"></i>
              </div>
              <h4>{stats.totalWorkspaces}</h4>
              <p>Workspaces</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h4>{stats.completedItems}</h4>
              <p>Completed Items</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-clock"></i>
              </div>
              <h4>{stats.pendingItems}</h4>
              <p>Pending Items</p>
            </div>
          </div>

          {/* Courses Section */}
          <div className="dashboard-section">
            <div className="section-header">
              <h3>
                <i className="fas fa-graduation-cap"></i>
                Your Courses
              </h3>
              <Link to="/courses/new" className="btn-primary">
                <i className="fas fa-plus"></i> Add Course
              </Link>
            </div>
            {courses.length > 0 ? (
              <div className="course-grid">
                {courses.map((course) => (
                  <div key={course._id} className="course-card">
                    <div className="course-card-header">
                      <i className="fas fa-book"></i>
                      <h4>{course.name}</h4>
                    </div>
                    <p>{course.description}</p>
                    <div className="course-card-footer">
                      <span className="course-code">{course.code}</span>
                      <Link to={`/courses/${course._id}`} className="btn-secondary">
                        <i className="fas fa-arrow-right"></i> View Course
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-books"></i>
                <p>You haven't added any courses yet.</p>
                <Link to="/courses/new" className="btn-primary">
                  <i className="fas fa-plus"></i> Add Your First Course
                </Link>
              </div>
            )}
          </div>

          {/* Workspaces Section */}
          <div className="dashboard-section">
            <div className="section-header">
              <h3>
                <i className="fas fa-folder-open"></i>
                Recent Workspaces
              </h3>
              <Link to="/workspaces/new" className="btn-primary">
                <i className="fas fa-plus"></i> Create Workspace
              </Link>
            </div>
            {workspaces.length > 0 ? (
              <div className="workspace-grid">
                {workspaces.slice(0, 4).map((workspace) => (
                  <div key={workspace._id} className="workspace-card">
                    <div className="workspace-card-header" style={{ backgroundColor: workspace.color || '#3b82f6' }}>
                      <i className={`fas fa-${workspace.icon || 'folder'}`}></i>
                    </div>
                    <div className="workspace-card-content">
                      <h4>{workspace.name}</h4>
                      <p>{workspace.description}</p>
                      <div className="workspace-card-footer">
                        <span className="workspace-items-count">
                          <i className="fas fa-layer-group"></i>
                          {workspace.items?.length || 0} items
                        </span>
                        <Link to={`/workspaces/${workspace._id}`} className="btn-secondary">
                          <i className="fas fa-arrow-right"></i> Open
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-folder-plus"></i>
                <p>You haven't created any workspaces yet.</p>
                <Link to="/workspaces/new" className="btn-primary">
                  <i className="fas fa-plus"></i> Create Your First Workspace
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 