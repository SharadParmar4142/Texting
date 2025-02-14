const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const connectDb = require('./config/dbConnection');
const userRoutes = require('./routes/userRoutes');

// Connect to the database
connectDb();

// Initialize the app
const app = express();
const PORT = process.env.PORT || 3200;

// Enable CORS
app.use(cors());
app.use(cors({origin:'*'}));

// Middleware to parse JSON
app.use(express.json());

// User routes
app.use('/user', userRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Listening to PORT: ${PORT}`);
});