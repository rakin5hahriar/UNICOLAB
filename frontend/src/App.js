import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Users from './pages/Users';
import AddUser from './pages/AddUser';
import EditUser from './pages/EditUser';
import UserDetailPage from './pages/UserDetailPage';
import Login from './pages/Login';
import Register from './pages/Register';

// Course Workspace Pages
import CoursesPage from './pages/CoursesPage';
import CourseFormPage from './pages/CourseFormPage';
import CourseDetailPage from './pages/CourseDetailPage';
import WorkspaceFormPage from './pages/WorkspaceFormPage';
import WorkspaceDetailPage from './pages/WorkspaceDetailPage';
import WorkspaceItemFormPage from './pages/WorkspaceItemFormPage';
import WorkspaceItemDetailPage from './pages/WorkspaceItemDetailPage';

// Context
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
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
              <Route element={<ProtectedRoute requireAdmin={false} />}>
                {/* User Routes */}
                <Route path="/users" element={<Users />} />
                <Route path="/users/:id" element={<UserDetailPage />} />
                
                {/* Course Routes */}
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/add" element={<CourseFormPage />} />
                <Route path="/courses/edit/:id" element={<CourseFormPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                
                {/* Workspace Routes */}
                <Route path="/courses/:courseId/workspaces/add" element={<WorkspaceFormPage />} />
                <Route path="/workspaces/edit/:id" element={<WorkspaceFormPage />} />
                <Route path="/workspaces/:id" element={<WorkspaceDetailPage />} />
                
                {/* Workspace Item Routes */}
                <Route path="/workspaces/items/:id" element={<WorkspaceItemDetailPage />} />
                <Route path="/workspaces/items/edit/:id" element={<WorkspaceItemFormPage />} />
              </Route>
              
              {/* Admin Routes - Require Admin Role */}
              <Route element={<ProtectedRoute requireAdmin={true} />}>
                <Route path="/users/add" element={<AddUser />} />
                <Route path="/users/edit/:id" element={<EditUser />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
