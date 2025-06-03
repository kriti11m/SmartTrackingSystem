import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/AuthService';
import ParcelService from '../../services/ParcelService';
import './Dashboard.css';

const CreateParcel = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const [formData, setFormData] = useState({
    recipientName: '',
    destinationAddress: '',
    weight: '',
    description: ''
  });

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);

    // Check if user is logged in and is a sender
    if (!user || user.role !== 'sender') {
      navigate('/login');
    }
  }, [navigate]);

  // If still checking auth or not authenticated, don't render the form
  if (!currentUser) {
    return <div className="dashboard-container">Loading...</div>;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form data
      if (!formData.recipientName || !formData.destinationAddress || !formData.weight || !formData.description) {
        setError('All fields are required');
        setLoading(false);
        return;
      }

      // Create parcel object
      const parcelData = {
        ...formData,
        senderId: currentUser.id,
        weight: parseFloat(formData.weight)
      };

      // Send to backend
      const response = await ParcelService.createParcel(parcelData);

      // Navigate to the parcel details page
      navigate(`/parcels/${response.trackingId}`, { state: { success: true } });
    } catch (err) {
      console.error('Error creating parcel:', err);
      setError(err.message || 'Failed to create parcel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/sender-dashboard');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <div className="dashboard-logo">
          <h2>Smart Tracking</h2>
        </div>
        <div className="dashboard-menu">
          <button onClick={() => navigate('/sender-dashboard')}>Dashboard</button>
          <button onClick={() => navigate('/sender-dashboard')}>My Parcels</button>
          <button onClick={() => {
            AuthService.logout();
            navigate('/');
          }}>Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Create New Parcel</h1>
        </div>

        <div className="form-container">
          <h2 className="form-title">Parcel Information</h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="recipientName">Recipient Name</label>
              <input
                type="text"
                id="recipientName"
                name="recipientName"
                className="form-control"
                value={formData.recipientName}
                onChange={handleChange}
                placeholder="Enter recipient's full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="destinationAddress">Destination Address</label>
              <input
                type="text"
                id="destinationAddress"
                name="destinationAddress"
                className="form-control"
                value={formData.destinationAddress}
                onChange={handleChange}
                placeholder="Enter delivery address"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="weight">Weight (kg)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                step="0.01"
                min="0.01"
                className="form-control"
                value={formData.weight}
                onChange={handleChange}
                placeholder="Enter parcel weight"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the contents of your parcel"
                rows="4"
                required
              ></textarea>
            </div>

            <div className="form-buttons">
              <button
                type="button"
                className="action-button"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="action-button create-button"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Parcel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateParcel;
