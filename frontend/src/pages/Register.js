import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [activeInput, setActiveInput] = useState(null);
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Call register function from AuthContext
      const success = await register(formData.name, formData.email, formData.password);
      
      if (success) {
        toast.success('Registration successful!');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 6) strength += 1;
    if (password.length >= 10) strength += 1;
    
    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return Math.min(strength, 5);
  };
  
  const passwordStrength = getPasswordStrength(formData.password);
  
  const getPasswordStrengthText = (strength) => {
    const texts = ['', 'Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
    return texts[strength];
  };

  return (
    <div className="register-container">
      <div className="register-card-container">
        <motion.div 
          className="register-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="register-header">
            <h1>Create Account</h1>
            <p>Join UNICOLLAB to collaborate and manage your university projects</p>
          </div>

          {error && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <i className="fas fa-exclamation-circle"></i>
              <p>{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                onFocus={() => setActiveInput('name')}
                onBlur={() => setActiveInput(null)}
                placeholder="Enter your full name"
                className={activeInput === 'name' ? 'active' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setActiveInput('email')}
                onBlur={() => setActiveInput(null)}
                placeholder="Enter your email"
                className={activeInput === 'email' ? 'active' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setActiveInput('password')}
                  onBlur={() => setActiveInput(null)}
                  placeholder="Create a password"
                  className={activeInput === 'password' ? 'active' : ''}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <i className={`fas fa-eye${isPasswordVisible ? '-slash' : ''}`}></i>
                </button>
              </div>
              {formData.password && (
                <div className="password-strength">
                  <div className="text-sm text-gray-600">
                    Password Strength: {getPasswordStrengthText(passwordStrength)}
                  </div>
                  <div className="strength-bars">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`strength-bar ${level <= passwordStrength ? 'active' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={isConfirmPasswordVisible ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => setActiveInput('confirmPassword')}
                  onBlur={() => setActiveInput(null)}
                  placeholder="Confirm your password"
                  className={activeInput === 'confirmPassword' ? 'active' : ''}
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <i className={`fas fa-eye${isConfirmPasswordVisible ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              className="create-account-button"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="loading-spinner" />
              ) : (
                'Create Account'
              )}
            </motion.button>

            <div className="login-prompt">
              Already have an account?
              <Link to="/login">Sign in instead</Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Register; 