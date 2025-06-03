import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/AuthService';
import ParcelService from '../../services/ParcelService';
import './Dashboard.css';

const SenderDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [trackingError, setTrackingError] = useState('');
  const navigate = useNavigate();

  // For creating a new parcel
  const [parcelForm, setParcelForm] = useState({
    recipientName: '',
    destinationAddress: '',
    weight: '',
    description: ''
  });

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);

    // Redirect if not logged in or not a sender
    if (!user) {
      navigate('/login');
      return;
    } else if (user.role !== 'sender') {
      // If user is not a sender, redirect them to appropriate dashboard
      if (user.role === 'handler') {
        navigate('/handler-dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/login');
      }
      return;
    }

    // Load sender's parcels
    loadParcels(user.id);
  }, [navigate]);

  const loadParcels = async (senderId) => {
    try {
      setLoading(true);
      setError('');
      console.log("Loading parcels for sender:", senderId);
      const data = await ParcelService.getParcelsBySenderId(senderId);
      console.log("Parcels loaded:", data);
      setParcels(data);
    } catch (err) {
      console.error("Error loading parcels:", err);
      setError('Failed to load parcels. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle refreshing parcels to see latest status updates
  const handleRefreshParcels = async () => {
    if (!currentUser) return;

    try {
      setRefreshing(true);
      const data = await ParcelService.getParcelsBySenderId(currentUser.id);
      setParcels(data);
    } catch (err) {
      console.error("Error refreshing parcels:", err);
      setError('Failed to refresh parcels. Please try again later.');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    AuthService.logout();
    navigate('/');
  };

  // Handle parcel form input changes
  const handleParcelInputChange = (e) => {
    const { name, value } = e.target;
    setParcelForm({
      ...parcelForm,
      [name]: value
    });
  };

  // Handle parcel form submission
  const handleCreateParcel = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);

      // Validate form
      if (!parcelForm.recipientName || !parcelForm.destinationAddress ||
          !parcelForm.weight || !parcelForm.description) {
        setError('All fields are required');
        setLoading(false);
        return;
      }

      // Format the weight as a number
      const formattedData = {
        ...parcelForm,
        weight: parseFloat(parcelForm.weight),
        senderId: currentUser.id
      };

      // Create parcel
      const response = await ParcelService.createParcel(formattedData);

      // Clear form and reload parcels
      setParcelForm({
        recipientName: '',
        destinationAddress: '',
        weight: '',
        description: ''
      });

      // Switch back to dashboard tab and reload parcels
      setActiveTab('dashboard');
      loadParcels(currentUser.id);

    } catch (err) {
      setError('Failed to create parcel: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Handle tracking a parcel
  const handleTrackParcel = async (e) => {
    e.preventDefault();
    setTrackingError('');
    setTrackingResult(null);

    if (!trackingId) {
      setTrackingError('Please enter a tracking ID');
      return;
    }

    try {
      setLoading(true);
      const result = await ParcelService.trackParcel(trackingId);
      setTrackingResult(result);
    } catch (err) {
      setTrackingError('Failed to track parcel: ' + (err.message || 'Parcel not found'));
    } finally {
      setLoading(false);
    }
  };

  // Get CSS class for status badge
  const getStatusClass = (status) => {
    status = status.toLowerCase().replace(/\s+/g, '-');
    return `status-badge status-${status}`;
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Sender Dashboard</h1>
        <div className="user-info">
          {currentUser && (
            <span>Welcome, {currentUser.name}</span>
          )}
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          My Parcels
        </button>
        <button
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => setActiveTab('create')}
        >
          Create New Parcel
        </button>
        <button
          className={activeTab === 'track' ? 'active' : ''}
          onClick={() => setActiveTab('track')}
        >
          Track a Parcel
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Dashboard Tab Content */}
      {activeTab === 'dashboard' && (
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h2>My Parcels</h2>
            <button
              onClick={handleRefreshParcels}
              className="refresh-btn"
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading parcels...</div>
          ) : parcels.length > 0 ? (
            <div className="parcels-container">
              <table className="parcels-table">
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Recipient</th>
                    <th>Destination</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Updated At</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {parcels.map(parcel => (
                    <tr key={parcel.trackingId}>
                      <td>{parcel.trackingId}</td>
                      <td>{parcel.recipientName}</td>
                      <td>{parcel.destinationAddress}</td>
                      <td>
                        <span className={getStatusClass(parcel.status)}>
                          {parcel.status}
                        </span>
                      </td>
                      <td>{parcel.createdAt}</td>
                      <td>{parcel.updatedAt}</td>
                      <td>
                        <button
                          onClick={() => {
                            setTrackingId(parcel.trackingId);
                            setActiveTab('track');
                            handleTrackParcel({ preventDefault: () => {} });
                          }}
                          className="action-btn"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-parcels">
              <p>You don't have any parcels yet.</p>
              <button
                onClick={() => setActiveTab('create')}
                className="action-btn"
              >
                Create Your First Parcel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Parcel Tab Content */}
      {activeTab === 'create' && (
        <div className="dashboard-content">
          <h2>Create New Parcel</h2>

          <form onSubmit={handleCreateParcel} className="create-parcel-form">
            <div className="form-group">
              <label htmlFor="recipientName">Recipient Name:</label>
              <input
                type="text"
                id="recipientName"
                name="recipientName"
                value={parcelForm.recipientName}
                onChange={handleParcelInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="destinationAddress">Destination Address:</label>
              <textarea
                id="destinationAddress"
                name="destinationAddress"
                value={parcelForm.destinationAddress}
                onChange={handleParcelInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="weight">Weight (kg):</label>
              <input
                type="number"
                id="weight"
                name="weight"
                step="0.01"
                min="0.01"
                value={parcelForm.weight}
                onChange={handleParcelInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                name="description"
                value={parcelForm.description}
                onChange={handleParcelInputChange}
                required
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Parcel'}
            </button>
          </form>
        </div>
      )}

      {/* Track Parcel Tab Content */}
      {activeTab === 'track' && (
        <div className="dashboard-content">
          <h2>Track a Parcel</h2>

          <form onSubmit={handleTrackParcel} className="track-form">
            <div className="form-group">
              <label htmlFor="trackingId">Tracking ID:</label>
              <input
                type="text"
                id="trackingId"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter tracking ID (e.g., TRK-12345678)"
                required
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Tracking...' : 'Track Parcel'}
            </button>
          </form>

          {trackingError && (
            <div className="error-message">{trackingError}</div>
          )}

          {trackingResult && (
            <div className="tracking-result">
              <h3>Tracking Information</h3>
              <div className="tracking-details">
                <div className="tracking-header">
                  <span className={getStatusClass(trackingResult.status)}>
                    {trackingResult.status}
                  </span>
                </div>

                <div className="parcel-info">
                  <div className="info-item">
                    <span className="label">Tracking ID:</span>
                    <span className="value">{trackingResult.trackingId}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Recipient:</span>
                    <span className="value">{trackingResult.recipientName}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Destination:</span>
                    <span className="value">{trackingResult.destinationAddress}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Weight:</span>
                    <span className="value">{trackingResult.weight} kg</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Description:</span>
                    <span className="value">{trackingResult.description}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Created:</span>
                    <span className="value">{trackingResult.createdAt}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Last Updated:</span>
                    <span className="value">{trackingResult.updatedAt}</span>
                  </div>
                </div>
              </div>

              {/* Optional: Display tracking history/timeline if available */}
              {trackingResult.trackingHistory && trackingResult.trackingHistory.length > 0 && (
                <div className="tracking-timeline">
                  <h4>Tracking History</h4>
                  <ul className="timeline">
                    {trackingResult.trackingHistory.map((event, index) => (
                      <li key={index} className="timeline-item">
                        <div className="timeline-date">{event.timestamp}</div>
                        <div className="timeline-status">{event.status}</div>
                        <div className="timeline-location">{event.location}</div>
                        {event.notes && <div className="timeline-notes">{event.notes}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SenderDashboard;
