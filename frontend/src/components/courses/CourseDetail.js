import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getCourseById, deleteCourse } from '../../api/courseApi';
import { getWorkspacesByCourse } from '../../api/workspaceApi';
import WorkspaceList from '../workspaces/WorkspaceList';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourseAndWorkspaces = async () => {
      try {
        setLoading(true);
        const courseData = await getCourseById(id);
        setCourse(courseData);

        const workspacesData = await getWorkspacesByCourse(id);
        setWorkspaces(workspacesData);

        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch course details');
        setLoading(false);
      }
    };

    fetchCourseAndWorkspaces();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this course? This will also delete all workspaces and items associated with this course.')) {
      try {
        await deleteCourse(id);
        navigate('/courses');
      } catch (err) {
        setError(err.message || 'Failed to delete course');
      }
    }
  };

  if (loading) return <div className="loading">Loading course details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!course) return <div className="not-found">Course not found</div>;

  return (
    <div className="course-detail">
      <div className="course-header">
        <div className="course-title">
          <h2>{course.title}</h2>
          {course.code && <span className="course-code">{course.code}</span>}
        </div>
        <div className="course-actions">
          <Link to={`/courses/edit/${course._id}`} className="btn btn-secondary">
            Edit Course
          </Link>
          <button onClick={handleDelete} className="btn btn-danger">
            Delete Course
          </button>
        </div>
      </div>

      <div className="course-info">
        {course.description && (
          <div className="course-description">
            <h3>Description</h3>
            <p>{course.description}</p>
          </div>
        )}
        <div className="course-meta">
          {course.instructor && (
            <div className="meta-item">
              <strong>Instructor:</strong> {course.instructor}
            </div>
          )}
          {course.semester && course.year && (
            <div className="meta-item">
              <strong>Term:</strong> {course.semester} {course.year}
            </div>
          )}
        </div>
      </div>

      <div className="course-workspaces">
        <div className="workspaces-header">
          <h3>Workspaces</h3>
          <Link to={`/courses/${course._id}/workspaces/add`} className="btn btn-primary">
            Add Workspace
          </Link>
        </div>
        <WorkspaceList workspaces={workspaces} courseId={course._id} />
      </div>
    </div>
  );
};

export default CourseDetail; 