import axios from 'axios';

// Use the proxy defined in package.json instead of hardcoding the URL
const API_URL = '/api/auth';

class AuthService {
    constructor() {
        this.api = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Initialize token from localStorage
        const token = localStorage.getItem('token');
        if (token) {
            this.setAuthToken(token);
        }
    }

    // Set auth token for API calls
    setAuthToken(token) {
        if (token) {
            this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.api.defaults.headers.common['Authorization'];
            delete axios.defaults.headers.common['Authorization'];
        }
    }

    // Register a new user
    async register(userData) {
        try {
            console.log('Registering user:', userData);
            
            // Make sure we're sending the data in the format the backend expects
            const response = await this.api.post('/register', {
                name: userData.name,
                email: userData.email,
                password: userData.password
            });
            
            console.log('Registration response:', response.data);
            
            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                this.setAuthToken(response.data.token);
            }
            
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Registration error:', error.response || error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Registration failed' 
            };
        }
    }

    // Login user
    async login(email, password) {
        try {
            console.log('Logging in user:', email);
            const response = await this.api.post('/login', { email, password });
            console.log('Login response:', response.data);
            
            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                this.setAuthToken(response.data.token);
            }
            
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Login error:', error.response || error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Login failed' 
            };
        }
    }

    // Get current user from API
    async getMe() {
        try {
            const response = await this.api.get('/me');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching current user:', error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Failed to fetch current user' 
            };
        }
    }

    // Get user profile
    async getUserProfile() {
        try {
            const response = await this.api.get('/profile');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Failed to fetch profile' 
            };
        }
    }

    // Update user profile
    async updateProfile(userData) {
        try {
            const response = await this.api.put('/profile', userData);
            
            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data));
                this.setAuthToken(response.data.token);
            }
            
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error updating profile:', error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Failed to update profile' 
            };
        }
    }

    // Logout user
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.setAuthToken(null);
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('token');
    }
}

const authService = new AuthService();
export default authService; 