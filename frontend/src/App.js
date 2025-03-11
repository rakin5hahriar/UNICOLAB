import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Utils
import { logApiStatus, checkApiConnection } from './utils/apiCheck';

// Auth Context
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { CollaborationProvider } from './contexts/CollaborationContext';

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WorkspaceDetail from './pages/WorkspaceDetail';
import WorkspaceFormPage from './pages/WorkspaceFormPage';

// Course Workspace Pages
import CoursesPage from './pages/CoursesPage';
import CourseFormPage from './pages/CourseFormPage';
import CourseDetailPage from './pages/CourseDetailPage';

// New Workspace Pages
import WorkspacesPage from './pages/WorkspacesPage';
import WorkspaceDetailPage from './pages/WorkspaceDetailPage';
import CreateWorkspacePage from './pages/CreateWorkspacePage';
import EditWorkspacePage from './pages/EditWorkspacePage';

// Components
import PrivateRoute from './components/routing/PrivateRoute';
import WorkspaceItemFormPage from './pages/WorkspaceItemFormPage';
import WorkspaceItemDetailPage from './pages/WorkspaceItemDetailPage';
import CollaborationPage from './pages/CollaborationPage';
import WorkspaceListPage from './pages/WorkspaceList';

function App() {
  useEffect(() => {
    // Log API status on startup
    logApiStatus();
    
    // Check API connection and show toast if not connected
    checkApiConnection().then(isConnected => {
      if (!isConnected) {
        toast.error('Cannot connect to the backend server. Please make sure it is running.', {
          autoClose: false,
        });
      }
    });
  }, []);

  // Add cleanup function for collaboration context
  useEffect(() => {
    return () => {
      // This ensures we don't try to call leaveWorkspace on unmount
      // Instead, we'll rely on the cleanup in CollaborationContext
    };
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <CollaborationProvider>
          <Router>
            <div className="App">
              <Header />
              <main className="container">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Protected Routes - Require Authentication */}
                  <Route path="/dashboard" element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  } />
                  
                  {/* Collaboration Routes */}
                  <Route path="/collaboration" element={
                    <PrivateRoute>
                      <CollaborationPage />
                    </PrivateRoute>
                  } />
                  <Route path="/collaboration/:sessionId" element={
                    <PrivateRoute>
                      <CollaborationPage />
                    </PrivateRoute>
                  } />
                  
                  {/* Course Routes */}
                  <Route path="/courses" element={
                    <PrivateRoute>
                      <CoursesPage />
                    </PrivateRoute>
                  } />
                  <Route path="/courses/new" element={
                    <PrivateRoute>
                      <CourseFormPage />
                    </PrivateRoute>
                  } />
                  <Route path="/courses/edit/:id" element={
                    <PrivateRoute>
                      <CourseFormPage />
                    </PrivateRoute>
                  } />
                  <Route path="/courses/:id" element={
                    <PrivateRoute>
                      <CourseDetailPage />
                    </PrivateRoute>
                  } />
                  
                  {/* Course Workspace Routes */}
                  <Route path="/courses/:courseId/workspaces" element={
                    <PrivateRoute>
                      <WorkspaceListPage />
                    </PrivateRoute>
                  } />
                  <Route path="/courses/:courseId/workspaces/add" element={
                    <PrivateRoute>
                      <WorkspaceFormPage />
                    </PrivateRoute>
                  } />
                  
                  {/* Legacy Workspace Routes */}
                  <Route path="/workspaces/legacy/new" element={
                    <PrivateRoute>
                      <WorkspaceFormPage />
                    </PrivateRoute>
                  } />
                  <Route path="/workspaces/legacy/edit/:id" element={
                    <PrivateRoute>
                      <WorkspaceFormPage />
                    </PrivateRoute>
                  } />
                  <Route path="/workspaces/legacy/:id" element={
                    <PrivateRoute>
                      <WorkspaceDetail />
                    </PrivateRoute>
                  } />
                  
                  {/* New Workspace Routes - Order matters! Most specific first */}
                  <Route path="/workspaces/new" element={
                    <PrivateRoute>
                      <CreateWorkspacePage />
                    </PrivateRoute>
                  } />
                  <Route path="/workspaces/:id/edit" element={
                    <PrivateRoute>
                      <EditWorkspacePage />
                    </PrivateRoute>
                  } />
                  <Route path="/workspaces/:id" element={
                    <PrivateRoute>
                      <WorkspaceDetailPage />
                    </PrivateRoute>
                  } />
                  <Route path="/workspaces" element={
                    <PrivateRoute>
                      <WorkspacesPage />
                    </PrivateRoute>
                  } />
                  
                  {/* Workspace Item Routes */}
                  <Route path="/workspace-items/new/:workspaceId" element={
                    <PrivateRoute>
                      <WorkspaceItemFormPage />
                    </PrivateRoute>
                  } />
                  <Route path="/workspace-items/edit/:id" element={
                    <PrivateRoute>
                      <WorkspaceItemFormPage />
                    </PrivateRoute>
                  } />
                  <Route path="/workspace-items/:id" element={
                    <PrivateRoute>
                      <WorkspaceItemDetailPage />
                    </PrivateRoute>
                  } />
                </Routes>
              </main>
              <Footer />
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </div>
          </Router>
        </CollaborationProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
