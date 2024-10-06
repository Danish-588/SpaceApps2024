import React, { useState, useEffect } from 'react';
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
  const [landsatImage, setLandsatImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdowns, setCountdowns] = useState({});

  const apiUrl = 'https://api.nasa.gov/planetary/earth/imagery';
  const apiKey = 'b5XzJdVDyPSjA342CgG7fhfWPgAYDW6DFZCw1aeN';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSatelliteData(null);
    setImageryUrl(null);
    setLandsatImage(null);

    try {
      // Making a POST request to the backend using fetch for Landsat data analysis
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

      // Fetching NASA imagery for the selected coordinates
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

      // Fetch Landsat imagery from NASA API
      const apiUrlFull = `${apiUrl}?lon=${longitude}&lat=${latitude}&date=${new Date().toISOString().slice(0, 10)}&cloud_score=True&dim=0.1&api_key=${apiKey}`;
      const landsatResponse = await fetch(apiUrlFull);

      if (!landsatResponse.ok) {
        throw new Error(`Failed to fetch Landsat imagery: ${landsatResponse.status} ${landsatResponse.statusText}`);
      }

      const landsatBlob = await landsatResponse.blob();
      const landsatUrl = URL.createObjectURL(landsatBlob);
      setLandsatImage(landsatUrl);
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

    return latitude && longitude ? <Marker position={[latitude, longitude]}></Marker> : null;
  };

  useEffect(() => {
    if (satelliteData && satelliteData.overpass_times) {
      const updateCountdowns = () => {
        const now = new Date().getTime();
        const newCountdowns = {};

        satelliteData.overpass_times.forEach((overpass, index) => {
          if (overpass.next_overpass) {
            const overpassTime = new Date(overpass.next_overpass).getTime();
            const timeRemaining = overpassTime - now;

            if (timeRemaining > 0) {
              const hoursToOverpass = timeRemaining / (1000 * 60 * 60);
              if (email && notificationTime && hoursToOverpass <= notificationTime) {
                // Notify the backend to send the email reminder
                fetch('/api/send_notification', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email,
                    satellite: overpass.satellite,
                    overpass_time: overpass.next_overpass,
                  }),
                })
                  .then((res) => {
                    if (!res.ok) {
                      throw new Error('Failed to send email notification');
                    }
                  })
                  .catch((err) => console.error('Error sending notification:', err));
              }
  
              const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
              const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  
              newCountdowns[`landsat_${index}`] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            } else {
              newCountdowns[`landsat_${index}`] = 'Currently passing over';
            }
          }
        });

        setCountdowns(newCountdowns);
      };

      const interval = setInterval(updateCountdowns, 1000);
      updateCountdowns(); // Initial call to set countdown immediately

      return () => clearInterval(interval);
    }
  }, [satelliteData]);

  return (
    <div className="App-content">
      <h1>Landsat Analysis Tool</h1>
      <p>Analyze Landsat satellite data and receive notifications for upcoming satellite passes.</p>

      <div className="flex-container">
  <form 
    onSubmit={handleSubmit} 
    className="input-form" 
    style={{ 
      marginRight: '20px', 
      flexGrow: '1', 
      width: '300px', // Set a fixed width for the form
      backgroundColor: 'white', 
      padding: '20px', 
      borderRadius: '5px', 
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' 
    }}
  >
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

<div className="row">
  <div className="col-md-4">
    {/* Form goes here */}
  </div>
  <div className="col-md-8">
    {/* Map goes here */}
  </div>
</div>



<div 
    className="map-container" 
    style={{ 
      height: '65vh', 
      width: 'calc(100% - 340px)', // Adjust width to fill the remaining space
      flexGrow: '2', 
      marginLeft: '20px' // Add some margin to separate form and map
    }}
  >
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
  <div className="row mt-4">
    <div className="col-md-6">
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Satellite Data</h5>
          {satelliteData.overpass_times.map((overpass, index) => (
            <div key={index} className="mb-3">
              <p><strong>Landsat {index + 8} Next Overpass:</strong> {new Date(overpass.next_overpass).toLocaleString()}</p>
              {countdowns[`landsat_${index}`] && (
                <p><strong>Time Remaining Until Overpass:</strong> {countdowns[`landsat_${index}`]}</p>
              )}
            </div>
          ))}
          <p><strong>Cloud Cover:</strong> {cloudCover}%</p>
        </div>
      </div>
    </div>

    <div className="col-md-6">
      {landsatImage && (
        <div className="card">
          <img src={landsatImage} className="card-img-top" alt="Landsat Imagery" />
          <div className="card-body">
            <h5 className="card-title">Landsat Reflectance Data</h5>
          </div>
        </div>
      )}
      {imageryUrl && (
        <div className="card mt-3">
          <img src={imageryUrl} className="card-img-top" alt="NASA Satellite Imagery" />
          <div className="card-body">
            <h5 className="card-title">NASA Imagery</h5>
          </div>
        </div>
      )}
    </div>
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
