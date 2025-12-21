const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Constants
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'study-data.json');
const EMPTY_STATE = {
  processedVideos: [],
  activeExam: "A+",
  quizHistory: []
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
      res.json(JSON.parse(data));
    } catch (parseError) {
      console.error('Error parsing study data:', parseError);
      res.json(EMPTY_STATE);
    }
  } catch (error) {
    // If file doesn't exist, return empty state
    if (error.code === 'ENOENT') {
      res.json(EMPTY_STATE);
    } else {
      console.error('Error reading study data:', error);
      res.status(500).json({ error: 'Failed to read study data' });
    }
  }
});

// POST /api/study-data - Save study data
app.post('/api/study-data', async (req, res) => {
  try {
    // Basic validation
    const { processedVideos, activeExam, quizHistory } = req.body;
    if (!Array.isArray(processedVideos) || !activeExam || !Array.isArray(quizHistory)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }
    
    await ensureDataDir();
    const data = JSON.stringify(req.body, null, 2);
    await fs.writeFile(DATA_FILE, data, 'utf-8');
    res.json({ message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving study data:', error);
    res.status(500).json({ error: 'Failed to save study data' });
  }
});

// DELETE /api/study-data - Wipe all data
app.delete('/api/study-data', async (req, res) => {
  try {
    await fs.unlink(DATA_FILE);
    res.json({ message: 'Data wiped successfully' });
  } catch (error) {
    // If file doesn't exist, consider it already wiped
    if (error.code === 'ENOENT') {
      res.json({ message: 'Data wiped successfully' });
    } else {
      console.error('Error deleting study data:', error);
      res.status(500).json({ error: 'Failed to delete study data' });
    }
  }
});

// GET /health - Health check
app.get('/health', (req, res) => {
  res.json({ message: 'Backend is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
