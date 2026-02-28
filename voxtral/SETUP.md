# Voxtral Setup Guide

Quick start guide for setting up Voxtral transcription in Verne.

## Prerequisites

- Node.js 18+ or Bun
- Mistral AI API key
- FFmpeg (for full implementation)

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
cd frontend-v2
bun install
```

### 2. Configure API Key

Create or update `.env.local`:

```bash
echo "MISTRAL_API_KEY=your_key_here" >> .env.local
```

### 3. Choose Implementation

#### Option A: Simplified (No FFmpeg)

Use the simplified endpoint (may have limitations):

```tsx
<QueryBlock transcriptionProvider="voxtral-simple" />
```

#### Option B: Full (Requires FFmpeg)

Install FFmpeg:

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg
```

Use the full endpoint:

```tsx
<QueryBlock transcriptionProvider="voxtral" />
```

### 4. Start Development Server

```bash
make run-frontend
```

### 5. Test It

1. Open http://localhost:3000
2. Click the microphone button
3. Speak into your microphone
4. Stop recording
5. See the transcription appear in the text box

## Verify Installation

### Check Dependencies

```bash
# Check if ws is installed
bun pm ls | grep ws

# Check if fluent-ffmpeg is installed
bun pm ls | grep fluent-ffmpeg

# Check FFmpeg (if using full implementation)
ffmpeg -version
```

### Check Environment Variables

```bash
# Print first few characters of API key
echo $MISTRAL_API_KEY | cut -c1-10
```

### Test API Endpoint

```bash
# Test with a small audio file
curl -X POST http://localhost:3000/api/voxtral-simple \
  -F "audio=@test-audio.webm"
```

## Common Issues

### Issue: "MISTRAL_API_KEY not configured"

**Fix:**
```bash
# Make sure .env.local exists and has the key
cat .env.local | grep MISTRAL_API_KEY

# Restart the dev server after adding the key
make run-frontend
```

### Issue: FFmpeg not found

**Fix:**
```bash
# Install FFmpeg
brew install ffmpeg  # macOS
sudo apt-get install ffmpeg  # Linux

# Verify installation
which ffmpeg
```

### Issue: WebSocket connection fails

**Fix:**
- Check API key is valid
- Test API key with curl:
  ```bash
  curl https://api.mistral.ai/v1/models \
    -H "Authorization: Bearer $MISTRAL_API_KEY"
  ```

### Issue: No transcription returned

**Fix:**
- Check browser console for errors
- Check server logs: `make run-frontend`
- Try the simplified endpoint first
- Verify microphone permissions in browser

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Configure transcription delay for accuracy/speed tradeoff
- Integrate with your application logic
- Deploy to production

## Getting Help

- Check the [README.md](./README.md) troubleshooting section
- Review Mistral AI documentation: https://docs.mistral.ai/
- Open an issue in the repository

## Production Deployment

### Environment Variables

Set in your hosting platform:

```
MISTRAL_API_KEY=your_production_key
NODE_ENV=production
```

### FFmpeg Installation

Ensure FFmpeg is available in your production environment:

- **Vercel**: Add to build command or use Edge functions
- **Docker**: Include in Dockerfile
- **Traditional hosting**: Install via package manager

### Monitoring

Monitor transcription usage and costs:

```typescript
// Add logging to track usage
console.log(`Transcription: ${transcription.length} chars`);
```

## Cost Management

- Monitor API usage in Mistral AI Console
- Set usage alerts
- Consider caching common transcriptions
- Implement rate limiting if needed

## Security

- Never commit `.env.local` to version control
- Use environment variables for all API keys
- Implement authentication for API endpoints
- Validate audio file sizes and formats
- Add rate limiting to prevent abuse
