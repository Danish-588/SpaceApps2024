const express = require('express');
const app = express();
const port = 5000;

app.get('/api/satellite-pass', async (req, res) => {
  const { lat, lon } = req.query;
  try {
    const response = await fetch(`https://landsat.usgs.gov/landsat_acq?lat=${lat}&lon=${lon}`);
    if (!response.ok) {
      throw new Error('Failed to fetch satellite pass data');
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch satellite pass data' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
