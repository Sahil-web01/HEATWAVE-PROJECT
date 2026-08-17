const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (_) { }

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Return clean 400 for malformed JSON instead of dumping a stack trace
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }
  next(err);
});

// 1. Route Imports
const wardRoutes = require('./routes/wards.routes');
const resourceRoutes = require('./routes/resources.routes');
const riskRoutes = require('./routes/risk.routes');
const alertRoutes = require('./routes/alerts.routes');
const simulateRoutes = require('./routes/simulate.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const emergencyRoutes = require('./routes/emergency.routes');
const { startWatcher } = require('./jobs/riskWatcher.cron');

// 2. Mount Routes
app.use('/api/wards', wardRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/simulate', simulateRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/emergency', emergencyRoutes);

// Health Check
app.get('/', (req, res) => {
  res.json({ message: "Urban Heatwave API is running!" });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// 3. Database Connection & Server Initialization
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/urban_heatwave";

const startServer = async () => {
  try {
    console.log(`Connecting to MongoDB URI: ${MONGO_URI.substring(0, 30)}...`);
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 4000 });
    console.log("✅ MongoDB Connected successfully");
    startWatcher();
  } catch (err) {
    console.warn("⚠️ Primary MongoDB Atlas connection timed out/failed:", err.message);
    try {
      console.log("🔄 Attempting fallback connection to local MongoDB (127.0.0.1:27017)...");
      await mongoose.connect("mongodb://127.0.0.1:27017/urban_heatwave", { serverSelectionTimeoutMS: 3000 });
      console.log("✅ Connected successfully to Local MongoDB fallback!");
      startWatcher();
    } catch (localErr) {
      console.error("❌ Both Atlas and Local MongoDB connections failed:", localErr.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();