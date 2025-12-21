const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-memory storage (like your amazon-finds-backend)
let storage = {
  flashcards: [],
  studySessions: [],
  adminPassword: null
};

// Get all flashcards
app.get('/api/flashcards', (req, res) => {
  res.json({ flashcards: storage.flashcards });
});

// Save flashcards
app.post('/api/flashcards', (req, res) => {
  try {
    const { flashcards } = req. body;
    storage.flashcards = flashcards || [];
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save flashcards' });
  }
});

// Get study sessions
app.get('/api/sessions', (req, res) => {
  res.json({ sessions: storage.studySessions });
});

// Save study session
app.post('/api/sessions', (req, res) => {
  try {
    const { session } = req.body;
    storage.studySessions. push(session);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// Password check (same as amazon-finds-backend)
app.post('/api/check-password', (req, res) => {
  try {
    const { password } = req.body;
    
    if (!storage.adminPassword) {
      storage.adminPassword = password;
      return res. json({ valid: true, firstTime: true });
    }
    
    res.json({ valid: password === storage.adminPassword });
  } catch (error) {
    res.status(500).json({ valid: false });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    flashcards: storage.flashcards.length,
    sessions: storage.studySessions.length 
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'CompTIA Study Backend API' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
