import express from 'express';
import axios from 'axios';
import NodeGeocoder from 'node-geocoder';
import satellite from 'satellite.js';
import cors from 'cors';
import moment from 'moment';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Set up geocoder
const geocoder = NodeGeocoder({
  provider: 'openstreetmap'
});

// Function to predict the next satellite overpass for multiple satellites
function predictNextOverpass(lat, lon) {
    const tleLines = [
        {
            name: 'Landsat 8',
            tleLine1: process.env.TLE_LINE1,
            tleLine2: process.env.TLE_LINE2
        },
        {
            name: 'Landsat 9',
            tleLine1: '1 49577U 21093A   21267.58993056  .00000023  00000-0  00000+0 0  9998',
            tleLine2: '2 49577  97.7016  55.7332 0001991  95.1893 265.0077 14.57178936188328'
        }
    ];

  const overpassTimes = [];

  tleLines.forEach(satelliteInfo => {
    const satrec = satellite.twoline2satrec(satelliteInfo.tleLine1, satelliteInfo.tleLine2);
    let currentTime = new Date();
    let nextOverpassTime = null;

    // Iterate for the next 21 days, at intervals of 1 minute, to predict overpass
    for (let i = 0; i < 30000; i++) {
      currentTime = new Date(currentTime.getTime() + 60 * 1000); // Increment by 1 minute
      const positionAndVelocity = satellite.propagate(satrec, currentTime);
      const positionEci = positionAndVelocity.position;

      if (positionEci) {
        const gmst = satellite.gstime(currentTime);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        const predictedLat = satellite.degreesLat(positionGd.latitude);
        const predictedLon = satellite.degreesLong(positionGd.longitude);

        // Check if predicted location is close to the target location (within ~1 degree)
        if (Math.abs(predictedLat - lat) < 1 && Math.abs(predictedLon - lon) < 1) {
          nextOverpassTime = currentTime;
          break;
        }
      }
    }

    overpassTimes.push({
      satellite: satelliteInfo.name,
      next_overpass: nextOverpassTime
    });
  });

  return overpassTimes;
}

// Endpoint to analyze Landsat data
app.post('/api/analyze_landsat', async (req, res) => {
  const { location, cloud_cover, date_range, email, notification_time } = req.body;

  let lat, lon;

  try {
    if (location.includes(',')) {
      [lat, lon] = location.split(',').map(coord => parseFloat(coord.trim()));
    } else {
      const geoRes = await geocoder.geocode(location);
      if (geoRes.length === 0) return res.status(400).json({ error: 'Invalid location' });
      lat = geoRes[0].latitude;
      lon = geoRes[0].longitude;
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid location format' });
  }

  const overpassTimes = predictNextOverpass(lat, lon);

  if (!overpassTimes || overpassTimes.length === 0) {
    return res.status(404).json({ error: 'Unable to predict next overpass for the given location.' });
  }

  res.json({
    location: `${lat}, ${lon}`,
    overpass_times: overpassTimes
  });
});

// Endpoint to fetch NASA imagery
app.post('/api/fetch_imagery', async (req, res) => {
  const { lat, lon } = req.body;

  const apiUrl = 'https://api.nasa.gov/planetary/earth/imagery';
  const apiKey = process.env.NASA_API_KEY;

  try {
    const response = await axios.get(apiUrl, {
      params: {
        lon,
        lat,
        date: '2023-10-01',
        cloud_score: true,
        dim: 0.1,
        api_key: apiKey
      }
    });

    if (response.status !== 200) {
      return res.status(response.status).json({ error: 'Failed to fetch imagery' });
    }

    res.json({ imageUrl: response.data.url });
  } catch (error) {
    console.error('Error fetching NASA imagery:', error.message);
    return res.status(500).json({ error: 'Failed to fetch imagery' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
