const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

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

// Constants
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'study-data.json');

// Empty state for NEW format (StudyGuide structure)
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

// Helper function to ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
    throw error;
  }
}

// GET /api/study-data - Retrieve study data
app.get('/api/study-data', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    try {
      const parsedData = JSON.parse(data);
      console.log('✅ Returning saved data');
      res.json(parsedData);
    } catch (parseError) {
      console.error('❌ Error parsing data, returning empty state');
      res.json(EMPTY_STATE);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📝 No data file found, returning empty state');
      res.json(EMPTY_STATE);
    } else {
      console.error('❌ Error reading data:', error);
      res.status(500).json({ error: 'Failed to read study data' });
    }
  }
});

// POST /api/study-data - Save study data
app.post('/api/study-data', async (req, res) => {
  try {
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
    
    await ensureDataDir();
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(DATA_FILE, jsonData, 'utf-8');
    
    console.log('✅ DATA SAVED');
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
    await fs.unlink(DATA_FILE);
    console.log('✅ Data wiped successfully');
    res.json({ message: 'Data wiped successfully' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('✓ Data already wiped');
      res.json({ message: 'Data wiped successfully' });
    } else {
      console.error('❌ Error deleting data:', error);
      res.status(500).json({ error: 'Failed to delete study data' });
    }
  }
});

// GET /health - Health check
app.get('/health', (req, res) => {
  res.json({ 
    message: 'Backend is running',
    format: 'NEW (StudyGuide)',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 CompTIA Study Backend - Port ${PORT}`);
  console.log('📊 Format: NEW (activeGuide structure)');
  console.log('='.repeat(60) + '\n');
});
