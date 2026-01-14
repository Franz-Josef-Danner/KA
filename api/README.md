# API Documentation

This directory contains the API endpoints for the KA System.

## Endpoints

### Save Firmenliste
**Endpoint:** `POST /api/save-firmenliste.php`

Saves the company list data to the server.

**Request:**
- Method: POST
- Content-Type: application/json
- Body: Array of company objects

**Response:**
```json
{
  "success": true,
  "message": "Data saved successfully",
  "timestamp": "2026-01-14T01:00:00+00:00"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### Load Firmenliste
**Endpoint:** `GET /api/load-firmenliste.php`

Loads the company list data from the server.

**Request:**
- Method: GET

**Response:**
```json
{
  "success": true,
  "data": [ /* array of company objects */ ],
  "timestamp": "2026-01-14T01:00:00+00:00"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Security

- The API uses CORS headers to allow cross-origin requests
- The data directory is protected by .htaccess to prevent direct access
- JSON files cannot be accessed directly from the web
- Automatic backup is created before each save operation

## Data Storage

Data is stored in the `/data` directory as JSON files:
- `firmenliste.json` - Current company list data
- `firmenliste.backup.json` - Backup of the previous state

## Requirements

- PHP 7.0 or higher
- Web server with .htaccess support (Apache)
- Write permissions for the `/data` directory
