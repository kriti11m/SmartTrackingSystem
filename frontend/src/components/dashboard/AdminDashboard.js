import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/AuthService';
import ParcelService from '../../services/ParcelService';
import './Dashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [parcels, setParcels] = useState([]);
  const [users, setUsers] = useState([]);
  const [tamperAlerts, setTamperAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const navigate = useNavigate();

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);

    // Redirect if not logged in or not an admin
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    // Load all data for admin dashboard
    fetchAdminData();
  }, [navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get all parcels for the admin view
      const parcelsData = await ParcelService.getAllParcels();
      setParcels(parcelsData);

      // Get all users
      const usersData = await AuthService.getAllUsers();
      setUsers(usersData);

      // Get tampering alerts
      const alertsData = await ParcelService.getTamperAlerts();
      setTamperAlerts(alertsData);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // If not authenticated yet, show loading
  if (!currentUser) {
    return <div className="dashboard-container">Loading...</div>;
  }

  const handleLogout = () => {
    AuthService.logout();
    navigate('/');
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value
    });
  };

  const filteredParcels = () => {
    return parcels.filter(parcel => {
      // Apply status filter
      if (filterStatus !== 'all' && parcel.status.toLowerCase() !== filterStatus.toLowerCase()) {
        return false;
      }

      // Apply search filter on tracking ID or recipient name
      if (searchTerm &&
          !parcel.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !parcel.recipientName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Apply date range filter if provided
      if (dateRange.from && new Date(parcel.createdAt) < new Date(dateRange.from)) {
        return false;
      }

      if (dateRange.to && new Date(parcel.createdAt) > new Date(dateRange.to)) {
        return false;
      }

      return true;
    });
  };

  const handleResolveTamperAlert = async (parcelId, alertId) => {
    try {
      await ParcelService.resolveTamperAlert(parcelId, alertId);

      // Refresh tampering alerts
      const alertsData = await ParcelService.getTamperAlerts();
      setTamperAlerts(alertsData);
    } catch (err) {
      setError('Failed to resolve alert: ' + err.message);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await AuthService.updateUserRole(userId, newRole);

      // Refresh users list
      const usersData = await AuthService.getAllUsers();
      setUsers(usersData);
    } catch (err) {
      setError('Failed to update user role: ' + err.message);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <div className="dashboard-logo">
          <h2>Smart Tracking</h2>
        </div>
        <div className="dashboard-menu">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeTab === 'parcels' ? 'active' : ''}
            onClick={() => setActiveTab('parcels')}
          >
            All Parcels
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Manage Users
          </button>
          <button
            className={activeTab === 'alerts' ? 'active' : ''}
            onClick={() => setActiveTab('alerts')}
          >
            Tampering Alerts
          </button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome, {currentUser?.name || 'Admin'}!</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {activeTab === 'dashboard' && (
          <div className="dashboard-summary">
            <div className="dashboard-stats">
              <div className="dashboard-card">
                <h3>Total Parcels</h3>
                <p className="large-number">{loading ? '...' : parcels.length}</p>
              </div>
              <div className="dashboard-card">
                <h3>Active Users</h3>
                <p className="large-number">{loading ? '...' : users.length}</p>
              </div>
              <div className="dashboard-card">
                <h3>Open Alerts</h3>
                <p className="large-number">{loading ? '...' : tamperAlerts.filter(a => !a.resolved).length}</p>
              </div>
              <div className="dashboard-card">
                <h3>Delivered</h3>
                <p className="large-number">
                  {loading ? '...' : parcels.filter(p => p.status === 'Delivered').length}
                </p>
              </div>
            </div>

            <div className="dashboard-charts">
              {/* In a real app, we would add charts here */}
              <div className="chart-placeholder">
                <h3>Parcel Volume Over Time</h3>
                <div className="chart-area">
                  <p>Charts would be displayed here in a real application</p>
                </div>
              </div>
            </div>

            <div className="recent-alerts">
              <h3>Recent Tampering Alerts</h3>
              {tamperAlerts.length === 0 ? (
                <p>No tampering alerts detected.</p>
              ) : (
                <table className="alerts-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Tracking ID</th>
                      <th>Alert Type</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tamperAlerts
                      .slice(0, 5)
                      .map(alert => (
                        <tr key={alert.id} className={alert.resolved ? 'resolved' : ''}>
                          <td>{new Date(alert.timestamp).toLocaleString()}</td>
                          <td>{alert.parcelTrackingId}</td>
                          <td>{alert.alertType}</td>
                          <td>{alert.location}</td>
                          <td>{alert.resolved ? 'Resolved' : 'Open'}</td>
                          <td>
                            {!alert.resolved && (
                              <button
                                className="small-button"
                                onClick={() => handleResolveTamperAlert(alert.parcelId, alert.id)}
                              >
                                Resolve
                              </button>
                            )}
                            <button
                              className="small-button"
                              onClick={() => navigate(`/parcels/${alert.parcelTrackingId}`)}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'parcels' && (
          <div className="parcels-list">
            <div className="filter-controls">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search by tracking ID or recipient"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>

              <div className="filter-select">
                <select value={filterStatus} onChange={handleFilterChange}>
                  <option value="all">All Statuses</option>
                  <option value="Created">Created</option>
                  <option value="In_Transit">In Transit</option>
                  <option value="Out_for_Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              <div className="date-range">
                <input
                  type="date"
                  name="from"
                  value={dateRange.from}
                  onChange={handleDateRangeChange}
                  placeholder="From Date"
                />
                <input
                  type="date"
                  name="to"
                  value={dateRange.to}
                  onChange={handleDateRangeChange}
                  placeholder="To Date"
                />
              </div>
            </div>

            {loading ? (
              <p>Loading parcels...</p>
            ) : filteredParcels().length === 0 ? (
              <p>No parcels found matching the criteria.</p>
            ) : (
              <table className="parcels-table full-width">
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Sender</th>
                    <th>Recipient</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th>Tampering</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParcels().map(parcel => (
                    <tr key={parcel.id} className={parcel.tamperingFlag ? 'tampering-alert' : ''}>
                      <td>{parcel.trackingId}</td>
                      <td>{parcel.senderName}</td>
                      <td>{parcel.recipientName}</td>
                      <td>
                        <span className={`status-badge ${parcel.status.toLowerCase()}`}>
                          {parcel.status}
                        </span>
                      </td>
                      <td>{new Date(parcel.createdAt).toLocaleDateString()}</td>
                      <td>{parcel.updatedAt ? new Date(parcel.updatedAt).toLocaleDateString() : '-'}</td>
                      <td>
                        {parcel.tamperingFlag ?
                          <span className="warning-badge">Alert</span> :
                          <span className="success-badge">Clear</span>}
                      </td>
                      <td>
                        <button
                          className="small-button"
                          onClick={() => navigate(`/parcels/${parcel.trackingId}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-list">
            <h2>Manage Users</h2>

            {loading ? (
              <p>Loading users...</p>
            ) : users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Address</th>
                    <th>Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                        >
                          <option value="sender">Sender</option>
                          <option value="handler">Handler</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>{user.address}</td>
                      <td>{user.phoneNumber}</td>
                      <td>
                        <button className="small-button">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-list">
            <h2>Tampering Alerts</h2>

            {loading ? (
              <p>Loading alerts...</p>
            ) : tamperAlerts.length === 0 ? (
              <p>No tampering alerts found.</p>
            ) : (
              <table className="alerts-table full-width">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Tracking ID</th>
                    <th>Handler</th>
                    <th>Alert Type</th>
                    <th>Description</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tamperAlerts.map(alert => (
                    <tr key={alert.id} className={alert.resolved ? 'resolved' : ''}>
                      <td>{new Date(alert.timestamp).toLocaleString()}</td>
                      <td>{alert.parcelTrackingId}</td>
                      <td>{alert.handlerName}</td>
                      <td>{alert.alertType}</td>
                      <td>{alert.description}</td>
                      <td>{alert.location}</td>
                      <td>{alert.resolved ? 'Resolved' : 'Open'}</td>
                      <td>
                        {!alert.resolved && (
                          <button
                            className="small-button"
                            onClick={() => handleResolveTamperAlert(alert.parcelId, alert.id)}
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          className="small-button"
                          onClick={() => navigate(`/parcels/${alert.parcelTrackingId}`)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
