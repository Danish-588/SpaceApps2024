import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

function App() {
  // State variables for input fields
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [cloudCover, setCloudCover] = useState(70);
  const [notificationTime, setNotificationTime] = useState(1); // Time in hours before overpass
  const [email, setEmail] = useState(''); // State to store user email

  // State variables for the API response and error handling
  const [satelliteData, setSatelliteData] = useState(null);
  const [imageryUrl, setImageryUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to handle form submission and make API requests
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSatelliteData(null);
    setImageryUrl(null);

    try {
      // Making a POST request to the backend using fetch for Landsat data analysis
      const response = await fetch(/api/analyze_landsat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location: `${latitude},${longitude}`,
          cloud_cover: cloudCover,
          date_range: 'latest',
          email: email.trim() ? email : undefined,
          notification_time: notificationTime
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch satellite data. Please try again.');
      }

      const data = await response.json();
      setSatelliteData(data); // Set the data in state for rendering

      // Set up a browser notification if next overpass is available
      if (data.overpass_times) {
        data.overpass_times.forEach(overpass => {
          if (overpass.next_overpass) {
            scheduleNotification(overpass.next_overpass, notificationTime, overpass.satellite);
          }
        });
      }

      // Fetching NASA imagery for the selected coordinates
      const imageryResponse = await fetch(/api/fetch_imagery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lat: latitude,
          lon: longitude
        })
      });

      if (!imageryResponse.ok) {
        throw new Error('Failed to fetch imagery. Please try again.');
      }

      const imageryData = await imageryResponse.json();
      setImageryUrl(imageryData.imageUrl); // Set the imagery URL for rendering
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to schedule a notification (browser alert)
  const scheduleNotification = (nextOverpass, hoursBefore, satelliteName) => {
    const overpassDate = new Date(nextOverpass);
    const notificationTime = new Date(overpassDate.getTime() - hoursBefore * 60 * 60 * 1000);
    const timeDifference = notificationTime.getTime() - new Date().getTime();

    if (timeDifference > 0) {
      setTimeout(() => {
        alert(`The ${satelliteName} satellite will pass over your location in ${hoursBefore} hour(s)!`);
      }, timeDifference);
    }
  };

  // Custom Map component to update latitude and longitude
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setLatitude(e.latlng.lat.toFixed(6));
        setLongitude(e.latlng.lng.toFixed(6));
      },
    });

    return latitude && longitude ? (
      <Marker position={[latitude, longitude]}></Marker>
    ) : null;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Landsat Analysis Tool</h1>

        {/* Form for user input */}
        <form onSubmit={handleSubmit}>
          <div>
            <label>Latitude: </label>
            <input
              type="number"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              min="-90"
              max="90"
              step="0.000001"
              required
            />
            <small>Enter a value between -90 and 90, up to 6 decimal places.</small>
          </div>
          <div>
            <label>Longitude: </label>
            <input
              type="number"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              min="-180"
              max="180"
              step="0.000001"
              required
            />
            <small>Enter a value between -180 and 180, up to 6 decimal places.</small>
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
            <small>Enter a value between 0 and 100 to set cloud cover threshold.</small>
          </div>
          <div>
            <label>Email (optional): </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <small>Enter your email address if you want to receive notifications.</small>
          </div>
          <div>
            <label>Notify Me Before Overpass (Hours): </label>
            <input
              type="number"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
              min="0.1"
              step="0.1"
              required
            />
            <small>Enter the number of hours before the overpass to receive a notification.</small>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Analyze and Fetch Imagery'}
          </button>
        </form>

        {/* Map Container for selecting latitude and longitude */}
        <div className="map-container" style={{ height: '400px', width: '100%', margin: '20px 0' }}>
          <MapContainer center={[0, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
            <LocationMarker />
          </MapContainer>
          <small>Click on the map to set latitude and longitude values automatically.</small>
        </div>

        {/* Display any error messages */}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {/* Display the satellite data if available */}
        {satelliteData && (
          <div>
            <h2>Next Satellite Pass Details</h2>
            <p><strong>Location:</strong> {satelliteData.location}</p>
            <h3>Next Overpasses:</h3>
            {satelliteData.overpass_times.map(overpass => (
              <p key={overpass.satellite}>
                <strong>{overpass.satellite}:</strong> {overpass.next_overpass ? new Date(overpass.next_overpass).toLocaleString() : 'No upcoming overpass.'}
              </p>
            ))}
            {satelliteData.scene_metadata && (
              <>
                <h3>Scene Metadata</h3>
                <p><strong>Acquisition Date:</strong> {new Date(satelliteData.scene_metadata.acquisition_date).toLocaleString()}</p>
                <p><strong>Cloud Cover:</strong> {satelliteData.scene_metadata.cloud_cover}%</p>
                <p><strong>Satellite:</strong> {satelliteData.scene_metadata.satellite}</p>
                <p><strong>Path:</strong> {satelliteData.scene_metadata.path}</p>
                <p><strong>Row:</strong> {satelliteData.scene_metadata.row}</p>
              </>
            )}
            <h3>Surface Reflectance Data</h3>
            <p>
              Note: To download the reflectance data, you need to create an account and log in at <a href="https://ers.cr.usgs.gov" target="_blank" rel="noopener noreferrer">USGS Earth Resources Observation and Science (EROS)</a>.
            </p>
            {satelliteData.reflectance_data ? (
              <ul>
                {Object.entries(satelliteData.reflectance_data).map(([band, url]) => (
                  <li key={band}>
                    <strong>{band}:</strong>
                    <a href={url} target="_blank" rel="noopener noreferrer" download>
                      Download {band} Band
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No reflectance data available.</p>
            )}
          </div>
        )}

        {/* Display NASA imagery */}
        {imageryUrl && (
          <div>
            <h2>NASA Imagery</h2>
            <img src={imageryUrl} alt="NASA Satellite Imagery" style={{ maxWidth: '100%', marginTop: '20px' }} />
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
