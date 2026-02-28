#!/usr/bin/env python3
"""
ListenNotes Podcast Recommendations CLI
Get podcast recommendations based on a podcast ID.
"""

import sys
import json
import argparse
import requests

from listennotes_api import ListenNotesAPI


def main():
    """Main CLI entry point for podcast recommendations."""
    parser = argparse.ArgumentParser(
        description="Get podcast recommendations based on a podcast ID",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  podcast-recommendations "25212ac3c53240a880dd5032e547047b" --mock
  podcast-recommendations "25212ac3c53240a880dd5032e547047b" --safe-mode
  podcast-recommendations "25212ac3c53240a880dd5032e547047b" --output pretty
        """
    )

    # Required argument
    parser.add_argument(
        "podcast_id",
        help="Podcast identifier"
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
        result = client.get_podcast_recommendations(args.podcast_id, **api_params)

        # Output results
        if args.output == "json":
            print(json.dumps(result, indent=2))
        elif args.output == "pretty":
            recommendations = result.get('recommendations', [])
            print(f"\nPodcast Recommendations (up to 8 shown)")
            print("=" * 80)

            for idx, podcast in enumerate(recommendations, 1):
                print(f"\n{idx}. {podcast.get('title', 'N/A')}")

                publisher = podcast.get('publisher', 'N/A')
                print(f"   Publisher: {publisher}")

                total_episodes = podcast.get('total_episodes')
                if total_episodes:
                    print(f"   Episodes: {total_episodes}")

                listen_score = podcast.get('listen_score')
                if listen_score:
                    print(f"   Listen Score: {listen_score}")

                description = podcast.get('description', '')
                if description and len(description) > 150:
                    description = description[:150] + "..."
                if description:
                    print(f"   Description: {description}")

                print(f"   ID: {podcast.get('id', 'N/A')}")

        elif args.output == "summary":
            recommendations = result.get('recommendations', [])
            print(f"Found {len(recommendations)} podcast recommendations")

            if recommendations:
                print("\nRecommended podcasts:")
                for idx, podcast in enumerate(recommendations, 1):
                    title = podcast.get('title', 'N/A')
                    publisher = podcast.get('publisher', 'N/A')
                    print(f"{idx}. {title} - {publisher}")

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
