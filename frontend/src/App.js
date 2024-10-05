import React, { useState } from 'react';
import './App.css';

function App() {
  // State to store API data, loading status, and error
  const [landsatData, setLandsatData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // States to store user input values
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [date, setDate] = useState('');

  // Example Landsat API URL (you will need your actual API key)
  const apiUrl = 'https://api.nasa.gov/planetary/earth/imagery';
  const apiKey = 'b5XzJdVDyPSjA342CgG7fhfWPgAYDW6DFZCw1aeN';  // Replace with your actual API key

  // Function to fetch Landsat data based on user input
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setLandsatData(null);
    
    try {
      const apiUrlFull = `${apiUrl}?lon=${longitude}&lat=${latitude}&date=${date}&cloud_score=True&api_key=${apiKey}`;
      console.log(`API URL: ${apiUrlFull}`);  // Log the full request URL

      const response = await fetch(apiUrlFull);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      // Check if the response is an image (blob data)
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("image")) {
        const blob = await response.blob();  // Read the response as a blob
        const imageUrl = URL.createObjectURL(blob);  // Create a local URL for the image
        console.log("Image URL:", imageUrl);  // Log the image URL
        setLandsatData(imageUrl);  // Store the image URL in state
      } else {
        const textResponse = await response.text();  // Handle non-JSON, non-image responses
        console.log("Text Response (Non-Image):", textResponse);
        throw new Error("Expected image data but received something else");
      }

      setLoading(false);  // Stop loading
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);  // Set error message
      setLoading(false);  // Stop loading
    }
  };

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();  // Prevent form from refreshing the page
    fetchData();         // Fetch data when the user submits the form
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Landsat Reflectance Data</h1>

        {/* Form for user input */}
        <form onSubmit={handleSubmit}>
          <div>
            <label>Latitude: </label>
            <input
              type="number"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Longitude: </label>
            <input
              type="number"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Date (YYYY-MM-DD): </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <button type="submit">Get Data</button>
        </form>

        {/* Display loading spinner, error message, or image */}
        {loading ? (
          <div className="loader"></div>  // Show loader while data is being fetched
        ) : error ? (
          <p>Error: {error}</p>  // Display error message if an error occurs
        ) : (
          landsatData && (
            <div>
              <p><strong>Landsat Imagery:</strong></p>
              <img src={landsatData} alt="Landsat Imagery" style={{ maxWidth: '100%' }} />  {/* Render image */}
            </div>
          )
        )}
      </header>
    </div>
  );
}

export default App;
