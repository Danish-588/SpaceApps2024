import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ClipLoader } from 'react-spinners';
import { Navbar, Nav, Container, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

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
      const response = await fetch('http://localhost:5000/api/analyze_landsat', {
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
        const errorMessage = await response.text();
        throw new Error(`Failed to fetch satellite data. Status: ${response.status}, Details: ${errorMessage}`);
      }

      const data = await response.json();
      setSatelliteData(data); // Set the data in state for rendering

      // Fetching NASA imagery for the selected coordinates
      const imageryResponse = await fetch('http://localhost:5000/api/fetch_imagery', {
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
        const errorMessage = await imageryResponse.text();
        throw new Error(`Failed to fetch imagery. Status: ${imageryResponse.status}, Details: ${errorMessage}`);
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
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand href="#home">Landsat Analysis Tool</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#analyze">Analyze Data</Nav.Link>
              <Nav.Link href="#reminders">Reminders</Nav.Link>
              <Nav.Link href="#about">About Landsat</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-5">
        <h1 className="mb-4">Landsat Satellite Data Analysis</h1>

        {/* Form for user input */}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Latitude:</Form.Label>
            <Form.Control
              type="number"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              min="-90"
              max="90"
              step="0.000001"
              required
            />
            <Form.Text>Enter a value between -90 and 90, up to 6 decimal places.</Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Longitude:</Form.Label>
            <Form.Control
              type="number"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              min="-180"
              max="180"
              step="0.000001"
              required
            />
            <Form.Text>Enter a value between -180 and 180, up to 6 decimal places.</Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Cloud Cover Threshold (%):</Form.Label>
            <Form.Control
              type="number"
              value={cloudCover}
              onChange={(e) => setCloudCover(e.target.value)}
              min="0"
              max="100"
              required
            />
            <Form.Text>Enter a value between 0 and 100 to set cloud cover threshold.</Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email (optional):</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Form.Text>Enter your email address if you want to receive notifications.</Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Notify Me Before Overpass (Hours):</Form.Label>
            <Form.Control
              type="number"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
              min="0.1"
              step="0.1"
              required
            />
            <Form.Text>Enter the number of hours before the overpass to receive a notification.</Form.Text>
          </Form.Group>

          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <ClipLoader size={24} color={"#ffffff"} /> : 'Analyze and Fetch Imagery'}
          </Button>
        </Form>

        {/* Display the loader if loading */}
        {loading && (
          <div className="loader-container mt-4">
            <ClipLoader size={150} color={"#3498db"} loading={loading} />
          </div>
        )}

        {/* Map Container for selecting latitude and longitude */}
        <div className="map-container mt-4">
          <MapContainer center={[0, 0]} zoom={2} style={{ height: '400px', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            />
            <LocationMarker />
          </MapContainer>
          <small>Click on the map to set latitude and longitude values automatically.</small>
        </div>

        {/* Display any error messages */}
        {error && <p style={{ color: 'red' }} className="mt-4">{error}</p>}

        {/* Display the satellite data if available */}
        {satelliteData && (
          <div className="mt-4">
            <h2>Next Satellite Pass Details</h2>
            <p><strong>Location:</strong> {satelliteData.location}</p>
            <h3>Next Overpasses:</h3>
            {satelliteData.overpass_times.map(overpass => (
              <p key={overpass.satellite}>
                <strong>{overpass.satellite}:</strong> {overpass.next_overpass ? new Date(overpass.next_overpass).toLocaleString() : 'No upcoming overpass.'}
              </p>
            ))}
          </div>
        )}

        {/* Display NASA imagery */}
        {imageryUrl && (
          <div className="mt-4">
            <h2>NASA Imagery</h2>
            <img src={imageryUrl} alt="NASA Satellite Imagery" className="img-fluid mt-3" />
          </div>
        )}
      </Container>
    </div>
  );
}

export default App;
