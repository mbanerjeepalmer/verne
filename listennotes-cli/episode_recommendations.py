#!/usr/bin/env python3
"""
ListenNotes Episode Recommendations CLI
Get episode recommendations based on an episode ID.
"""

import sys
import json
import argparse
from datetime import datetime
import requests

from listennotes_api import ListenNotesAPI


def main():
    """Main CLI entry point for episode recommendations."""
    parser = argparse.ArgumentParser(
        description="Get episode recommendations based on an episode ID",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  episode-recommendations "914a9deafa5340eeaa2859c77f275799" --mock
  episode-recommendations "914a9deafa5340eeaa2859c77f275799" --safe-mode
  episode-recommendations "914a9deafa5340eeaa2859c77f275799" --output pretty
        """
    )

    # Required argument
    parser.add_argument(
        "episode_id",
        help="Episode identifier"
    )

    # Boolean filters
    parser.add_argument(
        "--safe-mode",
        action="store_true",
        help="Exclude explicit content"
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
        "safe_mode": 1 if args.safe_mode else 0,
    }

    # Make API request
    try:
        client = ListenNotesAPI(api_key=args.api_key, use_mock=args.mock)
        result = client.get_episode_recommendations(args.episode_id, **api_params)

        # Output results
        if args.output == "json":
            print(json.dumps(result, indent=2))
        elif args.output == "pretty":
            recommendations = result.get('recommendations', [])
            print(f"\nEpisode Recommendations (up to 8 shown)")
            print("=" * 80)

            for idx, episode in enumerate(recommendations, 1):
                print(f"\n{idx}. {episode.get('title', 'N/A')}")

                podcast = episode.get('podcast', {})
                podcast_title = podcast.get('title', 'N/A')
                print(f"   Podcast: {podcast_title}")

                pub_date = episode.get('pub_date_ms')
                if pub_date:
                    date_str = datetime.fromtimestamp(pub_date / 1000).strftime('%Y-%m-%d')
                    print(f"   Published: {date_str}")

                length = episode.get('audio_length_sec')
                if length:
                    print(f"   Length: {length // 60} min")

                description = episode.get('description', '')
                if description and len(description) > 150:
                    description = description[:150] + "..."
                if description:
                    print(f"   Description: {description}")

                print(f"   Episode ID: {episode.get('id', 'N/A')}")
                print(f"   Podcast ID: {podcast.get('id', 'N/A')}")

        elif args.output == "summary":
            recommendations = result.get('recommendations', [])
            print(f"Found {len(recommendations)} episode recommendations")

            if recommendations:
                print("\nRecommended episodes:")
                for idx, episode in enumerate(recommendations, 1):
                    title = episode.get('title', 'N/A')
                    podcast_title = episode.get('podcast', {}).get('title', 'N/A')
                    print(f"{idx}. {title} - {podcast_title}")

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
