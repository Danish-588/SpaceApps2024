import React, { useState } from 'react';
import { getSatellitePassDetails } from '../services/satelliteService';

function SatellitePassDetails() {
  const [data, setData] = useState(null);

  const fetchPassDetails = async () => {
    try {
      const lat = 40.7128; // Example latitude (New York)
      const lon = -74.0060; // Example longitude (New York)
      const result = await getSatellitePassDetails(lat, lon);
      setData(result);
    } catch (error) {
      console.error('Error fetching satellite pass details:', error);
    }
  };

  return (
    <div>
      <button onClick={fetchPassDetails}>Get Satellite Pass Details</button>
      {data && <div>Next Pass: {data.nextPass}</div>}
    </div>
  );
}

export default SatellitePassDetails;
