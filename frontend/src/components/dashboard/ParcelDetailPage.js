import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthService from '../../services/AuthService';
import ParcelService from '../../services/ParcelService';
import './Dashboard.css';

const ParcelDetailPage = () => {
  const { trackingId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [parcel, setParcel] = useState(null);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const [statusForm, setStatusForm] = useState({
    trackingId: '',
    newStatus: '',
    location: ''
  });

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);

    if (!user) {
      navigate('/login');
      return;
    }

    loadParcelDetails();
  }, [navigate, trackingId]);

  const loadParcelDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const parcelData = await ParcelService.getParcelByTracking(trackingId);
      setParcel(parcelData);
      setStatusForm({
        trackingId: parcelData.trackingId,
        newStatus: parcelData.status,
        location: ''
      });
    } catch (err) {
      console.error('Failed to load parcel details:', err);
      setError('Failed to load parcel details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFormChange = (e) => {
    const { name, value } = e.target;
    setStatusForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();

    if (!statusForm.newStatus) {
      setError('New status is required.');
      return;
    }

    try {
      setUpdateLoading(true);
      setError('');

      await ParcelService.updateParcelStatus(
        trackingId,
        statusForm.newStatus,
        currentUser.id,
        statusForm.location || 'Not specified'
      );

      setStatusUpdateSuccess(`Parcel status updated to ${statusForm.newStatus} successfully!`);
      setTimeout(() => setStatusUpdateSuccess(''), 3000);

      // Reload parcel details
      loadParcelDetails();
    } catch (err) {
      setError('Failed to update parcel status: ' + (err.message || 'Unknown error'));
    } finally {
      setUpdateLoading(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-content">
          <h2>Loading parcel details...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Parcel Details</h1>
        <div className="user-info">
          {currentUser && <span>Handler: {currentUser.name}</span>}
          <button onClick={goBack} className="back-btn">Back</button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}
      {statusUpdateSuccess && <div className="success-message">{statusUpdateSuccess}</div>}

      <div className="dashboard-content">
        {parcel ? (
          <div className="parcel-details-container">
            <div className="parcel-info">
              <h2>Tracking ID: {parcel.trackingId}</h2>

              <div className="detail-row">
                <div className="detail-item">
                  <strong>Status:</strong>
                  <span className={`status-badge status-${parcel.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {parcel.status}
                  </span>
                </div>
                <div className="detail-item">
                  <strong>Created:</strong> {parcel.createdAt}
                </div>
                <div className="detail-item">
                  <strong>Last Updated:</strong> {parcel.updatedAt}
                </div>
              </div>

              <div className="detail-section">
                <h3>Sender Information</h3>
                <p><strong>Sender:</strong> {parcel.senderName}</p>
                <p><strong>Origin:</strong> {parcel.originAddress}</p>
              </div>

              <div className="detail-section">
                <h3>Recipient Information</h3>
                <p><strong>Recipient:</strong> {parcel.recipientName}</p>
                <p><strong>Destination:</strong> {parcel.destinationAddress}</p>
              </div>

              <div className="detail-section">
                <h3>Parcel Information</h3>
                <p><strong>Weight:</strong> {parcel.weight} kg</p>
                <p><strong>Dimensions:</strong> {parcel.dimensions}</p>
                <p><strong>Description:</strong> {parcel.description || 'No description provided'}</p>
              </div>
            </div>

            {currentUser && currentUser.role === 'handler' && (
              <div className="update-status-form">
                <h3>Update Parcel Status</h3>
                <form onSubmit={handleUpdateStatus}>
                  <div className="form-group">
                    <label htmlFor="newStatus">New Status:</label>
                    <select
                      id="newStatus"
                      name="newStatus"
                      value={statusForm.newStatus}
                      onChange={handleStatusFormChange}
                      required
                    >
                      <option value="Created">Created</option>
                      <option value="Picked Up">Picked Up</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Returned">Returned</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Current Location:</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={statusForm.location}
                      onChange={handleStatusFormChange}
                      placeholder="e.g., Warehouse 3, New York"
                    />
                  </div>

                  <button type="submit" className="update-btn" disabled={updateLoading}>
                    {updateLoading ? 'Updating...' : 'Update Status'}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="no-data">
            <h2>Parcel not found</h2>
            <p>The requested parcel with tracking ID {trackingId} could not be found.</p>
            <button onClick={goBack} className="action-btn">Go Back</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParcelDetailPage;
