# YouTube Channel Alternative Frontend

A containerized web application that provides an alternative frontend for viewing YouTube channel content. Built with React, Node.js, Express, and the YouTube Data API v3.

## Features

- **Channel-Specific Interface**: View content from a single YouTube channel specified at container startup
- **Channel Avatar Logo**: Automatically uses the channel's avatar as the application logo
- **Recent Videos**: Home page displays the most recent videos from the channel
- **Comprehensive Content Access**:
  - All Videos with pagination
  - Shorts
  - Live Streams
  - Community Posts
  - Playlists
- **Video Playback**: Watch videos directly in the application
- **Responsive Design**: Works on desktop and mobile devices
- **Containerized**: Easy deployment with Docker

## Prerequisites

- Docker and Docker Compose installed
- YouTube Data API v3 key from Google Cloud Console

### Getting a YouTube API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API key)
5. Copy the API key for use in this application

## Installation

### Option 1: Using Docker Compose (Recommended)

1. Clone or download this repository

2. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your credentials:
   ```env
   YOUTUBE_API_KEY=your_actual_api_key_here
   YOUTUBE_CHANNEL_HANDLE=@channelhandle
   ```

4. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

5. Access the application at `http://localhost:3000`

### Option 2: Using Docker Run

Build the image:
```bash
docker build -t youtube-frontend .
```

Run the container:
```bash
docker run -p 3000:3000 \
  -e YOUTUBE_API_KEY="your_api_key_here" \
  -e YOUTUBE_CHANNEL_HANDLE="@channelhandle" \
  youtube-frontend
```

## Usage

Once the container is running, open your browser to `http://localhost:3000`

### Navigation

- **Home**: Shows the 12 most recent videos from the channel
- **Videos**: Browse all videos with pagination
- **Shorts**: View short-form videos
- **Live**: See current and upcoming live streams
- **Posts**: View community posts (if available)
- **Playlists**: Browse channel playlists

### Changing Channels

To view a different channel, stop the container and restart it with a new `YOUTUBE_CHANNEL_HANDLE` environment variable:

```bash
docker-compose down
# Edit .env file with new channel handle
docker-compose up
```

## Project Structure

```
influence/
├── backend/                 # Express backend
│   ├── services/           # YouTube API service
│   ├── routes/             # API routes
│   └── server.js           # Main server file
├── frontend/               # React frontend
│   └── src/
│       ├── components/     # Reusable components
│       ├── pages/          # Page components
│       └── services/       # API client
├── docker-compose.yml      # Docker Compose config
├── Dockerfile             # Multi-stage Docker build
└── .env.example           # Environment template
```

## API Endpoints

The backend provides the following REST endpoints:

- `GET /api/channel` - Channel information
- `GET /api/videos` - Channel videos (supports pagination)
- `GET /api/shorts` - Short videos
- `GET /api/live` - Live streams
- `GET /api/posts` - Community posts
- `GET /api/playlists` - Channel playlists
- `GET /api/playlist/:id` - Videos in a specific playlist

## Development

To run the application in development mode without Docker:

### Backend
```bash
cd backend
npm install
# Create .env file with YOUTUBE_API_KEY and YOUTUBE_CHANNEL_HANDLE
node server.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Quota Considerations

The YouTube Data API has a daily quota limit of 10,000 units (free tier). Each API call consumes units:

- Channel info: ~3 units
- Search queries: ~100 units each
- Playlist items: ~1 unit

Be mindful of frequent page refreshes and pagination to avoid hitting quota limits.

## Troubleshooting

### Container fails to start
- Verify your API key is valid
- Check that the channel handle exists
- Ensure port 3000 is not already in use

### "Channel not found" error
- Verify the channel handle is correct (e.g., `@mkbhd`)
- Try with or without the `@` symbol
- Ensure the channel is public

### "Quota exceeded" error
- You've hit the daily API quota limit
- Wait 24 hours for quota reset
- Consider upgrading your Google Cloud quota

### No videos/content showing
- Some content types may not be available for all channels
- Check the YouTube Data API response in server logs
- Verify the channel has public content of that type

## Technologies Used

- **Frontend**: React 18, React Router, Vite, Axios
- **Backend**: Node.js, Express, Axios
- **API**: YouTube Data API v3
- **Containerization**: Docker, Docker Compose

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests.
