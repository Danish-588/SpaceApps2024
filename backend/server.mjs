import express from 'express';
import axios from 'axios';
import NodeGeocoder from 'node-geocoder';
import satellite from 'satellite.js';
import cors from 'cors';
import moment from 'moment';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  methods: 'GET, POST',
  allowedHeaders: 'Content-Type'
}));
app.use(express.json()); // Middleware to parse JSON request body

// Set up geocoder
const geocoder = NodeGeocoder({
  provider: 'openstreetmap'
});

// Set up Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Function to predict the next satellite overpass for multiple satellites
function predictNextOverpass(lat, lon) {
  const tleLines = [
    {
      name: 'Landsat 8',
      tleLine1: '1 43013U 17073A   20334.91667824  .00000023  00000-0  00000+0 0  9994',
      tleLine2: '2 43013  97.7421  34.8470 0001432  91.5763 268.5523 14.57178936188308'
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
app.post('/analyze_landsat', async (req, res) => {
  console.log('Request body:', req.body); // Debugging line

  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing' });
  }

  const { location, cloud_cover = 70, date_range = 'latest', email, notification_time } = req.body;

  if (!location) {
    return res.status(400).json({ error: 'Location is required.' });
  }

  let lat, lon;

  // Handle location
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

  // Predict the next satellite overpass for both Landsat satellites
  const overpassTimes = predictNextOverpass(lat, lon);

  if (!overpassTimes || overpassTimes.length === 0) {
    return res.status(404).json({ error: 'Unable to predict next overpass for the given location.' });
  }

  // Respond with overpass times and metadata (without surface reflectance data)
  res.json({
    location: `${lat}, ${lon}`,
    overpass_times: overpassTimes,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
