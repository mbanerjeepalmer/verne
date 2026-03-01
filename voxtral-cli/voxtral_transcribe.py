#!/usr/bin/env python3
"""
Voxtral Transcription CLI
Transcribe podcast audio with speaker diarization using Voxtral via Mistral API.
"""

import sys
import os
import json
import argparse
import requests

MISTRAL_API_URL = "https://api.mistral.ai/v1/audio/transcriptions"

MODELS = {
    "mini": "voxtral-mini-transcribe-2507",
}

EXTENSION_TO_MIME = {
    ".mp3": "audio/mpeg",
    ".mp4": "audio/mp4",
    ".m4a": "audio/mp4",
    ".wav": "audio/wav",
    ".webm": "audio/webm",
    ".ogg": "audio/ogg",
    ".flac": "audio/flac",
}


def detect_mime(content_type: str | None, url: str) -> str:
    """Detect MIME type from Content-Type header or URL extension."""
    if content_type:
        ct = content_type.split(";")[0].strip().lower()
        if ct.startswith("audio/"):
            return ct

    from urllib.parse import urlparse
    path = urlparse(url).path.lower()
    for ext, mime in EXTENSION_TO_MIME.items():
        if path.endswith(ext):
            return mime

    return "audio/mpeg"


def main():
    parser = argparse.ArgumentParser(
        description="Transcribe audio using Voxtral via Mistral API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  voxtral-transcribe https://example.com/episode.mp3
  voxtral-transcribe https://example.com/episode.mp3 --output json
        """,
    )

    parser.add_argument("audio_url", help="URL of the audio file to transcribe")
    parser.add_argument(
        "--model", "-m",
        choices=list(MODELS.keys()),
        default="mini",
        help="Voxtral model size (default: mini)",
    )
    parser.add_argument(
        "--output", "-o",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)",
    )

    args = parser.parse_args()

    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        print("Error: MISTRAL_API_KEY environment variable is required", file=sys.stderr)
        sys.exit(1)

    # Download audio
    print(f"Downloading audio from {args.audio_url}...", file=sys.stderr)
    try:
        audio_resp = requests.get(args.audio_url, timeout=120)
        audio_resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error downloading audio: {e}", file=sys.stderr)
        sys.exit(1)

    content_type = audio_resp.headers.get("Content-Type")
    mime = detect_mime(content_type, args.audio_url)
    print(f"Audio: {len(audio_resp.content)} bytes, type: {mime}", file=sys.stderr)

    # Call Mistral transcription API
    model_id = MODELS[args.model]
    print(f"Transcribing ({model_id})...", file=sys.stderr)
    try:
        resp = requests.post(
            MISTRAL_API_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            data={"model": model_id},
            files={"file": ("audio.mp3", audio_resp.content, mime)},
            timeout=300,
        )
    except requests.exceptions.RequestException as e:
        print(f"Error calling Mistral API: {e}", file=sys.stderr)
        sys.exit(1)

    if resp.status_code != 200:
        print(f"Mistral API error {resp.status_code}: {resp.text}", file=sys.stderr)
        sys.exit(1)

    result = resp.json()

    if args.output == "json":
        print(json.dumps(result, indent=2))
    else:
        print(result.get("text", ""))


if __name__ == "__main__":
    main()
