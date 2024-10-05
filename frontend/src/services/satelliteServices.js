export const getSatellitePassDetails = async (lat, lon) => {
    try {
      // Ensure the backend URL is correct. If running locally, use 'http://localhost:5000'.
      const response = await fetch(`http://localhost:5000/api/satellite-pass?lat=${lat}&lon=${lon}`);
      if (!response.ok) {
        throw new Error('Failed to fetch satellite pass data');
      }
      return await response.json(); // Return the JSON response
    } catch (error) {
      console.error('Error in getSatellitePassDetails:', error);
      throw error; // Re-throw the error to be handled in the calling function
    }
  };
  