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

// Middleware
app.use(cors());
app.use(express.json());

// Set up geocoder
const geocoder = NodeGeocoder({
    provider: 'openstreetmap'
});

// Set up Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use another email service provider
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS  // Your email password (Consider using an app password)
  }
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
    const { location, cloud_cover = 70, date_range = 'latest', email, notification_time } = req.body;

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

    // Schedule the email notification
    const notificationDate = new Date(nextOverpassTime.getTime() - notification_time * 60 * 60 * 1000);
    const timeDifference = notificationDate.getTime() - new Date().getTime();

    if (timeDifference > 0) {
        setTimeout(() => {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Upcoming Landsat Satellite Overpass',
                text: `The Landsat satellite will pass over your location (${lat}, ${lon}) on ${new Date(nextOverpassTime).toLocaleString()}.`
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error('Error sending email:', err);
                } else {
                    console.log('Email sent:', info.response);
                }
            });
        }, timeDifference);
    }

    // Respond with satellite data as usual
    res.json({
        location: `${lat}, ${lon}`,
        next_overpass: nextOverpassTime,
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
