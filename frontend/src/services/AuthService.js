import axios from 'axios';

// Define the API URL
const API_URL = "http://localhost:8080";

// Authentication service class
const AuthService = {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/api/users/register`, userData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Login a user
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/users/login`, { email, password });

      // If login was successful, store the user info in local storage
      if (response.data.success) {
        // Make sure we have role information
        const userData = {
          ...response.data,
          // If response.data doesn't have role but has user object with role
          role: response.data.role ||
                (response.data.user && response.data.user.role) ||
                'unknown'
        };

        localStorage.setItem('user', JSON.stringify(userData));
      }

      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: error.message };
    }
  },

  // Logout the current user
  logout: () => {
    localStorage.removeItem('user');
  },

  // Get the current user from local storage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error("Error parsing user data:", e);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return localStorage.getItem('user') !== null;
  },

  // This method was referenced in App.js but was missing or had a different name
  isLoggedIn: () => {
    return localStorage.getItem('user') !== null;
  }
};

export default AuthService;
