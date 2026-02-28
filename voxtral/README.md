# Voxtral Audio Transcription Integration

This directory contains the integration of Mistral's Voxtral real-time audio transcription service into the Verne application.

## Overview

Voxtral is Mistral AI's real-time audio transcription model (`voxtral-mini-transcribe-realtime-2602`) optimized for live transcription with ultra-low latency and high accuracy.

## Features

- **Real-time transcription**: Stream audio and receive transcription as you speak
- **Low latency**: Configurable delay (240ms - 2400ms) for speed/accuracy tradeoff
- **High accuracy**: Optimized for natural speech transcription
- **WebSocket streaming**: Efficient real-time communication
- **Multiple endpoints**: Choose between full WebSocket implementation or simplified REST API

## Architecture

### Files Created

```
frontend-v2/
├── src/
│   ├── services/
│   │   └── voxtral.ts                    # Client-side Voxtral service
│   ├── app/(routes)/api/
│   │   ├── voxtral/
│   │   │   └── route.ts                  # Full WebSocket implementation with FFmpeg
│   │   └── voxtral-simple/
│   │       └── route.ts                  # Simplified REST API implementation
│   └── components/
│       └── query-block/
│           └── query-block.tsx           # Updated to support Voxtral provider
└── package.json                          # Updated with ws and fluent-ffmpeg
```

### Components

#### 1. Voxtral Service (`voxtral.ts`)

Client-side TypeScript service for interacting with Voxtral:

- `VoxtralClient` class for WebSocket communication
- `convertWebMToPCM()` function for audio format conversion
- `transcribeAudioServer()` for server-side transcription

#### 2. API Routes

**`/api/voxtral`** - Full WebSocket Implementation
- Converts WebM audio to PCM 16-bit format using FFmpeg
- Streams audio to Voxtral via WebSocket
- Handles real-time transcription events
- **Requires**: FFmpeg installed on server

**`/api/voxtral-simple`** - Simplified REST Implementation
- Attempts to send WebM audio directly
- Simpler setup without FFmpeg dependency
- May have limitations with audio format support

#### 3. Query Block Component

Updated to support multiple transcription providers:

```tsx
<QueryBlock
  transcriptionProvider="voxtral"  // or "elevenlabs" or "voxtral-simple"
  onSubmit={(text) => console.log(text)}
/>
```

## Setup

### 1. Install Dependencies

```bash
cd frontend-v2
bun install
```

New dependencies added:
- `ws` (^8.18.0) - WebSocket library
- `fluent-ffmpeg` (^2.1.3) - FFmpeg wrapper for audio conversion
- `@types/ws` (^8.5.13) - TypeScript types for ws
- `@types/fluent-ffmpeg` (^2.1.27) - TypeScript types for fluent-ffmpeg

### 2. Install FFmpeg (for `/api/voxtral` endpoint)

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html)

### 3. Configure Environment Variables

Add to `.env.local`:

```env
# Mistral API Key for Voxtral
MISTRAL_API_KEY=your_mistral_api_key_here
```

Get your API key from [Mistral AI Console](https://console.mistral.ai/)

### 4. Update Component Usage

In your page or component:

```tsx
import QueryBlock from "@/components/query-block/query-block";

export default function Page() {
  return (
    <QueryBlock
      transcriptionProvider="voxtral"
      onSubmit={(text) => {
        console.log("User query:", text);
      }}
    />
  );
}
```

## Usage

### Provider Options

Choose the transcription provider that best fits your needs:

#### `"voxtral"` (Recommended)
- Full WebSocket implementation
- Requires FFmpeg on server
- Best accuracy and format support
- Converts WebM → PCM 16-bit automatically

#### `"voxtral-simple"`
- Simplified implementation
- No FFmpeg required
- May have audio format limitations
- Good for testing and development

#### `"elevenlabs"`
- Original ElevenLabs implementation
- Uses Scribe v2 model
- Supports diarization
- Requires ElevenLabs API key

## Audio Format Requirements

Voxtral expects:
- **Encoding**: PCM 16-bit little-endian (pcm_s16le)
- **Sample Rate**: 16000 Hz (primary), also supports 8000/22050/44100/48000 Hz
- **Channels**: Mono
- **Chunk Size**: Configurable (e.g., 8KB chunks)

The browser records in WebM/Opus format, so server-side conversion is handled automatically.

## API Endpoints

### POST /api/voxtral

Transcribe audio using Voxtral with FFmpeg conversion.

**Request:**
```
Content-Type: multipart/form-data
Body: FormData with 'audio' field containing WebM audio file
```

**Response:**
```json
{
  "success": true,
  "transcription": "transcribed text here",
  "provider": "voxtral"
}
```

### POST /api/voxtral-simple

Simplified transcription endpoint.

**Request:** Same as above

**Response:**
```json
{
  "success": true,
  "transcription": "transcribed text here",
  "provider": "voxtral-simple"
}
```

## Configuration

### Transcription Delay

Adjust the `target_streaming_delay_ms` parameter in the API route:

```typescript
// In route.ts
target_streaming_delay_ms: 1200  // Default: 1200ms

// Options:
// 240ms  - Fastest, less accurate
// 1200ms - Balanced (default)
// 2400ms - Slowest, most accurate
```

### Audio Chunk Size

Adjust chunk size for streaming:

```typescript
const chunkSize = 8192; // 8KB chunks (default)
```

## Troubleshooting

### "MISTRAL_API_KEY not configured"

**Solution:** Add `MISTRAL_API_KEY` to your `.env.local` file.

### FFmpeg not found

**Solution:** Install FFmpeg on your server (see Setup section).

### Audio format errors

**Solution:** Try using `/api/voxtral-simple` endpoint or ensure FFmpeg is properly installed.

### WebSocket connection issues

**Solution:**
- Check your Mistral API key is valid
- Ensure your network allows WebSocket connections
- Verify firewall settings

### No transcription returned

**Solution:**
- Check audio file size (ensure it's not empty)
- Verify audio format is WebM/Opus
- Check server logs for detailed errors

## Performance

- **Latency**: ~240ms - 2400ms (configurable)
- **Accuracy**: Optimized for natural speech
- **Supported Languages**: Primarily English (check Mistral docs for full language support)
- **Max Audio Length**: Limited by WebSocket timeout (default: 30 seconds)

## Limitations

- **No diarization**: Unlike ElevenLabs Scribe, Voxtral real-time mode doesn't support speaker diarization
- **WebSocket only**: Voxtral requires WebSocket for real-time transcription
- **Format constraints**: Best results with PCM 16-bit audio

## Migration from ElevenLabs

To switch from ElevenLabs to Voxtral:

1. **Add Mistral API key** to environment variables
2. **Update component** to use `transcriptionProvider="voxtral"`
3. **Remove ElevenLabs dependency** (optional)

```tsx
// Before
<QueryBlock transcriptionProvider="elevenlabs" />

// After
<QueryBlock transcriptionProvider="voxtral" />
```

## Cost Comparison

- **Voxtral**: Check Mistral AI pricing for Voxtral real-time transcription
- **ElevenLabs**: Scribe v2 pricing

Refer to provider documentation for current pricing.

## References

- [Voxtral Documentation](https://docs.mistral.ai/capabilities/audio_transcription/realtime_transcription)
- [Mistral AI Console](https://console.mistral.ai/)
- [Mistral API Reference](https://docs.mistral.ai/api/)

## Support

For issues or questions:
- Check troubleshooting section above
- Review Mistral AI documentation
- Open an issue in the project repository
