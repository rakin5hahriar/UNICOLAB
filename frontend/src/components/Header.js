import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Header = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold tracking-tight">
              <span className="text-white">Student</span>
              <span className="text-yellow-300">Workspace</span>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMobileMenu}
              className="text-white hover:text-yellow-300 focus:outline-none"
            >
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path fillRule="evenodd" clipRule="evenodd" d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z" />
                ) : (
                  <path fillRule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z" />
                )}
              </svg>
            </button>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-white hover:text-yellow-300 transition duration-200">Home</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/courses" className="text-white hover:text-yellow-300 transition duration-200">My Courses</Link>
                <Link to="/users" className="text-white hover:text-yellow-300 transition duration-200">Users</Link>
                
                {isAdmin() && (
                  <Link to="/users/add" className="text-white hover:text-yellow-300 transition duration-200">Add User</Link>
                )}
                
                <div className="relative group">
                  <button className="flex items-center text-white hover:text-yellow-300 transition duration-200">
                    <span className="mr-1">Hello, {user.name}</span>
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                    <Link to="/profile" className="block px-4 py-2 text-gray-800 hover:bg-indigo-100">Profile</Link>
                    <Link to="/settings" className="block px-4 py-2 text-gray-800 hover:bg-indigo-100">Settings</Link>
                    <button 
                      onClick={handleLogout} 
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-indigo-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white hover:text-yellow-300 transition duration-200">Login</Link>
                <Link to="/register" className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-semibold px-4 py-2 rounded-md transition duration-200">Register</Link>
              </>
            )}
          </nav>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4">
            <div className="flex flex-col space-y-3">
              <Link to="/" className="text-white hover:text-yellow-300 transition duration-200">Home</Link>
              
              {isAuthenticated ? (
                <>
                  <Link to="/courses" className="text-white hover:text-yellow-300 transition duration-200">My Courses</Link>
                  <Link to="/users" className="text-white hover:text-yellow-300 transition duration-200">Users</Link>
                  
                  {isAdmin() && (
                    <Link to="/users/add" className="text-white hover:text-yellow-300 transition duration-200">Add User</Link>
                  )}
                  
                  <div className="pt-2 border-t border-indigo-500">
                    <p className="text-white mb-2">Hello, {user.name}</p>
                    <Link to="/profile" className="block text-white hover:text-yellow-300 transition duration-200 mb-2">Profile</Link>
                    <Link to="/settings" className="block text-white hover:text-yellow-300 transition duration-200 mb-2">Settings</Link>
                    <button 
                      onClick={handleLogout} 
                      className="text-white hover:text-yellow-300 transition duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-white hover:text-yellow-300 transition duration-200">Login</Link>
                  <Link to="/register" className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-semibold px-4 py-2 rounded-md inline-block transition duration-200">Register</Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header; 