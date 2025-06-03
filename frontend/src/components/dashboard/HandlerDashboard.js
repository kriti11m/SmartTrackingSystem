import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/AuthService';
import ParcelService from '../../services/ParcelService';
import QRCode from 'react-qr-code';
import './Dashboard.css';

const HandlerDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [parcels, setParcels] = useState([]);
  const [handoverHistory, setHandoverHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parcelError, setParcelError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [scanningMode, setScanningMode] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');

  const [statusForm, setStatusForm] = useState({
    trackingId: '',
    newStatus: '',
    location: ''
  });

  const [handoverForm, setHandoverForm] = useState({
    trackingId: '',
    toHandlerId: '',
    location: '',
    notes: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);

    if (!user || user.role !== 'handler') {
      navigate('/login');
      return;
    }

    loadAllParcels(user.id);
  }, [navigate]);

  const loadAllParcels = async (handlerId) => {
    setLoading(true);
    setParcelError('');
    setHistoryError('');

    try {
      const data = await ParcelService.getAllParcels();
      setParcels(data);
    } catch (err) {
      console.error('Parcel load failed:', err);
      setParcelError('Failed to load parcels. Please try again later.');
    }

    try {
      const history = await ParcelService.getHandlerHandoverHistory(handlerId);
      setHandoverHistory(history);
    } catch (err) {
      console.error('Handover history load failed:', err);
      setHistoryError('Failed to load handover history. Please try again later.');
    }

    setLoading(false);
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate('/');
  };

  const startScanning = () => {
    setScanningMode(true);
    setScanResult(null);
  };

  const handleScanComplete = async (result) => {
    try {
      const trackingId = result;
      const verificationResult = await ParcelService.verifyQRCode(trackingId, currentUser.id);

      if (verificationResult.valid) {
        const parcel = await ParcelService.getParcelByTracking(trackingId);
        setScanResult({
          success: true,
          parcel,
          message: 'Parcel verified successfully'
        });

        setHandoverForm({
          ...handoverForm,
          trackingId,
          location: 'Current Location'
        });
      } else {
        setScanResult({
          success: false,
          message: verificationResult.message
        });
      }
    } catch (err) {
      setScanResult({
        success: false,
        message: 'Error scanning QR code: ' + (err.message || 'Unknown error')
      });
    } finally {
      setScanningMode(false);
    }
  };

  const handleSelectParcel = (parcel) => {
    setSelectedParcel(parcel);
    setStatusForm({
      trackingId: parcel.trackingId,
      newStatus: parcel.status,
      location: ''
    });
  };

  const handleStatusFormChange = (e) => {
    const { name, value } = e.target;
    setStatusForm(prev => ({ ...prev, [name]: value }));

    // When status is changing to "Delivered", OTP will be required
    if (name === 'newStatus' && value === 'Delivered') {
      setOtpRequired(true);
    } else {
      setOtpRequired(false);
    }
  };

  const handleOtpChange = (e) => {
    setOtpValue(e.target.value);
    setOtpError('');
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();

    if (!statusForm.trackingId || !statusForm.newStatus) {
      setParcelError('Tracking ID and new status are required.');
      return;
    }

    // Check if OTP is required for delivery
    if (statusForm.newStatus === 'Delivered') {
      if (!otpValue || otpValue.trim() === '') {
        setOtpError('OTP is required to mark the parcel as delivered.');
        return;
      }

      try {
        setUpdateLoading(true);

        // Verify OTP first
        const otpVerification = await ParcelService.verifyDeliveryOtp(
          statusForm.trackingId,
          otpValue
        );

        if (!otpVerification.success) {
          setOtpError(otpVerification.message || 'Invalid OTP. Please check and try again.');
          setUpdateLoading(false);
          return;
        }

        // OTP verification successful, parcel status already updated to Delivered
        setStatusUpdateSuccess('Delivery confirmed! OTP verified successfully.');

        // Update the UI to reflect the status change
        setParcels(parcels.map(p =>
          p.trackingId === statusForm.trackingId
            ? { ...p, status: 'Delivered' }
            : p
        ));

        // Clear OTP field
        setOtpValue('');
        setOtpRequired(false);

        setUpdateLoading(false);
      } catch (err) {
        console.error('OTP verification failed:', err);
        setOtpError('OTP verification failed. Please try again.');
        setUpdateLoading(false);
      }
    } else {
      // Regular status update (not requiring OTP)
      try {
        setUpdateLoading(true);
        setParcelError('');

        await ParcelService.updateParcelStatus(
            statusForm.trackingId,
            statusForm.newStatus,
            currentUser.id,
            statusForm.location || 'Not specified'
        );

        setParcels(parcels.map(p =>
            p.trackingId === statusForm.trackingId
              ? { ...p, status: statusForm.newStatus }
              : p
        ));

        setStatusUpdateSuccess(`Parcel status updated to ${statusForm.newStatus} successfully.`);

        if (statusForm.newStatus === 'Out for Delivery') {
          setStatusUpdateSuccess('Parcel status updated to Out for Delivery. An OTP has been sent to the sender for delivery verification.');
        }

        setUpdateLoading(false);
      } catch (err) {
        console.error('Status update failed:', err);
        setParcelError('Status update failed: ' + (err.message || 'Unknown error'));
        setUpdateLoading(false);
      }
    }
  };

  return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Handler Dashboard</h1>
          <div className="user-info">
            {currentUser && <span>Welcome, {currentUser.name}</span>}
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </header>

        <div className="dashboard-tabs">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button className={activeTab === 'scan' ? 'active' : ''} onClick={() => setActiveTab('scan')}>Scan QR</button>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>Handover History</button>
        </div>

        {parcelError && <div className="error-message">{parcelError}</div>}
        {historyError && <div className="error-message">{historyError}</div>}
        {statusUpdateSuccess && <div className="success-message">{statusUpdateSuccess}</div>}

        {activeTab === 'dashboard' && (
            <div className="dashboard-content">
              <h2>My Parcels</h2>
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
                        <th>Actions</th>
                        <th>QR Code</th>
                      </tr>
                      </thead>
                      <tbody>
                      {parcels.map(parcel => (
                          <tr key={parcel.trackingId}>
                            <td>{parcel.trackingId}</td>
                            <td>{parcel.recipientName}</td>
                            <td>{parcel.destinationAddress}</td>
                            <td>
                        <span className={`status-badge status-${parcel.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {parcel.status}
                        </span>
                            </td>
                            <td>{parcel.createdAt}</td>
                            <td>{parcel.updatedAt}</td>
                            <td>
                              <button onClick={() => handleSelectParcel(parcel)} className="action-btn">
                                Update Status
                              </button>
                            </td>
                            <td>
                              <div className="qr-container">
                                <QRCode
                                  value={`${window.location.origin}/parcel/${parcel.trackingId}`}
                                  size={80}
                                  level="H"
                                  className="parcel-qr"
                                />
                                <button
                                  onClick={() => window.open(`/parcel/${parcel.trackingId}`, '_blank')}
                                  className="view-details-btn"
                                >
                                  View Details
                                </button>
                              </div>
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
              ) : (
                  <div className="no-parcels">No parcels currently assigned to you.</div>
              )}

              {selectedParcel && (
                  <div className="modal">
                    <div className="modal-content">
                      <h3>Update Parcel Status</h3>
                      <p>Tracking ID: {selectedParcel.trackingId}</p>
                      <p>Current Status: {selectedParcel.status}</p>

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
                          <label htmlFor="location">Location (optional):</label>
                          <input
                              type="text"
                              id="location"
                              name="location"
                              value={statusForm.location}
                              onChange={handleStatusFormChange}
                              placeholder="e.g., Warehouse 3, New York"
                          />
                        </div>

                        {otpRequired && (
                          <div className="form-group">
                            <label htmlFor="otpValue">Delivery OTP (from sender):</label>
                            <input
                              type="text"
                              className="form-control"
                              id="otpValue"
                              name="otpValue"
                              value={otpValue}
                              onChange={handleOtpChange}
                              placeholder="Enter the 6-digit OTP provided by the sender"
                              maxLength="6"
                              required
                            />
                            {otpError && <div className="text-danger">{otpError}</div>}
                            <small className="form-text text-muted">
                              The sender has received this OTP via email. Ask them for the code to confirm delivery.
                            </small>
                          </div>
                        )}

                        <div className="form-buttons">
                          <button type="button" onClick={() => setSelectedParcel(null)} className="cancel-btn">Cancel</button>
                          <button type="submit" className="confirm-btn" disabled={updateLoading}>
                            {updateLoading ? 'Updating...' : 'Update Status'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
              )}
            </div>
        )}

        {activeTab === 'scan' && (
            <div className="dashboard-content">
              <h2>Scan Parcel QR Code</h2>
              {!scanningMode ? (
                  <div className="scan-container">
                    <p>Scan a parcel's QR code to verify and update its status.</p>
                    <button onClick={startScanning} className="action-btn">Start Scanning</button>
                  </div>
              ) : (
                  <div className="scan-container">
                    <p>Scanning... Please point camera at QR code.</p>
                    <div className="scan-simulator">
                      <input
                          type="text"
                          placeholder="Enter tracking ID to simulate scan"
                          onChange={(e) => {
                            if (e.target.value.length > 5) {
                              handleScanComplete(e.target.value);
                            }
                          }}
                      />
                    </div>
                    <button onClick={() => setScanningMode(false)} className="cancel-btn">Cancel Scanning</button>
                  </div>
              )}

              {scanResult && (
                  <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`}>
                    <h3>{scanResult.success ? 'Parcel Verified' : 'Verification Failed'}</h3>
                    <p>{scanResult.message}</p>

                    {scanResult.success && scanResult.parcel && (
                        <div className="parcel-details">
                          <p><strong>Tracking ID:</strong> {scanResult.parcel.trackingId}</p>
                          <p><strong>Status:</strong> {scanResult.parcel.status}</p>
                          <p><strong>Recipient:</strong> {scanResult.parcel.recipientName}</p>
                          <p><strong>Destination:</strong> {scanResult.parcel.destinationAddress}</p>
                          <button onClick={() => handleSelectParcel(scanResult.parcel)} className="action-btn">
                            Update Status
                          </button>
                        </div>
                    )}
                  </div>
              )}
            </div>
        )}

        {activeTab === 'history' && (
            <div className="dashboard-content">
              <h2>Handover History</h2>
              {loading ? (
                  <div className="loading">Loading history...</div>
              ) : handoverHistory.length > 0 ? (
                  <div className="history-container">
                    <table className="history-table">
                      <thead>
                      <tr>
                        <th>Tracking ID</th>
                        <th>From Handler</th>
                        <th>To Handler</th>
                        <th>Location</th>
                        <th>Date & Time</th>
                        <th>Notes</th>
                      </tr>
                      </thead>
                      <tbody>
                      {handoverHistory.map((record, index) => (
                          <tr key={index}>
                            <td>{record.parcelId}</td>
                            <td>{record.fromHandlerName}</td>
                            <td>{record.toHandlerName}</td>
                            <td>{record.location}</td>
                            <td>{record.timestamp}</td>
                            <td>{record.notes || 'N/A'}</td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
              ) : (
                  <div className="no-history">No handover history found.</div>
              )}
            </div>
        )}
      </div>
  );
};

export default HandlerDashboard;
