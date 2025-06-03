import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/AuthService';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await AuthService.login(email, password);
      console.log("Login response:", response);

      if (response.success) {
        const user = AuthService.getCurrentUser();
        console.log("Current user:", user);

        // Redirect based on user role
        if (user.role === 'sender') {
          navigate('/sender-dashboard');
        } else if (user.role === 'handler') {
          navigate('/handler-dashboard');
        } else if (user.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setMessage(response.message || 'Login failed');
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-control"
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-control"
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {message && <div className="alert alert-danger">{message}</div>}

        <div className="auth-footer">
          Don't have an account? <a href="/register">Register here</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
