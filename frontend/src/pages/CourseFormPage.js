import React from 'react';
import { Link } from 'react-router-dom';
import CourseForm from '../components/courses/CourseForm';

const CourseFormPage = () => {
  return (
    <div className="course-form-page">
      <div className="page-header">
        <div className="container">
          <div className="page-header-content">
            <h1>
              <i className="fas fa-graduation-cap"></i> Course Management
            </h1>
            <div className="breadcrumb">
              <Link to="/">Home</Link> / 
              <Link to="/courses">Courses</Link> / 
              <span>Edit Course</span>
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <CourseForm />
      </div>
    </div>
  );
};

export default CourseFormPage; 