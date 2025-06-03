import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Home from './components/home/Home';
import SenderDashboard from './components/dashboard/SenderDashboard';
import HandlerDashboard from './components/dashboard/HandlerDashboard';
import CreateParcel from './components/dashboard/CreateParcel';
import ParcelDetailPage from './components/dashboard/ParcelDetailPage';
import AuthService from './services/AuthService';
import './App.css';

// Protected route component - Simplified to avoid redirection loops
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = AuthService.getCurrentUser();
  const isLoggedIn = AuthService.isLoggedIn();

  if (!isLoggedIn) {
    // If not logged in, redirect to login
    return <Navigate to="/login" />;
  }

  // If roles are specified and user's role isn't included, redirect to home
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log("User role not allowed:", user.role, "Allowed roles:", allowedRoles);
    return <Navigate to="/" />;
  }

  // User is logged in and has appropriate role
  return children;
};

// Dashboard router - Redirects to role-specific dashboard
const DashboardRouter = () => {
  const user = AuthService.getCurrentUser();
  console.log("DashboardRouter - Current user:", user);

  if (!user) {
    return <Navigate to="/login" />;
  }

  switch (user.role) {
    case 'sender':
      return <Navigate to="/sender-dashboard" />;
    case 'handler':
      return <Navigate to="/handler-dashboard" />;
    case 'admin':
      return <Navigate to="/admin-dashboard" />;
    default:
      return <Navigate to="/" />;
  }
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard router - redirects based on role */}
          <Route path="/dashboard" element={<DashboardRouter />} />

          {/* Sender routes */}
          <Route
            path="/sender-dashboard"
            element={
              <ProtectedRoute allowedRoles={['sender']}>
                <SenderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-parcel"
            element={
              <ProtectedRoute allowedRoles={['sender']}>
                <CreateParcel />
              </ProtectedRoute>
            }
          />

          {/* Handler routes */}
          <Route
            path="/handler-dashboard"
            element={
              <ProtectedRoute allowedRoles={['handler']}>
                <HandlerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div>Admin Dashboard</div>
              </ProtectedRoute>
            }
          />

          {/* Parcel detail page route - accessible via QR code */}
          <Route
            path="/parcel/:trackingId"
            element={
              <ProtectedRoute allowedRoles={['handler', 'admin']}>
                <ParcelDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
