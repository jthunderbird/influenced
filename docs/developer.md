# Developer Guide

This guide covers local development, building, and advanced Docker Compose usage.

## Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- YouTube Data API v3 key

## Project Structure

```
influenced/
├── backend/                 # Express.js API server
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic (YouTube API, caching)
│   ├── middleware/        # Express middleware
│   └── server.js          # Main server entry point
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/        # Page components
│   │   └── services/     # API client code
│   └── dist/             # Built frontend (generated)
├── docker-compose.yml     # Production Docker Compose
├── Dockerfile            # Multi-stage Docker build
└── .env                  # Environment variables
```

## Local Development

### Backend Only

```bash
cd backend
npm install
# Create .env file with your settings
echo 'YOUTUBE_API_KEY=your_key
YOUTUBE_CHANNEL_HANDLE=@your_channel' > .env
node server.js
```

### Full Stack (with Docker)

```bash
# Build the image locally
docker build -t influenced:latest .

# Run with docker-compose
docker compose up -d
```

## Building the Docker Image

```bash
# Production build
docker build -t jthunderbird/influenced:latest .

# Or use docker compose
docker compose build
```

## Docker Compose Files

### Production (docker-compose.yml)

The default docker-compose.yml is optimized for production use:

```bash
docker compose up -d
```

### Development

Create a `docker-compose.dev.yml` for development:

```yaml
services:
  influenced:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./.env:/app/.env:rw
      - ./cache_data:/app/.cache
    environment:
      - NODE_ENV=development
    command: node --watch server.js
```

Run with:
```bash
docker compose -f docker-compose.dev.yml up -d
```

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | (required) |
| `YOUTUBE_CHANNEL_HANDLE` | Channel handle or ID | (required) |
| `FACEBOOK_HANDLE` | Facebook username | - |
| `X_HANDLE` | X/Twitter username | - |
| `TIKTOK_HANDLE` | TikTok username | - |
| `INSTAGRAM_HANDLE` | Instagram username | - |
| `RECENT_DAYS` | Days for "recent" content | 7 |
| `RECENT_VIDEOS` | Max videos on home | 10 |
| `RECENT_SHORTS` | Max shorts on home | 10 |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | - |
| `ADMIN_USERNAME` | Admin login username | admin |
| `ADMIN_PASSWORD` | Admin login password | Password!123 |
| `USE_HELMET` | Enable security headers | false |
| `USE_RATE_LIMIT` | Enable rate limiting | false |
| `SESSION_SECRET` | Session secret | (auto-generated) |
| `CACHE_DIR` | Cache directory | /app/.cache |
| `PORT` | Server port | 3000 |

## Testing

Test the API directly:

```bash
# Health check
curl http://localhost:3000/api/channel

# Get videos
curl http://localhost:3000/api/videos
```

## Troubleshooting

### Container won't start

- Check your API key is valid
- Verify the channel handle exists
- Ensure port 3000 isn't already in use

### "Quota exceeded" error

- You've hit YouTube's daily API limit
- Wait 24 hours or get a higher quota from Google Cloud

### Changes not taking effect

- Some settings require a restart (see [Admin Panel Guide](admin.md))
- Clear the cache: `rm -rf cache_data/`
