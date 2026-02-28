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
  "event_type": "conversation" | "podcast",
  "message": "<string - only applies to conversation>",
  "podcast_data": {
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
| `event_type` | string | Yes | Either `"conversation"` or `"podcast"` |
| `message` | string | Conditional | Required when `event_type` is `"conversation"` |
| `podcast_data` | object | Conditional | Required when `event_type` is `"podcast"` |

### Podcast Data Structure

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Podcast name |
| `src` | string | Audio source URL |
| `duration` | number | Total duration in seconds |
| `cover_image` | string | Cover image URL |
| `start_time` | number | Start timestamp in seconds |
| `end_time` | number | End timestamp in seconds |

## Example Requests

### Conversation Event

```json
{
  "event_type": "conversation",
  "message": "Hello, this is a conversation message"
}
```

### Podcast Event

```json
{
  "event_type": "podcast",
  "podcast_data": {
    "name": "Tech Talk",
    "src": "https://example.com/audio.mp3",
    "duration": 3600,
    "cover_image": "https://example.com/cover.jpg",
    "start_time": 120,
    "end_time": 300
  }
}