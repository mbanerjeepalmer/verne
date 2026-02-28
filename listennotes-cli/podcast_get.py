#!/usr/bin/env python3
"""
ListenNotes Get Podcast CLI
Get detailed information about a specific podcast by ID.
"""

import sys
import json
import argparse
from datetime import datetime
import requests

from listennotes_api import ListenNotesAPI


def main():
    """Main CLI entry point for getting podcast details."""
    parser = argparse.ArgumentParser(
        description="Get detailed podcast information by ID",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  podcast-get "4d3fe717842d4902a372de50e4b0b36f" --mock
  podcast-get "4d3fe717842d4902a372de50e4b0b36f" --sort oldest_first
  podcast-get "4d3fe717842d4902a372de50e4b0b36f" --output pretty
        """
    )

    # Required argument
    parser.add_argument(
        "podcast_id",
        help="Podcast identifier"
    )

    # Pagination and sorting
    parser.add_argument(
        "--next-episode-pub-date",
        type=int,
        help="Pagination cursor for episodes (epoch timestamp in milliseconds)"
    )

    parser.add_argument(
        "--sort",
        choices=["recent_first", "oldest_first"],
        default="recent_first",
        help="Episode sort order (default: recent_first)"
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
        "next_episode_pub_date": args.next_episode_pub_date,
        "sort": args.sort,
    }

    # Make API request
    try:
        client = ListenNotesAPI(api_key=args.api_key, use_mock=args.mock)
        result = client.get_podcast(args.podcast_id, **api_params)

        # Output results
        if args.output == "json":
            print(json.dumps(result, indent=2))
        elif args.output == "pretty":
            print(f"\nPodcast: {result.get('title', 'N/A')}")
            print("=" * 80)

            publisher = result.get('publisher', 'N/A')
            print(f"Publisher: {publisher}")

            description = result.get('description', 'N/A')
            if description and len(description) > 200:
                description = description[:200] + "..."
            print(f"Description: {description}")

            total_episodes = result.get('total_episodes')
            if total_episodes:
                print(f"Total Episodes: {total_episodes}")

            website = result.get('website')
            if website:
                print(f"Website: {website}")

            rss = result.get('rss')
            if rss:
                print(f"RSS Feed: {rss}")

            language = result.get('language')
            if language:
                print(f"Language: {language}")

            listen_score = result.get('listen_score')
            if listen_score:
                print(f"Listen Score: {listen_score}")

            print(f"\nID: {result.get('id', 'N/A')}")

            # Show episodes
            episodes = result.get('episodes', [])
            if episodes:
                print(f"\nRecent Episodes ({len(episodes)} shown):")
                print("-" * 80)
                for idx, episode in enumerate(episodes, 1):
                    print(f"\n{idx}. {episode.get('title', 'N/A')}")

                    pub_date = episode.get('pub_date_ms')
                    if pub_date:
                        date_str = datetime.fromtimestamp(pub_date / 1000).strftime('%Y-%m-%d')
                        print(f"   Published: {date_str}")

                    length = episode.get('audio_length_sec')
                    if length:
                        print(f"   Length: {length // 60} min")

                    print(f"   ID: {episode.get('id', 'N/A')}")

                # Pagination hint
                next_pub_date = result.get('next_episode_pub_date')
                if next_pub_date:
                    print(f"\nMore episodes available (use --next-episode-pub-date {next_pub_date})")

        elif args.output == "summary":
            title = result.get('title', 'N/A')
            total_episodes = result.get('total_episodes', 'N/A')
            publisher = result.get('publisher', 'N/A')

            print(f"Podcast: {title}")
            print(f"Publisher: {publisher}")
            print(f"Total Episodes: {total_episodes}")

            episodes = result.get('episodes', [])
            if episodes:
                print(f"\nShowing {len(episodes)} recent episodes")

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
