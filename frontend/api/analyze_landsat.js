import NodeGeocoder from 'node-geocoder';
import satellite from 'satellite.js';
import moment from 'moment';

// Set up geocoder
const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
});

// Function to predict the next satellite overpass for multiple satellites
function predictNextOverpass(lat, lon) {
  const tleLines = [
    {
      name: 'Landsat 8',
      tleLine1: '1 43013U 17073A   20334.91667824  .00000023  00000-0  00000+0 0  9994',
      tleLine2: '2 43013  97.7421  34.8470 0001432  91.5763 268.5523 14.57178936188308',
    },
    {
      name: 'Landsat 9',
      tleLine1: '1 49577U 21093A   21267.58993056  .00000023  00000-0  00000+0 0  9998',
      tleLine2: '2 49577  97.7016  55.7332 0001991  95.1893 265.0077 14.57178936188328',
    },
  ];

  const overpassTimes = [];

  tleLines.forEach((satelliteInfo) => {
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
      next_overpass: nextOverpassTime,
    });
  });

  return overpassTimes;
}

// Serverless function to handle the request
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Please use POST.' });
    return;
  }

  const { location, cloud_cover = 70, date_range = 'latest', email, notification_time } = req.body;

  let lat, lon;

  // Handle location
  try {
    if (location.includes(',')) {
      [lat, lon] = location.split(',').map((coord) => parseFloat(coord.trim()));
    } else {
      const geoRes = await geocoder.geocode(location);
      if (geoRes.length === 0) {
        res.status(400).json({ error: 'Invalid location' });
        return;
      }
      lat = geoRes[0].latitude;
      lon = geoRes[0].longitude;
    }
  } catch (error) {
    res.status(400).json({ error: 'Invalid location format' });
    return;
  }

  // Predict the next satellite overpass for both Landsat satellites
  const overpassTimes = predictNextOverpass(lat, lon);

  if (!overpassTimes || overpassTimes.length === 0) {
    res.status(404).json({ error: 'Unable to predict next overpass for the given location.' });
    return;
  }

  // Respond with overpass times and metadata
  res.status(200).json({
    location: `${lat}, ${lon}`,
    overpass_times: overpassTimes,
  });
}
