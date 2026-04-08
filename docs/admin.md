# Admin Panel Guide

The Admin Panel provides a web interface to configure all aspects of Influenced without editing files manually.

## Accessing the Admin Panel

1. Navigate to `/admin/login`
2. Log in with credentials (default: `admin` / `Password!123`)
3. You'll be redirected to `/admin` with the settings panel

## Settings Overview

All configurable settings are organized by category. Each setting shows:
- **Key name** - The environment variable name
- **Description** - What this setting controls
- **Restart required badge** - Indicates if changes need a restart

### Settings That Require Restart

These settings will trigger a full server restart when changed:

- `YOUTUBE_API_KEY` - Your YouTube API key
- `YOUTUBE_CHANNEL_HANDLE` - The channel to display
- `ADMIN_USERNAME` - Admin login username
- `ADMIN_PASSWORD` - Admin login password

### Settings That Apply Immediately

These settings take effect without restart:

- `FACEBOOK_HANDLE` - Facebook username
- `X_HANDLE` - X/Twitter username  
- `TIKTOK_HANDLE` - TikTok username
- `INSTAGRAM_HANDLE` - Instagram username
- `RECENT_DAYS` - Days to look back
- `RECENT_VIDEOS` - Max videos on home
- `RECENT_SHORTS` - Max shorts on home
- `ALLOWED_ORIGINS` - CORS settings
- `USE_HELMET` - Security headers
- `USE_RATE_LIMIT` - Rate limiting

## Making Changes

1. **Edit a value** - Type in any field or use dropdowns for booleans
2. **Click "Save Changes"** - The save button appears when you have unsaved changes
3. **Wait for restart** - The page will refresh automatically

### Immediate vs Restart Settings

- **Immediate settings**: Page refreshes and new values are applied
- **Restart settings**: Server restarts automatically, cache is cleared, and fresh data is fetched

## Security Settings

### USE_HELMET

Enables HTTP security headers via Helmet.js. Recommended for production.

### USE_RATE_LIMIT

Enables rate limiting (100 requests per 15 minutes per IP). Recommended for production.

### ALLOWED_ORIGINS

Comma-separated list of allowed CORS origins. Leave empty to allow all origins.

**Example:**
```
https://example.com,https://www.example.com
```

## Changing Admin Credentials

1. Go to Admin Panel
2. Update `ADMIN_USERNAME` and/or `ADMIN_PASSWORD`
3. Save and restart
4. Use new credentials to log in

## Troubleshooting

### Changes not taking effect

1. Check if "Restart required" badge is shown - you need to save for restart to happen
2. Clear browser cache
3. Check container logs: `docker logs influenced`

### Locked out of Admin

If you forget your admin credentials, edit the `.env` file directly:

```bash
ADMIN_USERNAME=myuser
ADMIN_PASSWORD=mypassword
```

Then restart the container.

### Server won't restart after changes

Check container logs for errors:
```bash
docker logs influenced
```

Common issues:
- Invalid API key format
- Invalid channel handle
- YouTube API quota exceeded
