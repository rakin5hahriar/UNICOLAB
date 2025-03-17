import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import './CourseNavigation.css';

const CourseNavigation = ({ courseId }) => {
  // Use the courseId from props or from URL params if not provided
  const { id } = useParams();
  const activeCourseId = courseId || id;
  
  return (
    <nav className="course-navigation">
      <ul className="course-nav-list">
        <li className="course-nav-item">
          <NavLink 
            to={`/courses/${activeCourseId}`} 
            className={({ isActive }) => isActive ? 'course-nav-link active' : 'course-nav-link'}
            end
          >
            <i className="fas fa-info-circle"></i>
            Overview
          </NavLink>
        </li>
        <li className="course-nav-item">
          <NavLink 
            to={`/courses/${activeCourseId}/workspaces`} 
            className={({ isActive }) => isActive ? 'course-nav-link active' : 'course-nav-link'}
          >
            <i className="fas fa-folder"></i>
            Workspaces
          </NavLink>
        </li>
        <li className="course-nav-item">
          <NavLink 
            to={`/courses/${activeCourseId}/assignments`} 
            className={({ isActive }) => isActive ? 'course-nav-link active' : 'course-nav-link'}
          >
            <i className="fas fa-tasks"></i>
            Assignments
          </NavLink>
        </li>
        <li className="course-nav-item">
          <NavLink 
            to={`/courses/${activeCourseId}/notes`} 
            className={({ isActive }) => isActive ? 'course-nav-link active' : 'course-nav-link'}
          >
            <i className="fas fa-sticky-note"></i>
            Notes
          </NavLink>
        </li>
        <li className="course-nav-item">
          <NavLink 
            to={`/courses/${activeCourseId}/collaboration`} 
            className={({ isActive }) => isActive ? 'course-nav-link active' : 'course-nav-link'}
          >
            <i className="fas fa-users"></i>
            Collaboration
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default CourseNavigation; 