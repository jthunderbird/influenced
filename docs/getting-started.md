# Getting Started with Influenced

This guide covers the basics to get Influenced up and running for proof-of-concept purposes.

## Prerequisites

- Docker installed on your machine
- A YouTube Data API v3 key (free from Google Cloud Console)

### Getting a YouTube API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Search for and enable "YouTube Data API v3"
4. Go to Credentials → Create Credentials → API Key
5. Copy your API key

## Quick Start (Docker Hub Image)

The fastest way to run Influenced:

```bash
# Create a minimal .env file
echo 'YOUTUBE_API_KEY=your_api_key_here
YOUTUBE_CHANNEL_HANDLE=@your_channel' > .env

# Create cache directory
mkdir -p cache_data

# Run the container
docker run -p 3000:3000 \
  -v $(pwd)/.env:/app/.env:rw \
  -v $(pwd)/cache_data:/app/.cache \
  jthunderbird/influenced:latest
```

Open http://localhost:3000 in your browser.

## Environment Variables

These are the basic variables needed to run:

| Variable | Required | Description |
|----------|----------|-------------|
| `YOUTUBE_API_KEY` | Yes | Your YouTube Data API v3 key |
| `YOUTUBE_CHANNEL_HANDLE` | Yes | Channel handle (e.g., `@mkbhd`) or channel ID |
| `FACEBOOK_HANDLE` | No | Facebook username (without @) |
| `X_HANDLE` | No | X/Twitter username (without @) |
| `TIKTOK_HANDLE` | No | TikTok username (without @) |
| `INSTAGRAM_HANDLE` | No | Instagram username (without @) |
| `RECENT_DAYS` | No | Days to look back for recent content (default: 7) |
| `RECENT_VIDEOS` | No | Max videos on home page (default: 10) |
| `RECENT_SHORTS` | No | Max shorts on home page (default: 10) |

## Docker Compose (Recommended)

For easier management, use Docker Compose:

```yaml
# docker-compose.yml
services:
  influenced:
    image: jthunderbird/influenced:latest
    ports:
      - "3000:3000"
    volumes:
      - ./.env:/app/.env:rw
      - ./cache_data:/app/.cache
```

```bash
docker compose up -d
```

## Accessing the App

- Main app: http://localhost:3000
- Admin panel: http://localhost:3000/admin/login
- Default admin credentials: `admin` / `Password!123`

## Next Steps

- See the [Admin Panel Guide](admin.md) for configuring your channel
- See the [Developer Guide](developer.md) for local development
