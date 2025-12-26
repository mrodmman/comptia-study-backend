const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// MongoDB connection
let db;
let studyDataCollection;

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = 'comptia-study-buddy';
const COLLECTION_NAME = 'study-data';

// Empty state for NEW format
const EMPTY_STATE = {
  activeGuide: {
    id: `guide-${Date.now()}`,
    name: `Study Guide - ${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString(),
    processedVideos: [],
    quizHistory: []
  },
  archivedGuides: [],
  activeExam: "A+"
};

// Connect to MongoDB
async function connectToDatabase() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    console.log('🔄 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    db = client.db(DB_NAME);
    studyDataCollection = db.collection(COLLECTION_NAME);
    
    console.log('✅ Connected to MongoDB successfully!');
    console.log(`   Database: ${DB_NAME}`);
    console.log(`   Collection: ${COLLECTION_NAME}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  if (req.method === 'POST' && req.body) {
    console.log('Body keys:', Object.keys(req.body));
  }
  console.log('='.repeat(60));
  next();
});

// GET /api/study-data - Retrieve study data
app.get('/api/study-data', async (req, res) => {
  try {
    if (!studyDataCollection) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    // Get the user's study data (we'll use a single document with id: 'main')
    const data = await studyDataCollection.findOne({ _id: 'main' });

    if (!data) {
      console.log('📝 No data found, returning empty state');
      return res.json(EMPTY_STATE);
    }

    // Remove MongoDB's _id field before sending
    const { _id, ...studyData } = data;
    
    console.log('✅ Returning saved data from MongoDB');
    res.json(studyData);
  } catch (error) {
    console.error('❌ Error reading data:', error);
    res.status(500).json({ error: 'Failed to read study data' });
  }
});

// POST /api/study-data - Save study data
app.post('/api/study-data', async (req, res) => {
  try {
    if (!studyDataCollection) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const data = req.body;
    
    if (!data || typeof data !== 'object') {
      console.error('❌ Invalid data received');
      return res.status(400).json({ error: 'Invalid data' });
    }
    
    // Ensure NEW format structure
    if (!data.activeGuide || typeof data.activeGuide !== 'object') {
      console.log('⚠️  Creating default activeGuide');
      data.activeGuide = {
        id: `guide-${Date.now()}`,
        name: `Study Guide - ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString(),
        processedVideos: [],
        quizHistory: []
      };
    } else {
      // Validate activeGuide fields
      if (!data.activeGuide.id) data.activeGuide.id = `guide-${Date.now()}`;
      if (!data.activeGuide.name) data.activeGuide.name = `Study Guide - ${new Date().toLocaleDateString()}`;
      if (!data.activeGuide.createdAt) data.activeGuide.createdAt = new Date().toISOString();
      if (!Array.isArray(data.activeGuide.processedVideos)) data.activeGuide.processedVideos = [];
      if (!Array.isArray(data.activeGuide.quizHistory)) data.activeGuide.quizHistory = [];
    }
    
    if (!Array.isArray(data.archivedGuides)) {
      console.log('⚠️  Creating empty archivedGuides');
      data.archivedGuides = [];
    }
    
    if (typeof data.activeExam !== 'string') {
      console.log('⚠️  Setting default activeExam');
      data.activeExam = "A+";
    }
    
    // Save to MongoDB (upsert = update or insert)
    await studyDataCollection.updateOne(
      { _id: 'main' },
      { $set: data },
      { upsert: true }
    );
    
    console.log('✅ DATA SAVED TO MONGODB');
    console.log(`   Guide: ${data.activeGuide.name}`);
    console.log(`   Videos: ${data.activeGuide.processedVideos.length}`);
    console.log(`   Archived: ${data.archivedGuides.length}`);
    
    res.json({ message: 'Data saved successfully' });
  } catch (error) {
    console.error('❌ Error saving data:', error);
    res.status(500).json({ error: 'Failed to save study data' });
  }
});

// DELETE /api/study-data - Wipe all data
app.delete('/api/study-data', async (req, res) => {
  try {
    if (!studyDataCollection) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    await studyDataCollection.deleteOne({ _id: 'main' });
    console.log('✅ Data wiped from MongoDB');
    res.json({ message: 'Data wiped successfully' });
  } catch (error) {
    console.error('❌ Error deleting data:', error);
    res.status(500).json({ error: 'Failed to delete study data' });
  }
});

// GET /health - Health check
app.get('/health', (req, res) => {
  const isDbConnected = !!studyDataCollection;
  res.json({ 
    message: 'Backend is running',
    database: isDbConnected ? 'Connected' : 'Disconnected',
    format: 'NEW (StudyGuide)',
    storage: 'MongoDB Atlas',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3000;

connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log(`🚀 CompTIA Study Backend - Port ${PORT}`);
      console.log('📊 Format: NEW (activeGuide structure)');
      console.log('💾 Storage: MongoDB Atlas');
      console.log('='.repeat(60) + '\n');
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
