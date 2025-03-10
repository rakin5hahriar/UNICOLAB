import React from 'react';
import { Link, useParams } from 'react-router-dom';
import CourseDetail from '../components/courses/CourseDetail';

const CourseDetailPage = () => {
  const { id } = useParams();
  
  return (
    <div className="page-wrapper">
      <div className="page-header course-detail-header">
        <div className="container">
          <div className="page-header-content">
            <h1>
              <i className="fas fa-book"></i> Course Details
            </h1>
            <div className="breadcrumb">
              <Link to="/">
                <i className="fas fa-home"></i> Home
              </Link>
              <span className="separator">/</span>
              <Link to="/courses">
                <i className="fas fa-graduation-cap"></i> My Courses
              </Link>
              <span className="separator">/</span>
              <span className="current">Course Details</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container">
        <CourseDetail courseId={id} />
      </div>
    </div>
  );
};

export default CourseDetailPage; 