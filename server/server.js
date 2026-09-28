const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

// Load Route Files
const assetRoutes = require('./routes/assetRoutes');
const authRoutes = require('./routes/authRoutes');

// Initialize the Express App
const app = express();

// Middleware
app.use(express.json()); // Allows the server to parse JSON bodies from the frontend
app.use(cors());         // Allows your React frontend to communicate with this API
app.use(helmet());       // Adds basic security headers to HTTP requests

// Mount the API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api', notFound);

// Basic Default Route (Great for checking if the server is alive)
app.get('/', (req, res) => {
  res.send('Metro Asset Tracker API is running and connected!');
});

app.use(errorHandler);

// Set the Port
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) startServer();

module.exports = { app, startServer };