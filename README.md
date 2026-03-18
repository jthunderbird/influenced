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
- **Admin Panel**: Configure settings via web UI (optional)
- **Social Media Links**: Add Facebook, X, TikTok, and Instagram links

## Prerequisites

- Docker and Docker Compose installed
- YouTube Data API v3 key from Google Cloud Console

### Getting a YouTube API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API key)
5. Copy the API key for use in this application

## Environment Variables

The following environment variables can be configured:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `YOUTUBE_API_KEY` | Yes | - | YouTube Data API v3 key |
| `YOUTUBE_CHANNEL_HANDLE` | Yes | - | YouTube channel handle (@username or channel ID) |
| `FACEBOOK_HANDLE` | No | - | Facebook username (without @) |
| `X_HANDLE` | No | - | X/Twitter username (without @) |
| `TIKTOK_HANDLE` | No | - | TikTok username (without @) |
| `INSTAGRAM_HANDLE` | No | - | Instagram username (without @) |
| `RECENT_DAYS` | No | 7 | Days to look back for recent content |
| `RECENT_VIDEOS` | No | 10 | Max videos shown on home page |
| `RECENT_SHORTS` | No | 10 | Max shorts shown on home page |
| `ALLOWED_ORIGINS` | No | - | Comma-separated CORS origins |
| `ADMIN_USERNAME` | No | admin | Username for admin login |
| `ADMIN_PASSWORD` | No | Password!123 | Password for admin login |
| `USE_HELMET` | No | false | Enable security headers |
| `USE_RATE_LIMIT` | No | false | Enable API rate limiting |
| `SESSION_SECRET` | No | (auto-generated) | Secret for session management |
| `CACHE_DIR` | No | /app/.cache | Directory for cache storage |
| `PORT` | No | 3000 | Server port |

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

- **Home**: Shows recent content from all categories
- **Videos**: Browse all videos with pagination (excludes shorts)
- **Shorts**: View short-form videos (60 seconds or less)
- **Live**: See current live streams and past broadcasts
- **Posts**: View community posts (usually unavailable due to API limitations)
- **Playlists**: Browse channel playlists

### Admin Panel

The application includes an admin panel for configuring settings via a web UI. This allows deployment with no environment variables - everything can be set up through the admin panel after first launch.

**Access**: Navigate to `/admin/login` in your browser

**Default Credentials**:
- Username: `admin`
- Password: `Password!123`

**Important**:
- Change the default admin credentials in production
- Settings saved through the admin panel are persisted to the `.env` file
- Some settings require a container restart to take effect (marked in the UI)
- The admin panel is intentionally not linked from the main navigation

### Alternative Deployment: Zero-Config Option

You can deploy the application without setting any environment variables:

1. Mount a `.env` file at runtime (see Docker Compose configuration)
2. Start the container
3. The app will prompt for initial configuration via the admin panel at `/admin/login`

This approach is useful for quick testing but note that:
- The container must be restarted for changes to take effect
- Environment variables are recommended for production deployments as they are applied at startup

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

The YouTube Data API has a daily quota limit of 10,000 units (free tier). Different API calls consume different amounts of units:

- **search** endpoint: 100 units per call (very expensive!)
- **videos/channels/playlists** endpoints: 1 unit per call
- **activities** endpoint: 1 unit per call

### Caching System

To dramatically reduce API quota usage, this application implements an in-memory caching system:

- **All content types**: Cached for 60 minutes (channel info, videos, shorts, live streams, posts, playlists, search results)

**Impact**: With 60-minute caching, hundreds of users can visit the site within an hour and only the first visitor triggers API calls. Subsequent visitors get cached data, using 0 API units. This allows the application to scale efficiently within the 10,000 unit daily quota.

**Example**:
- First home page load: ~405 units
- Next 100 home page loads within 60 minutes: 0 units
- Total: 405 units (vs 40,500 units without caching = **99% reduction**)

The cache is cleared automatically when expired items are removed every 60 seconds.

## Known Limitations

### Community Posts Not Available

**The Posts tab will often show no content even when the channel has community posts on YouTube.** This is a limitation of YouTube's Data API v3, not a bug in this application.

YouTube's official API does not reliably provide access to community posts through the `activities` endpoint. The API typically only returns:
- `upload` - Video uploads
- `playlistItem` - Playlist additions
- `subscription` - Channel subscriptions

The `social`, `bulletin`, and `channelItem` activity types that would represent community posts are rarely (if ever) returned by the API, even for channels with active community posts visible on YouTube's website.

**Workaround:** There is no workaround using the official YouTube Data API. Third-party scraping solutions exist but violate YouTube's Terms of Service and are not implemented in this application.

## Docker Hub Publishing

This project includes GitHub Actions for automatic Docker image publishing:

### Setup

1. Go to [Docker Hub](https://hub.docker.com/) and create an account if you don't have one
2. Create a repository named `influenced`
3. In your GitHub repository settings, add these secrets:
   - `DOCKERHUB_USERNAME`: Your Docker Hub username
   - `DOCKERHUB_TOKEN`: A Docker Hub access token (generate at https://hub.docker.com/settings/security)

### Automated Builds

Every push to the `main` branch will:
1. Build the Docker image
2. Push to Docker Hub as `jthunderbird/influenced:latest`
3. Also tag with the Git SHA for versioning

### Manual Build

To build and push manually:

```bash
docker build -t jthunderbird/influenced .
docker push jthunderbird/influenced
```

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
