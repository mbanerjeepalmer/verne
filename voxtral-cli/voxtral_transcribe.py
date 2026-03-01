#!/usr/bin/env python3
"""
Voxtral Transcription CLI
Transcribe podcast audio with speaker diarization using Voxtral on Amazon Bedrock.
"""

import sys
import os
import json
import base64
import argparse
import requests

MODELS = {
    "mini": "mistral.voxtral-mini-3b-2507",
    "small": "mistral.voxtral-small-24b-2507",
}

REGION = "us-west-2"

DEFAULT_PROMPT = (
    "Transcribe the following audio with speaker diarization. "
    "Label each speaker (e.g. Speaker 1, Speaker 2) and include timestamps "
    "in [MM:SS] format at natural paragraph breaks. "
    "Output the transcript as plain text."
)

# Map common Content-Type values and extensions to Bedrock-supported audio formats
CONTENT_TYPE_MAP = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/mp4": "mp4",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/flac": "flac",
}

EXTENSION_MAP = {
    ".mp3": "mp3",
    ".mp4": "mp4",
    ".m4a": "mp4",
    ".wav": "wav",
    ".webm": "webm",
    ".ogg": "ogg",
    ".flac": "flac",
}


def detect_format(content_type: str | None, url: str) -> str:
    """Detect audio format from Content-Type header or URL extension."""
    if content_type:
        ct = content_type.split(";")[0].strip().lower()
        if ct in CONTENT_TYPE_MAP:
            return CONTENT_TYPE_MAP[ct]

    from urllib.parse import urlparse
    path = urlparse(url).path.lower()
    for ext, fmt in EXTENSION_MAP.items():
        if path.endswith(ext):
            return fmt

    return "mp3"  # sensible default for podcast audio


def main():
    parser = argparse.ArgumentParser(
        description="Transcribe audio with speaker diarization using Voxtral on Amazon Bedrock",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  voxtral-transcribe https://example.com/episode.mp3
  voxtral-transcribe https://example.com/episode.mp3 --model mini
  voxtral-transcribe https://example.com/episode.mp3 --output json
  voxtral-transcribe https://example.com/episode.mp3 --prompt "Summarise this audio"
        """,
    )

    parser.add_argument("audio_url", help="URL of the audio file to transcribe")
    parser.add_argument(
        "--model", "-m",
        choices=["mini", "small"],
        default="small",
        help="Voxtral model size (default: small)",
    )
    parser.add_argument(
        "--output", "-o",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)",
    )
    parser.add_argument(
        "--prompt", "-p",
        default=DEFAULT_PROMPT,
        help="Custom prompt for the model",
    )

    args = parser.parse_args()

    api_key = os.environ.get("AWS_BEARER_TOKEN_BEDROCK")
    if not api_key:
        print("Error: AWS_BEARER_TOKEN_BEDROCK environment variable is required", file=sys.stderr)
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
    audio_format = detect_format(content_type, args.audio_url)
    audio_b64 = base64.b64encode(audio_resp.content).decode("ascii")

    print(f"Audio: {len(audio_resp.content)} bytes, format: {audio_format}", file=sys.stderr)

    # Build Bedrock Converse request
    model_id = MODELS[args.model]
    url = f"https://bedrock-runtime.{REGION}.amazonaws.com/model/{model_id}/converse"

    body = {
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "audio": {
                            "format": audio_format,
                            "source": {"bytes": audio_b64},
                        }
                    },
                    {"text": args.prompt},
                ],
            }
        ],
        "inferenceConfig": {"temperature": 0.0},
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    print(f"Calling Bedrock ({model_id})...", file=sys.stderr)
    try:
        resp = requests.post(url, headers=headers, json=body, timeout=300)
    except requests.exceptions.RequestException as e:
        print(f"Error calling Bedrock: {e}", file=sys.stderr)
        sys.exit(1)

    if resp.status_code != 200:
        print(f"Bedrock error {resp.status_code}: {resp.text}", file=sys.stderr)
        sys.exit(1)

    result = resp.json()

    # Extract text from response
    output_text = ""
    for block in result.get("output", {}).get("message", {}).get("content", []):
        if "text" in block:
            output_text += block["text"]

    if args.output == "json":
        out = {
            "model": model_id,
            "transcript": output_text,
            "usage": result.get("usage", {}),
        }
        print(json.dumps(out, indent=2))
    else:
        print(output_text)


if __name__ == "__main__":
    main()
