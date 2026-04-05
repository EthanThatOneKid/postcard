# Postcard API Documentation

> Official Hosted Docs: [Mintlify](https://www.mintlify.com/postcardhq/postcard)
> Last updated: April 2026

Postcard provides a public REST API for forensic verification of social media posts.

## Base URL

```
https://postcard.fartlabs.org/api/postcards
```

## OpenAPI specification

Developers can generate clients using our [OpenAPI JSON specification](/openapi.json).

## Interactive API reference

We provide an interactive API reference powered by [Scalar](https://scalar.com):

- **Local:** Run `npm run dev` and visit `http://localhost:3000/api/reference`
- **Hosted:** Visit [https://postcard.fartlabs.org/api/reference](https://postcard.fartlabs.org/api/reference)

## Endpoints

### GET /api/postcards

Retrieves the forensic verification result for a given URL. Use for polling postcard status.

**Query parameters:**

| Parameter | Required | Description                         |
| :-------- | :------- | :---------------------------------- |
| `url`     | Yes      | The social media post URL to verify |

**Response:**

Returns JSON with postcard status and optionally the full report.

**Processing response (200):**

```json
{
  "status": "processing",
  "stage": "corroborating",
  "message": "Searching for primary sources...",
  "progress": 0.4
}
```

**Completed response (200):**

```json
{
  "status": "completed",
  "postcard": {
    "platform": "X",
    "mainText": "Post content here...",
    "username": "@username",
    "timestampText": "2h ago"
  },
  "markdown": "# Post content...",
  "triangulation": {
    "targetUrl": "https://x.com/user/status/123",
    "queries": []
  },
  "audit": {
    "originScore": 0.85,
    "temporalScore": 0.9,
    "totalScore": 0.875,
    "auditLog": []
  },
  "corroboration": {
    "primarySources": [],
    "queriesExecuted": [],
    "verdict": "verified",
    "summary": "Content has been corroborated by trusted sources.",
    "confidenceScore": 0.85,
    "corroborationLog": []
  },
  "timestamp": "2026-04-04T12:00:00.000Z",
  "analysisId": "abc-123"
}
```

**Failed response (200):**

```json
{
  "status": "failed",
  "error": "Unable to access this content. Login or signup wall detected."
}
```

**Not found (404):**

```json
{
  "status": "not_found",
  "error": "Analysis not found. POST to /api/postcards to initiate a new trace."
}
```

### POST /api/postcards

Submits a new URL for forensic verification. Creates a postcard and returns immediately with a postcardId. Poll GET endpoint for status updates.

**Headers:**

| Header         | Required | Description        |
| :------------- | :------- | :----------------- |
| `Content-Type` | Yes      | `application/json` |

**Body:**

| Field          | Required | Type    | Description                        |
| :------------- | :------- | :------ | :--------------------------------- |
| `url`          | Yes      | string  | The social media post URL          |
| `userApiKey`   | No       | string  | Optional API key for rate limiting |
| `forceRefresh` | No       | boolean | Force re-analysis even if cached   |

**Request:**

```json
{
  "url": "https://x.com/user/status/123",
  "userApiKey": "optional-api-key",
  "forceRefresh": false
}
```

**Response (202 Accepted):**

```json
{
  "postcardId": "abc-123",
  "status": "processing",
  "message": "Analysis started"
}
```

**Response (200):**

If a processing job already exists for this URL, returns that job instead of creating a new one:

```json
{
  "postcardId": "abc-123",
  "status": "processing",
  "stage": "starting",
  "message": "Initializing...",
  "progress": 0
}
```

If a completed analysis exists and `forceRefresh` is not set, returns cached results:

```json
{
  "postcardId": "abc-123",
  "status": "completed",
  "postcard": { ... },
  "markdown": "...",
  ...
}
```

### Polling for Status

1. Call `POST /api/postcards` with the URL to start analysis
2. Use the returned `postcardId` to poll `GET /api/postcards?url=...` every 3-5 seconds
3. When `status` changes to `completed`, the full report is in the response
4. If `status` is `failed`, check the `error` field for details

**Example polling loop:**

```bash
# Start analysis
JOB=$(curl -s -X POST "https://postcard.fartlabs.org/api/postcards" \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://x.com/user/status/123" }' | jq -r '.postcardId')

# Poll for completion
while true; do
  RESPONSE=$(curl -s "https://postcard.fartlabs.org/api/postcards?url=https://x.com/user/status/123")
  STATUS=$(echo "$RESPONSE" | jq -r '.status')

  if [ "$STATUS" = "completed" ]; then
    echo "$RESPONSE" | jq '.postcard'
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "Error: $(echo '$RESPONSE' | jq -r '.error')"
    break
  fi

  echo "Progress: $(echo '$RESPONSE' | jq -r '.progress // 0')"
  sleep 3
done
```

## CORS

The API includes CORS headers for cross-origin requests:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept
```

## Rate Limits

- Default: 60 requests per minute per IP (development)
- Production limits configured via Vercel Edge/Serverless functions

## Supported Platforms

- X (twitter.com)
- Reddit
- YouTube
- Instagram
- Bluesky
- Threads
- Generic (via Jina Reader fallback)
