import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getCourses } from '../api/courseApi';
import { getWorkspaces } from '../api/workspaceApi';
import './Dashboard.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedItems: 0,
    pendingItems: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const coursesData = await getCourses();
        const workspacesData = await getWorkspaces();
        
        // Calculate stats
        const completedItems = workspacesData.reduce((acc, workspace) => 
          acc + (workspace.items?.filter(item => item.status === 'completed').length || 0), 0);
        const pendingItems = workspacesData.reduce((acc, workspace) => 
          acc + (workspace.items?.filter(item => item.status !== 'completed').length || 0), 0);
        
        setStats({
          totalCourses: coursesData.length,
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

  const features = [
    {
      title: "Courses",
      icon: "fas fa-graduation-cap",
      description: "Manage your courses, access workspaces, and track course materials",
      link: "/courses",
      stats: `${stats.totalCourses} Courses`,
      color: "#4f46e5"
    },
    {
      title: "Collaboration",
      icon: "fas fa-users",
      description: "Join real-time collaboration sessions, chat with peers, and work together",
      link: "/collaboration",
      stats: "Live Sessions",
      color: "#0891b2"
    },
    {
      title: "Tasks",
      icon: "fas fa-tasks",
      description: "View and manage your assignments, deadlines, and to-dos",
      link: "/tasks",
      stats: `${stats.pendingItems} Pending`,
      color: "#db2777"
    },
    {
      title: "Progress",
      icon: "fas fa-chart-line",
      description: "Track your learning progress and completed items",
      link: "/progress",
      stats: `${stats.completedItems} Completed`,
      color: "#059669"
    }
  ];

  return (
    <div className="dashboard">
      <div className="welcome-message">
        <h2>Welcome back, {user?.name || 'Student'}!</h2>
        <p>What would you like to do today?</p>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading your data...</p>
        </div>
      ) : (
        <div className="dashboard-content">
          <div className="features-grid">
            {features.map((feature, index) => (
              <Link 
                to={feature.link} 
                key={index}
                className="feature-card"
                style={{ '--card-color': feature.color }}
              >
                <div className="feature-card-header">
                  <i className={feature.icon}></i>
                  <h3>{feature.title}</h3>
                </div>
                <p>{feature.description}</p>
                <div className="feature-card-footer">
                  <span className="feature-stats">
                    <i className="fas fa-chart-bar"></i>
                    {feature.stats}
                  </span>
                  <span className="feature-action">
                    View <i className="fas fa-arrow-right"></i>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="quick-actions-grid">
              <Link to="/courses/new" className="quick-action-btn">
                <i className="fas fa-plus"></i>
                New Course
              </Link>
              <Link to="/tasks/new" className="quick-action-btn">
                <i className="fas fa-clipboard-list"></i>
                New Task
              </Link>
              <Link to="/collaboration/join" className="quick-action-btn">
                <i className="fas fa-user-plus"></i>
                Join Session
              </Link>
              <Link to="/calendar" className="quick-action-btn">
                <i className="fas fa-calendar"></i>
                View Calendar
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 