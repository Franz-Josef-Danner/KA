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

### Save Artikellisten
**Endpoint:** `POST /api/save-artikellisten.php`

Saves the article lists data to the server. Article lists are keyed by Firmen_ID and reference the company list.

**Request:**
- Method: POST
- Content-Type: application/json
- Body: Object with Firmen_ID as keys and article list objects as values

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

### Load Artikellisten
**Endpoint:** `GET /api/load-artikellisten.php`

Loads the article lists data from the server. Returns an object with Firmen_ID as keys.

**Request:**
- Method: GET

**Response:**
```json
{
  "success": true,
  "data": { /* object with Firmen_ID keys and article list values */ },
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

### Save Customer Accounts
**Endpoint:** `POST /api/save-customer-accounts.php`

Saves customer account data to the server. Customer accounts are used for customer login to their Kundenbereich.

**Request:**
- Method: POST
- Content-Type: application/json
- Body: Array of customer account objects

**Response:**
```json
{
  "success": true,
  "message": "Data saved successfully",
  "timestamp": "2026-01-14T02:00:00+00:00"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### Load Customer Accounts
**Endpoint:** `GET /api/load-customer-accounts.php`

Loads customer account data from the server. Returns accounts for all customers.

**Request:**
- Method: GET

**Response:**
```json
{
  "success": true,
  "data": [ /* array of customer account objects */ ],
  "timestamp": "2026-01-14T02:00:00+00:00"
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
- `firmenliste.json` - Current company list data (array of company objects)
- `firmenliste.backup.json` - Backup of the previous company list state
- `artikellisten.json` - Article lists data (object keyed by Firmen_ID)
- `artikellisten.backup.json` - Backup of the previous article lists state
- `customer-accounts.json` - Customer account data (array of account objects)
- `customer-accounts.backup.json` - Backup of the previous customer accounts state

Article lists reference the company list via Firmen_ID. Each article list contains:
- `firmenId` - Reference to company in firmenliste
- `firmenName` - Company name (for convenience)
- `created` - ISO timestamp of creation
- `modified` - ISO timestamp of last modification
- `items` - Array of article items

Customer accounts contain:
- `firmenId` - Reference to company in firmenliste
- `email` - Login email for the customer
- `firmenName` - Company name (for convenience)
- `password` - Hashed password (SHA-256)
- `createdAt` - ISO timestamp of account creation
- `updatedAt` - ISO timestamp of last update

## Requirements

- PHP 7.0 or higher
- Web server with .htaccess support (Apache)
- Write permissions for the `/data` directory
