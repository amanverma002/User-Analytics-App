require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const eventRoutes = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || '';

// ─── Middleware ────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '1mb' }));

// Serve tracking script as static file
app.use('/tracking', express.static(path.join(__dirname, '..', 'tracking')));

// ─── API Routes ───────────────────────────────────
app.use('/api', eventRoutes);

// ─── Health Check ─────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ─── Connect to MongoDB and Start Server ──────────
async function startServer() {
  let connectionUri = MONGODB_URI;

  // If no external MongoDB URI is configured, use in-memory MongoDB
  if (!connectionUri || connectionUri.includes('localhost')) {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      console.log('⏳ Starting in-memory MongoDB (no external MongoDB detected)...');
      const mongod = await MongoMemoryServer.create();
      connectionUri = mongod.getUri();
      console.log('✅ In-memory MongoDB started');
      console.log('💡 Tip: Set MONGODB_URI in .env to use MongoDB Atlas for persistent storage');

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.disconnect();
        await mongod.stop();
        process.exit(0);
      });
      process.on('SIGTERM', async () => {
        await mongoose.disconnect();
        await mongod.stop();
        process.exit(0);
      });
    } catch (err) {
      console.error('❌ Failed to start in-memory MongoDB:', err.message);
      console.error('   Install it with: npm install mongodb-memory-server');
      console.error('   Or set MONGODB_URI in .env to a MongoDB Atlas connection string');
      process.exit(1);
    }
  }

  try {
    await mongoose.connect(connectionUri);
    const dbType = connectionUri.includes('mongodb+srv') ? 'MongoDB Atlas' : 
                   connectionUri.includes('127.0.0.1') || connectionUri.includes('localhost') ? 'Local MongoDB' : 
                   'In-Memory MongoDB';
    console.log(`✅ Connected to ${dbType}`);

    app.listen(PORT, () => {
      console.log('');
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}/api`);
      console.log(`📄 Tracking script at http://localhost:${PORT}/tracking/tracker.js`);
      console.log(`🌐 Demo page at http://localhost:${PORT}/tracking/demo.html`);
      console.log('');
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

startServer();
