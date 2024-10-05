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
  const apiKey = 'b5XzJdVDyPSjA342CgG7fhfWPgAYDW6DFZCw1aeN';  // Replace with your API key

  // Function to fetch Landsat data based on user input
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setLandsatData(null);
  
    try {
      const response = await fetch(`${apiUrl}?lon=${longitude}&lat=${latitude}&date=${date}&cloud_score=True&api_key=${apiKey}`);
      
      // Check if response is okay
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
  
      // Log response headers and content type
      console.log("Response Headers:", response.headers.get("Content-Type"));
  
      // Attempt to parse JSON only if the content type is correct
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();  // Parse JSON data
        setLandsatData(data);  // Store the data in state
      } else {
        throw new Error("Response is not JSON");
      }
  
      setLoading(false);  // Data loaded successfully
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);  // Store error message in state
      setLoading(false);
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

        {/* Display loading spinner or error message */}
        {loading ? (
          <div className="loader"></div>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
          landsatData && (
            <div>
              <p><strong>Date:</strong> {landsatData.date}</p>
              <p><strong>Cloud Score:</strong> {landsatData.cloud_score}</p>
              <img src={landsatData.url} alt="Landsat imagery" style={{ maxWidth: '100%' }} />
            </div>
          )
        )}
      </header>
    </div>
  );
}

export default App;
