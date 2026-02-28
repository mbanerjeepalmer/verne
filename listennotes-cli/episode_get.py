#!/usr/bin/env python3
"""
ListenNotes Get Episode CLI
Get detailed information about a specific episode by ID.
"""

import sys
import json
import argparse
from datetime import datetime
import requests

from listennotes_api import ListenNotesAPI


def main():
    """Main CLI entry point for getting episode details."""
    parser = argparse.ArgumentParser(
        description="Get detailed episode information by ID",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  episode-get "0e4c4740b1754701b6832ef04413ca4e" --mock
  episode-get "0e4c4740b1754701b6832ef04413ca4e" --show-transcript
  episode-get "0e4c4740b1754701b6832ef04413ca4e" --output pretty
        """
    )

    # Required argument
    parser.add_argument(
        "episode_id",
        help="Episode identifier"
    )

    # Transcript option
    parser.add_argument(
        "--show-transcript",
        action="store_true",
        help="Include transcript data (PRO/ENTERPRISE plan required)"
    )

    # Output format
    parser.add_argument(
        "--output", "-o",
        choices=["json", "pretty", "summary"],
        default="json",
        help="Output format (default: json)"
    )

    parser.add_argument(
        "--api-key",
        help="ListenNotes API key (default: LISTENNOTES_API_KEY env var)"
    )

    parser.add_argument(
        "--mock",
        action="store_true",
        help="Use mock/test server (no API key required, for testing)"
    )

    args = parser.parse_args()

    # Build API parameters
    api_params = {
        "show_transcript": 1 if args.show_transcript else 0,
    }

    # Make API request
    try:
        client = ListenNotesAPI(api_key=args.api_key, use_mock=args.mock)
        result = client.get_episode(args.episode_id, **api_params)

        # Output results
        if args.output == "json":
            print(json.dumps(result, indent=2))
        elif args.output == "pretty":
            print(f"\nEpisode: {result.get('title', 'N/A')}")
            print("=" * 80)

            # Podcast info
            podcast = result.get('podcast', {})
            podcast_title = podcast.get('title', 'N/A')
            print(f"Podcast: {podcast_title}")

            publisher = podcast.get('publisher', 'N/A')
            print(f"Publisher: {publisher}")

            # Episode details
            pub_date = result.get('pub_date_ms')
            if pub_date:
                date_str = datetime.fromtimestamp(pub_date / 1000).strftime('%Y-%m-%d %H:%M:%S')
                print(f"Published: {date_str}")

            length = result.get('audio_length_sec')
            if length:
                minutes = length // 60
                seconds = length % 60
                print(f"Length: {minutes}m {seconds}s")

            audio_url = result.get('audio')
            if audio_url:
                print(f"Audio URL: {audio_url}")

            link = result.get('link')
            if link:
                print(f"Episode Link: {link}")

            # RSS feed info (from podcast object)
            rss = podcast.get('rss')
            if rss:
                print(f"Podcast RSS Feed: {rss}")

            description = result.get('description', 'N/A')
            if description:
                if len(description) > 300:
                    description = description[:300] + "..."
                print(f"\nDescription:\n{description}")

            print(f"\nEpisode ID: {result.get('id', 'N/A')}")
            print(f"Podcast ID: {podcast.get('id', 'N/A')}")

            # Show transcript if available
            transcript = result.get('transcript')
            if transcript:
                print("\n" + "=" * 80)
                print("TRANSCRIPT")
                print("=" * 80)
                print(transcript[:1000])  # Show first 1000 characters
                if len(transcript) > 1000:
                    print(f"\n... (transcript truncated, {len(transcript)} total characters)")
                    print("Use --output json to see full transcript")
            elif args.show_transcript:
                print("\nNote: Transcript was requested but not available.")
                print("Transcripts require PRO/ENTERPRISE plan or may not exist for this episode.")

        elif args.output == "summary":
            title = result.get('title', 'N/A')
            podcast_title = result.get('podcast', {}).get('title', 'N/A')

            print(f"Episode: {title}")
            print(f"Podcast: {podcast_title}")

            pub_date = result.get('pub_date_ms')
            if pub_date:
                date_str = datetime.fromtimestamp(pub_date / 1000).strftime('%Y-%m-%d')
                print(f"Published: {date_str}")

            length = result.get('audio_length_sec')
            if length:
                print(f"Length: {length // 60} minutes")

    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except requests.exceptions.HTTPError as e:
        print(f"API Error: {e}", file=sys.stderr)
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_data = e.response.json()
                print(f"Details: {error_data}", file=sys.stderr)
            except:
                pass
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
