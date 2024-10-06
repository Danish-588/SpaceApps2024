import React, { useState } from 'react';
import { Container, Navbar, Nav, Tab, Tabs } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'bootstrap/dist/css/bootstrap.min.css';
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
      const response = await fetch('/api/analyze_landsat', {
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

      // Fetching NASA imagery for the selected coordinates
      const imageryResponse = await fetch('/api/fetch_imagery', {
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

  // Custom Map component to update latitude and longitude
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        let lat = e.latlng.lat.toFixed(6);
        let lon = e.latlng.lng.toFixed(6);

        // Restrict latitude and longitude to their valid ranges
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
    <div className="App">
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="#home">Landsat Analysis Tool</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#home">Home</Nav.Link>
              <Nav.Link href="#landsat-info">Landsat Info</Nav.Link>
              <Nav.Link href="#reminders">Reminders</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        <Tabs defaultActiveKey="home" id="app-tabs" className="mb-3">
          <Tab eventKey="home" title="Home">
            <header className="App-header">
              <h1>Landsat Analysis Tool</h1>
              <p>Analyze Landsat satellite data and receive notifications for upcoming satellite passes.</p>

              {/* Form for user input */}
              <form onSubmit={handleSubmit} className="input-form">
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

              {/* Map Container for selecting latitude and longitude */}
              <div className="map-container">
                <MapContainer
                  center={[0, 0]}
                  zoom={2}
                  minZoom={2}
                  maxBounds={[
                    [-90, -180],
                    [90, 180],
                  ]}
                  maxBoundsViscosity={1.0}
                  style={{ height: '400px', width: '100%' }}
                >
                  <TileLayer
                    url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png?api_key=STADIA_API_KEY"
                    attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <LocationMarker />
                </MapContainer>
                <small>Click on the map to set latitude and longitude values automatically.</small>
              </div>

              {/* Display any error messages */}
              {error && <p className="error-text">{error}</p>}

              {/* Display the satellite data if available */}
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
                </div>
              )}

              {/* Display NASA imagery */}
              {imageryUrl && (
                <div className="nasa-imagery">
                  <h2>NASA Imagery</h2>
                  <img src={imageryUrl} alt="NASA Satellite Imagery" style={{ maxWidth: '100%', marginTop: '20px' }} />
                </div>
              )}
            </header>
          </Tab>
          <Tab eventKey="landsat-info" title="Landsat Info">
            <div className="landsat-info">
              <h2>About Landsat</h2>
              <p>
                The Landsat program is a series of Earth-observing satellite missions jointly managed by NASA and the U.S. Geological Survey (USGS).
                Since 1972, Landsat satellites have continuously gathered data about the Earth's surface, providing critical information for monitoring and managing land resources.
              </p>
              <p>
                Landsat data is widely used in agriculture, forestry, geology, and land use planning. It is a vital resource for understanding climate change, deforestation,
                urban expansion, and disaster response.
              </p>
            </div>
          </Tab>
          <Tab eventKey="reminders" title="Reminders">
            <div className="reminders">
              <h2>Satellite Overpass Reminders</h2>
              <p>
                Set reminders to be notified when a Landsat satellite is about to pass over your selected location. You will receive a notification based on the time you specify before the overpass.
              </p>
            </div>
          </Tab>
        </Tabs>
      </Container>
    </div>
  );
}

export default App;
