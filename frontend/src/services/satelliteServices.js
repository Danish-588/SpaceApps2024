import axios from 'axios';

export const getSatellitePassDetails = async (lat, lon) => {
  try {
    const response = await axios.get(`/api/satellite-pass?lat=${lat}&lon=${lon}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
