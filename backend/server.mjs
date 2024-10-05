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

// Function to predict the next satellite overpass
function predictNextOverpass(lat, lon) {
    const tleLine1 = '1 43013U 17073A   20334.91667824  .00000023  00000-0  00000+0 0  9994'; // TLE Line 1 for Landsat-8
    const tleLine2 = '2 43013  97.7421  34.8470 0001432  91.5763 268.5523 14.57178936188308'; // TLE Line 2 for Landsat-8
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

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

    return nextOverpassTime;
}

// Endpoint to analyze Landsat data
app.post('/analyze_landsat', async (req, res) => {
    const { location, cloud_cover = 70, date_range = 'latest' } = req.body;

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

    // Predict the next satellite overpass
    const nextOverpassTime = predictNextOverpass(lat, lon);

    if (!nextOverpassTime) {
        return res.status(404).json({ error: 'Unable to predict next overpass for the given location.' });
    }

    // Format next overpass time and expand the date range by ±1 month
    const startDate = moment(nextOverpassTime).subtract(1, 'months').format('YYYY-MM-DDTHH:mm:ssZ');
    const endDate = moment(nextOverpassTime).add(1, 'months').format('YYYY-MM-DDTHH:mm:ssZ');

    // Fetch Landsat scenes
    const stacServer = 'https://landsatlook.usgs.gov/stac-server';
    try {
        const response = await axios.post(`${stacServer}/search`, {
            intersects: {
                type: "Point",
                coordinates: [lon, lat]
            },
            datetime: `${startDate}/${endDate}`,
            collections: ["landsat-c2l2-sr"],
            query: { "eo:cloud_cover": { "lt": cloud_cover } }
        });

        const landsatScenes = response.data.features;
        if (!landsatScenes || landsatScenes.length === 0) {
            return res.status(404).json({ error: 'No Landsat scenes found matching the criteria' });
        }

        const selectedScene = landsatScenes[0];
        const metadata = {
            acquisition_date: selectedScene.properties.datetime,
            cloud_cover: selectedScene.properties['eo:cloud_cover'],
            satellite: selectedScene.properties.platform,
            path: selectedScene.properties['landsat:wrs_path'],
            row: selectedScene.properties['landsat:wrs_row'],
            quality: selectedScene.properties['landsat:quality']
        };

        const bandUrls = {};
        const bandMapping = {
            'SR_B1': 'coastal', 'SR_B2': 'blue', 'SR_B3': 'green', 'SR_B4': 'red',
            'SR_B5': 'nir08', 'SR_B6': 'swir16', 'SR_B7': 'swir22'
        };
        for (const [srBand, assetKey] of Object.entries(bandMapping)) {
            if (selectedScene.assets[assetKey]) {
                bandUrls[srBand] = selectedScene.assets[assetKey].href;
            }
        }

        if (Object.keys(bandUrls).length === 0) {
            return res.status(404).json({ error: 'No surface reflectance data available for this scene' });
        }

        // Construct the final result
        const result = {
            location: `${lat}, ${lon}`,
            next_overpass: nextOverpassTime,
            scene_metadata: metadata,
            reflectance_data: bandUrls
        };

        return res.json(result);
    } catch (error) {
        console.error('Error fetching Landsat data:', error);
        return res.status(500).json({ error: 'Failed to fetch Landsat data.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
