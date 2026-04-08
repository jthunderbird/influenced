# Influenced - YouTube Channel Alternative Frontend

A modern, containerized web application that provides an alternative frontend for viewing YouTube channel content. Built with React, Node.js, Express, and the YouTube Data API v3.

## Overview

Influenced lets you create a branded, customized viewing experience for any YouTube channel. Perfect for content creators who want to showcase their work on their own domain, or for fans who want a cleaner, ad-free viewing experience.

### Features

- **Custom Branding** - Your logo, your colors, your domain
- **Full Content Access** - Videos, Shorts, Live streams, Playlists, Community posts
- **Responsive Design** - Works beautifully on desktop, tablet, and mobile
- **Admin Panel** - Configure everything through a web interface
- **Social Media Integration** - Link your Facebook, X, TikTok, Instagram
- **Dark/Light Themes** - Automatic or manual theme switching

## Quick Start

The fastest way to get started:

```bash
docker run -p 3000:3000 \
  -v $(pwd)/.env:/app/.env:rw \
  -v $(pwd)/cache_data:/app/.cache \
  jthunderbird/influenced:latest
```

Then open http://localhost:3000 in your browser.

> **Note:** You'll need a `.env` file with at minimum a YouTube API key and channel handle. See the [Getting Started Guide](docs/getting-started.md) for details.

## Documentation

- [Getting Started](docs/getting-started.md) - Basic setup and first run
- [Developer Guide](docs/developer.md) - Local development, building, Docker Compose
- [Admin Panel](docs/admin.md) - Configuration options and settings

## Screenshots

[Screenshots coming soon]

## Why "Influenced"?

Traditional YouTube embeds and interfaces come with ads, recommendations, and clutter. Influenced gives you a clean, focused way to present YouTube content on your own terms.

## License

MIT
