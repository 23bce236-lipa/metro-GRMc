const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

// Load Route Files
const assetRoutes = require('./routes/assetRoutes');

// Load Environment Variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize the Express App
const app = express();

// Middleware
app.use(express.json()); // Allows the server to parse JSON bodies from the frontend
app.use(cors());         // Allows your React frontend to communicate with this API
app.use(helmet());       // Adds basic security headers to HTTP requests

// Mount the API Routes
app.use('/api/assets', assetRoutes);

// Basic Default Route (Great for checking if the server is alive)
app.get('/', (req, res) => {
  res.send('Metro Asset Tracker API is running and connected!');
});

// Set the Port
const PORT = process.env.PORT || 5000;

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});