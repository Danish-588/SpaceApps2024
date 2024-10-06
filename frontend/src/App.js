import React, { useState } from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function Home() {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [cloudCover, setCloudCover] = useState(70);
  const [notificationTime, setNotificationTime] = useState(1);
  const [email, setEmail] = useState('');
  const [satelliteData, setSatelliteData] = useState(null);
  const [imageryUrl, setImageryUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSatelliteData(null);
    setImageryUrl(null);

    try {
      const response = await fetch('/api/analyze_landsat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: `${latitude},${longitude}`,
          cloud_cover: cloudCover,
          date_range: 'latest',
          email: email.trim() ? email : undefined,
          notification_time: notificationTime,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch satellite data. Please try again.');
      }

      const data = await response.json();
      setSatelliteData(data);

      const imageryResponse = await fetch('/api/fetch_imagery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: latitude,
          lon: longitude,
        }),
      });

      if (!imageryResponse.ok) {
        throw new Error('Failed to fetch imagery. Please try again.');
      }

      const imageryData = await imageryResponse.json();
      setImageryUrl(imageryData.imageUrl);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        let lat = e.latlng.lat.toFixed(6);
        let lon = e.latlng.lng.toFixed(6);

        if (lat < -90) lat = -90;
        if (lat > 90) lat = 90;
        if (lon < -180) lon = -180;
        if (lon > 180) lon = 180;

        setLatitude(lat);
        setLongitude(lon);
      },
    });

    return latitude && longitude ? (
      <Marker position={[latitude, longitude]}></Marker>
    ) : null;
  };

  return (
    <div className="App-content">
      <h1>Landsat Analysis Tool</h1>
      <p>Analyze Landsat satellite data and receive notifications for upcoming satellite passes.</p>

      <div className="flex-container">
        <form onSubmit={handleSubmit} className="input-form" style={{ marginRight: '20px', flexGrow: '1' }}>
          <div className="form-group">
            <label>Latitude:</label>
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
          <div className="form-group">
            <label>Longitude:</label>
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
          <div className="form-group">
            <label>Cloud Cover Threshold (%):</label>
            <input
              type="number"
              value={cloudCover}
              onChange={(e) => setCloudCover(e.target.value)}
              min="0"
              max="100"
              required
            />
            <small>Enter a value between 0 and 100 to set the cloud cover threshold.</small>
          </div>
          <div className="form-group">
            <label>Email (optional):</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <small>Enter your email address to receive notifications.</small>
          </div>
          <div className="form-group">
            <label>Notify Me Before Overpass (Hours):</label>
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

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Loading...' : 'Analyze and Fetch Imagery'}
          </button>
        </form>

        <div className="map-container" style={{ height: '50vh', width: '45%', flexGrow: '2' }}>
          <MapContainer
            center={[0, 0]}
            zoom={2}
            minZoom={2}
            maxBounds={[
              [-90, -180],
              [90, 180],
            ]}
            maxBoundsViscosity={1.0}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png?api_key=STADIA_API_KEY"
              attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker />
          </MapContainer>
          <small>Click on the map to set latitude and longitude values automatically.</small>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {satelliteData && (
  <div className="satellite-data">
    <h2>Next Satellite Pass Details</h2>
    <p><strong>Location:</strong> {satelliteData.location}</p>
    <h3>Next Overpasses:</h3>
    {satelliteData.overpass_times.length > 0 ? (
      satelliteData.overpass_times.map((overpass, index) => (
        <div key={index} className="overpass-details">
          <p>
            <strong>Satellite:</strong> {overpass.satellite}
          </p>
          <p>
            <strong>Next Overpass:</strong>{' '}
            {overpass.next_overpass
              ? new Date(overpass.next_overpass).toLocaleString()
              : 'No upcoming overpass.'}
          </p>
        </div>
      ))
    ) : (
      <p>No upcoming overpasses found for the selected location.</p>
    )}

    {/* Surface Reflectance Data Section */}
    <h3>Surface Reflectance Data</h3>
    {satelliteData.reflectance_data && Object.keys(satelliteData.reflectance_data).length > 0 ? (
      <ul>
        {Object.entries(satelliteData.reflectance_data).map(([band, url]) => (
          <li key={band}>
            <strong>{band}:</strong>{' '}
            <a href={url} target="_blank" rel="noopener noreferrer">
              Download {band} Band
            </a>
          </li>
        ))}
      </ul>
    ) : (
      <p>No surface reflectance data available for download.</p>
    )}
  </div>
)}


      {imageryUrl && (
        <div className="nasa-imagery">
          <h2>NASA Imagery</h2>
          <img src={imageryUrl} alt="NASA Satellite Imagery" style={{ maxWidth: '100%', marginTop: '20px' }} />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Navbar.Brand href="/">Landsat Analysis Tool</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="/">Home</Nav.Link>
            <Nav.Link href="/landsat-info">Landsat Info</Nav.Link>
            <Nav.Link href="/reminders">Reminders</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      <Routes>
        <Route path="/" element={<Home />} />
        {/* Add other routes as necessary */}
      </Routes>
    </Router>
  );
}

export default App;
