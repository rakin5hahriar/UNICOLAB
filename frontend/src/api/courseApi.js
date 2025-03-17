import axios from 'axios';

// Create an axios instance with the correct base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Course API Error:', error);
    
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.log('Authentication error, redirecting to login');
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Course API endpoints
export const getCourses = async () => {
  try {
    console.log('Fetching courses...');
    const response = await api.get('/courses');
    console.log('Courses fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch courses');
  }
};

export const getCourseById = async (id) => {
  try {
    if (!id) {
      throw new Error('Course ID is required');
    }
    const response = await api.get(`/courses/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching course:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch course details');
  }
};

export const createCourse = async (courseData) => {
  try {
    console.log('Creating course with data:', courseData);
    const response = await api.post('/courses', courseData);
    console.log('Course created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating course:', error);
    console.error('Error response:', error.response?.data);
    
    // Extract the most useful error message
    const errorMessage = 
      error.response?.data?.message || 
      error.message || 
      'Failed to create course';
      
    throw new Error(errorMessage);
  }
};

export const updateCourse = async (id, courseData) => {
  try {
    if (!id) {
      throw new Error('Course ID is required');
    }
    const response = await api.put(`/courses/${id}`, courseData);
    return response.data;
  } catch (error) {
    console.error('Error updating course:', error);
    throw new Error(error.response?.data?.message || 'Failed to update course');
  }
};

export const deleteCourse = async (id) => {
  try {
    if (!id) {
      throw new Error('Course ID is required');
    }
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting course:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete course');
  }
};

const courseApi = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};

export default courseApi; 