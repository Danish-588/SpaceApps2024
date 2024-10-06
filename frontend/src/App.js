import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import {
  Container,
  Card,
  Typography,
  Grid,
  Box,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { FaSatellite, FaMapMarkerAlt } from 'react-icons/fa';
import { useSpring, animated } from 'react-spring';
import { ClipLoader } from 'react-spinners';

// Import Google Font
import '@fontsource/roboto'; // Modern, clean font

function App() {
  // State variables for input fields
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [cloudCover, setCloudCover] = useState(70);
  const [notificationTime, setNotificationTime] = useState(1);
  const [email, setEmail] = useState('');

  // State variables for the API response and error handling
  const [satelliteData, setSatelliteData] = useState(null);
  const [imageryUrl, setImageryUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // React-Spring animations
  const fadeIn = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { duration: 1000 },
  });

  // Function to handle form submission and make API requests
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSatelliteData(null);
    setImageryUrl(null);

    try {
      // Making a POST request to the backend using fetch for Landsat data analysis
      const response = await fetch('http://localhost:5000/analyze_landsat', {
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
      const imageryResponse = await fetch('http://localhost:5000/fetch_imagery', {
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
      <Marker position={[latitude, longitude]}>
        <FaMapMarkerAlt color="red" size={24} />
      </Marker>
    ) : null;
  };

  return (
    <Container maxWidth="lg" className="App">
      <Box
        sx={{
          textAlign: 'center',
          padding: '50px 20px',
          background: 'linear-gradient(to right, #2193b0, #6dd5ed)',
          color: 'white',
          borderRadius: '10px',
          marginBottom: '20px',
        }}
      >
        <Typography variant="h2" component="h1" sx={{ fontFamily: 'Roboto, sans-serif', fontWeight: 'bold' }}>
          Landsat Analysis Tool
        </Typography>
        <Typography variant="subtitle1" sx={{ fontFamily: 'Roboto, sans-serif' }}>
          Get precise satellite imagery and analyze the environment around you.
        </Typography>
      </Box>

      {/* Form for user input */}
      <animated.div style={fadeIn}>
        <Card
          variant="outlined"
          sx={{
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0px 10px 20px rgba(0,0,0,0.1)',
            marginBottom: '30px',
          }}
        >
          <form onSubmit={handleSubmit}>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Latitude"
                  type="number"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  inputProps={{ step: 0.000001, min: -90, max: 90 }}
                  fullWidth
                  required
                  variant="filled"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Longitude"
                  type="number"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  inputProps={{ step: 0.000001, min: -180, max: 180 }}
                  fullWidth
                  required
                  variant="filled"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Cloud Cover Threshold (%)"
                  type="number"
                  value={cloudCover}
                  onChange={(e) => setCloudCover(e.target.value)}
                  inputProps={{ min: 0, max: 100 }}
                  fullWidth
                  required
                  variant="filled"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email (optional)"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  variant="filled"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notify Me Before Overpass (Hours)"
                  type="number"
                  value={notificationTime}
                  onChange={(e) => setNotificationTime(e.target.value)}
                  inputProps={{ min: 0.1, step: 0.1 }}
                  fullWidth
                  required
                  variant="filled"
                />
              </Grid>
              <Grid item xs={12} style={{ textAlign: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ padding: '10px 20px', fontWeight: 'bold', fontSize: '18px' }}
                  startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <FaSatellite />}
                >
                  {loading ? 'Analyzing...' : 'Analyze and Fetch Imagery'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Card>
      </animated.div>

      {/* Map Container for selecting latitude and longitude */}
      <animated.div style={fadeIn}>
        <Card
          variant="outlined"
          sx={{
            padding: '20px',
            borderRadius: '15px',
            boxShadow: '0px 10px 20px rgba(0,0,0,0.1)',
            marginBottom: '30px',
          }}
        >
          <Typography variant="h5" gutterBottom>
            Click on the Map to Set Location
          </Typography>
          <Box sx={{ height: '400px', width: '100%' }}>
            <MapContainer center={[0, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker />
            </MapContainer>
          </Box>
        </Card>
      </animated.div>

      {/* Display any error messages */}
      {error && (
        <animated.div style={fadeIn}>
          <Typography variant="body1" color="error" style={{ marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </Typography>
        </animated.div>
      )}

      {/* Display the satellite data if available */}
      {satelliteData && (
        <animated.div style={fadeIn}>
          <Card
            variant="outlined"
            sx={{
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0px 10px 20px rgba(0,0,0,0.1)',
              marginBottom: '30px',
            }}
          >
            <Typography variant="h5" gutterBottom>
              Next Satellite Pass Details
            </Typography>
            <Typography variant="body1">
              <strong>Location:</strong> {satelliteData.location}
            </Typography>
            <Typography variant="body2" sx={{ marginTop: '15px' }}>
              <strong>Next Overpasses:</strong>
            </Typography>
            {satelliteData.overpass_times.map((overpass) => (
              <Typography key={overpass.satellite} variant="body2">
                <strong>{overpass.satellite}:</strong>{' '}
                {overpass.next_overpass ? new Date(overpass.next_overpass).toLocaleString() : 'No upcoming overpass.'}
              </Typography>
            ))}
          </Card>
        </animated.div>
      )}

      {/* Display NASA imagery */}
      {imageryUrl && (
        <animated.div style={fadeIn}>
          <Card
            variant="outlined"
            sx={{
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0px 10px 20px rgba(0,0,0,0.1)',
              marginBottom: '30px',
            }}
          >
            <Typography variant="h5" gutterBottom>
              NASA Imagery
            </Typography>
            <img src={imageryUrl} alt="NASA Satellite Imagery" style={{ maxWidth: '100%', borderRadius: '10px' }} />
          </Card>
        </animated.div>
      )}

      {loading && (
        <Box sx={{ textAlign: 'center', margin: '20px 0' }}>
          <ClipLoader size={50} color={"#123abc"} loading={loading} />
        </Box>
      )}
    </Container>
  );
}

export default App;
