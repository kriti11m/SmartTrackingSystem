import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-header">
          <h1>Smart Tracking System</h1>
          <p className="subtitle">Track, manage, and optimize your assets efficiently</p>
        </div>

        <div className="feature-section">
          <div className="feature">
            <div className="feature-icon">📊</div>
            <h3>Real-time Tracking</h3>
            <p>Monitor your assets in real time with our advanced tracking system</p>
          </div>
          <div className="feature">
            <div className="feature-icon">📱</div>
            <h3>Mobile Access</h3>
            <p>Access your data anytime, anywhere from any device</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🔒</div>
            <h3>Secure Platform</h3>
            <p>Your data is protected with enterprise-grade security</p>
          </div>
        </div>

        <div className="auth-options">
          <Link to="/login" className="auth-button login">
            Login
          </Link>
          <Link to="/register" className="auth-button register">
            Register
          </Link>
        </div>

        <div className="home-footer">
          <p>© 2025 Smart Tracking System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
