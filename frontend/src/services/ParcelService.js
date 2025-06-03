import axios from 'axios';

const API_URL = "http://localhost:8080/api/parcels";

const ParcelService = {
  // Create a new parcel
  createParcel: async (parcelData) => {
    try {
      const response = await axios.post(`${API_URL}/create`, parcelData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Get parcels by sender ID
  getParcelsBySenderId: async (senderId) => {
    try {
      const response = await axios.get(`${API_URL}/user?senderId=${senderId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Get parcels assigned to a handler
  getParcelsByHandlerId: async (handlerId) => {
    try {
      const response = await axios.get(`${API_URL}/handler?handlerId=${handlerId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Get all parcels in the system for handlers to view
  getAllParcelsForHandler: async () => {
    try {
      const response = await axios.get(`${API_URL}/all`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Get a parcel by tracking ID
  getParcelByTracking: async (trackingId) => {
    try {
      const response = await axios.get(`${API_URL}/track?trackingId=${trackingId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Track parcel method - Same as getParcelByTracking but with a more descriptive name
  trackParcel: async (trackingId) => {
    try {
      const response = await axios.get(`${API_URL}/track?trackingId=${trackingId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Update parcel status
  updateParcelStatus: async (trackingId, newStatus, handlerId, location) => {
    try {
      const response = await axios.put(`${API_URL}/status`, {
        trackingId,
        newStatus,
        handlerId,
        location
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Get handler's handover history
  getHandlerHandoverHistory: async (handlerId) => {
    try {
      const response = await axios.get(`${API_URL}/handover-history?handlerId=${handlerId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Verify QR code
  verifyQRCode: async (trackingId, handlerId) => {
    try {
      const response = await axios.post(`${API_URL}/verify-qr`, { trackingId, handlerId });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // For admin: get all parcels
  getAllParcels: async () => {
    try {
      const response = await axios.get(`${API_URL}/all`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Verify delivery OTP
  verifyDeliveryOtp: async (trackingId, otp) => {
    try {
      const response = await axios.post(`${API_URL}/verify-otp`, {
        trackingId,
        otp
      });
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response ? error.response.data.message : "OTP verification failed"
      };
    }
  },
};

export default ParcelService;
