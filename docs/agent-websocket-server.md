# WebSocket Server Broadcast Endpoint

## Overview

The WebSocket server exposes a `/broadcast` POST endpoint for sending messages to connected clients.

## Endpoint

```
POST /broadcast
```

## Request Payload

```json
{
  "event_type": "<string>",
  "podcast": {
    "name": "<string>",
    "src": "<string>",
    "duration": "<number>",
    "cover_image": "<string>",
    "start_time": "<number>",
    "end_time": "<number>"
  }
}
```

## Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event_type` | string | Yes | The type of event being broadcast |
| `podcast` | object | Yes | The podcast data to broadcast |

### Podcast Structure

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Podcast name |
| `src` | string | Audio source URL |
| `duration` | number | Total duration in seconds |
| `cover_image` | string | Cover image URL |
| `start_time` | number | Start timestamp in seconds |
| `end_time` | number | End timestamp in seconds |

## Broadcast Message

When a broadcast is sent, the following message is delivered to all connected WebSocket clients:

```json
{
  "event_type": "<string>",
  "payload": {
    "podcast": {
      "name": "<string>",
      "src": "<string>",
      "duration": "<number>",
      "cover_image": "<string>",
      "start_time": "<number>",
      "end_time": "<number>"
    }
  }
}
```

## Example Request

```json
{
  "event_type": "podcast",
  "podcast": {
    "name": "Tech Talk",
    "src": "https://example.com/audio.mp3",
    "duration": 3600,
    "cover_image": "https://example.com/cover.jpg",
    "start_time": 120,
    "end_time": 300
  }
}
```
