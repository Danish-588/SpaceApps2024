import React, { useState } from 'react';
import './App.css';

function App() {
  // State variables for input fields
  const [location, setLocation] = useState('');
  const [cloudCover, setCloudCover] = useState(15);
  const [dateRange, setDateRange] = useState('latest');

  // State variables for the API response and error handling
  const [satelliteData, setSatelliteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to handle form submission and make API request
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setLoading(true);
    setError(null);
    setSatelliteData(null);
  
    try {
      // Making a POST request to the backend using fetch
      const response = await fetch('http://localhost:5000/analyze_landsat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location,
          cloud_cover: cloudCover,
          date_range: dateRange
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch satellite data. Please try again.');
      }
  
      const data = await response.json();
      setSatelliteData(data); // Set the data in state for rendering
    } catch (err) {
      console.error('Error fetching satellite data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Landsat Analysis Tool</h1>

        {/* Form for user input */}
        <form onSubmit={handleSubmit}>
          <div>
            <label>Location (Latitude, Longitude or Address): </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Cloud Cover Threshold (%): </label>
            <input
              type="number"
              value={cloudCover}
              onChange={(e) => setCloudCover(e.target.value)}
              min="0"
              max="100"
              required
            />
          </div>
          <div>
            <label>Date Range (e.g., "YYYY-MM-DD to YYYY-MM-DD" or "latest"): </label>
            <input
              type="text"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Analyze Landsat Data'}
          </button>
        </form>

        {/* Display any error messages */}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {/* Display the satellite data if available */}
        {satelliteData && (
          <div>
            <h2>Satellite Pass Details</h2>
            <p><strong>Location:</strong> {satelliteData.location}</p>
            <p><strong>Next Overpass:</strong> Lat: {satelliteData.next_overpass.lat}, Lon: {satelliteData.next_overpass.lon}</p>
            <h3>Scene Metadata</h3>
            <p><strong>Acquisition Date:</strong> {satelliteData.scene_metadata.acquisition_date}</p>
            <p><strong>Cloud Cover:</strong> {satelliteData.scene_metadata.cloud_cover}%</p>
            <p><strong>Satellite:</strong> {satelliteData.scene_metadata.satellite}</p>
            <p><strong>Path:</strong> {satelliteData.scene_metadata.path}</p>
            <p><strong>Row:</strong> {satelliteData.scene_metadata.row}</p>
            <h3>Surface Reflectance Data</h3>
            <ul>
              {Object.entries(satelliteData.reflectance_data).map(([band, url]) => (
                <li key={band}>
                  <strong>{band}:</strong> <a href={url} target="_blank" rel="noopener noreferrer">Download</a>
                </li>
              ))}
            </ul>
          </div>
        )}

      </header>
    </div>
  );
}

export default App;
