export const getSatellitePassDetails = async (lat, lon) => {
    try {
      const response = await fetch(`/api/satellite-pass?lat=${lat}&lon=${lon}`);
      if (!response.ok) {
        throw new Error('Failed to fetch satellite pass data');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  };
  