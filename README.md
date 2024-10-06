# Landsat Analysis Tool - NASA Space Apps 2024

Welcome to the **Landsat Analysis Tool**, a project developed for the **NASA Space Apps 2024 Hackathon**. Our team worked on the challenge titled **"Landsat Reflectance Data: On the Fly and at Your Fingertips"** to bring real-time Landsat satellite data to users in an accessible and interactive way. The application allows you to visualize and analyze satellite imagery and reflectance data at a user-selected location on the map.

## Project Overview
### Objective
Our primary goal was to create a tool that enables anyone, from researchers to students, to:
- Access Landsat imagery and surface reflectance data.
- Understand how satellite imagery can be used for real-world applications.
- Get the data easily without complex processing requirements.

### Key Features
- **Interactive Map**: Users can select a point of interest directly on the map.
- **Satellite Overpass Information**: Find out when the next satellite pass over the selected location will occur.
- **Notification System**: Receive email alerts for upcoming satellite passes at your selected location.

## Tech Stack
### Frontend
- **React.js**: Utilized for building a dynamic and interactive user interface.
- **React-Bootstrap**: For creating responsive UI components.
- **Leaflet.js** & **React-Leaflet**: Provides mapping capabilities to allow users to select geographic coordinates interactively.

### Backend
- **Node.js** & **Express.js**: Handles all backend logic, processes API requests, and integrates with NASA's APIs.
- **Axios**: Used for making HTTP requests to NASA and USGS APIs.

### External APIs
- **NASA Earth API**: To retrieve satellite imagery data.
- **USGS API**: To obtain further satellite data, such as reflectance.
- **Stadia Maps**: To provide interactive map tiles for selecting locations.

## Problem Statement Alignment
Our project addresses the **"Landsat Reflectance Data: On the Fly and at Your Fingertips"** problem statement by offering:
- **Easy access** to Landsat surface reflectance data without requiring advanced GIS software or expertise.
- **Real-time exploration** of different regions around the globe, helping users to visualize the environmental data instantly.
- **Interactive visualization** through an integrated map-based UI that ensures anyone, regardless of technical skills, can utilize Landsat satellite data effectively.

## Setup Instructions
To run this project locally, please follow these steps:

### Prerequisites
- **Node.js** (v14+)
- **npm** or **yarn** for managing JavaScript dependencies

### Backend Setup (Node.js API)
1. **Clone the repository**:
   ```bash
   git clone <repository_url>
   cd <repository_directory>/backend
   ```

2. **Install backend dependencies**:
   ```bash
   npm install
   ```

3. **Start the Node.js server**:
   ```bash
   node server.mjs
   ```
   The server will start on `http://localhost:5000`.

### Frontend Setup (React App)
1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Start the React development server**:
   ```bash
   npm start
   ```
   The frontend server will run at `http://localhost:3000`.

## How to Use
1. **Open your browser** and go to `http://localhost:3000`.
2. **Set a Location**: Click on the map to choose a location or manually enter the latitude and longitude.
3. **Adjust Settings**:
   - Set the **cloud cover threshold** to filter out cloudy imagery.
   - Set the **notification time** for satellite overpasses.
   - Optionally provide an **email address** to receive notifications about upcoming satellite passes.

## Capabilities of the Project
- **Interactive Satellite Data Access**: Users can click on any point on the map to get near real-time satellite data.
- **Satellite Overpass Notifications**: Users can opt to receive alerts about the next satellite overpass over their chosen location.
- **Reflectance Data Download**: Users can download surface reflectance data for various bands.

## Acknowledgements
- **NASA Space Apps**: For hosting this hackathon and providing valuable challenges and datasets.
- **NASA Open APIs**: For providing free access to their Earth imagery datasets.
- **React & Leaflet**: For creating a rich user experience for map visualization.

---
**Team:** Participating in the **NASA Space Apps Challenge 2024**  
**Problem Statement:** Landsat Reflectance Data: On the Fly and at Your Fingertips  
**Project Goal:** Provide easy, accessible, and real-time satellite data from NASA to users worldwide.
