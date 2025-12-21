# CompTIA Study Backend

Backend API server for CompTIA Study Buddy - a comprehensive study tracking application for CompTIA certification exams.

## Description

This Express.js backend provides a RESTful API for storing and retrieving CompTIA study data with JSON file-based persistence. It supports tracking processed videos, active exams, and quiz history.

## API Endpoints

### GET /api/study-data
Retrieves the current study data from storage.

**Response:**
- Status: 200
- Body: JSON object with study data
```json
{
  "processedVideos": [],
  "activeExam": "A+",
  "quizHistory": []
}
```

If no data exists, returns empty state with default values.

### POST /api/study-data
Saves study data to persistent storage.

**Request Body:**
```json
{
  "processedVideos": [],
  "activeExam": "A+",
  "quizHistory": []
}
```

**Response:**
- Status: 200
- Body: `{ "message": "Data saved successfully" }`

### DELETE /api/study-data
Wipes all stored study data.

**Response:**
- Status: 200
- Body: `{ "message": "Data wiped successfully" }`

### GET /health
Health check endpoint to verify the backend is running.

**Response:**
- Status: 200
- Body: `{ "message": "Backend is running" }`

## Local Development

### Prerequisites
- Node.js >= 18.0.0
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mrodmman/comptia-study-backend.git
cd comptia-study-backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

Or for development:
```bash
npm run dev
```

The server will start on `http://localhost:3000` by default.

### Testing the API

You can test the endpoints using curl:

```bash
# Health check
curl http://localhost:3000/health

# Get study data
curl http://localhost:3000/api/study-data

# Save study data
curl -X POST http://localhost:3000/api/study-data \
  -H "Content-Type: application/json" \
  -d '{"processedVideos":[],"activeExam":"A+","quizHistory":[]}'

# Delete study data
curl -X DELETE http://localhost:3000/api/study-data
```

## Deployment to Render

### Steps

1. Create a new Web Service on [Render](https://render.com)

2. Connect your GitHub repository

3. Configure the service:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

4. Set environment variables (optional):
   - `PORT` - Render automatically sets this, but you can override if needed

5. Deploy!

### Notes
- Render will automatically run `npm install` on each deployment
- The `data/` directory persists on Render's disk storage
- Free tier may experience cold starts (30-60 seconds of inactivity)
- Data persists between deployments on the same service

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port number for the server | `3000` |

## File Structure

```
comptia-study-backend/
├── data/
│   ├── .gitkeep           # Ensures data directory exists in repo
│   └── study-data.json    # Runtime data file (not committed)
├── .gitignore
├── package.json
├── server.js              # Main Express server
└── README.md
```

## Data Persistence

- Data is stored in `data/study-data.json`
- The file is created automatically when data is first saved
- The `data/` directory is tracked in git via `.gitkeep`, but the actual data file is ignored
- On Render, the data persists on disk between restarts (but not between service deletions)

## CORS

CORS is enabled for all origins to allow the frontend to connect from any domain.

## Error Handling

All endpoints include proper error handling:
- 500 status codes for server errors
- Detailed error messages logged to console
- Graceful handling of missing files (returns empty state)

## License

MIT

