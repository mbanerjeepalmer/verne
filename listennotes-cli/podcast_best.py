#!/usr/bin/env python3
"""
ListenNotes Best Podcasts CLI
Get the best podcasts by genre, region, language, etc.
"""

import sys
import json
import argparse
from datetime import datetime
import requests

from listennotes_api import ListenNotesAPI


def main():
    """Main CLI entry point for best podcasts."""
    parser = argparse.ArgumentParser(
        description="Get the best podcasts from ListenNotes",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  podcast-best --mock
  podcast-best --genre-id 68 --region us
  podcast-best --language English --sort listen_score
  podcast-best --page 2 --safe-mode
        """
    )

    # Genre and filtering
    parser.add_argument(
        "--genre-id",
        help="Genre identifier (use /genres endpoint to get list)"
    )

    parser.add_argument(
        "--region",
        default="us",
        help="Country code filter (default: us)"
    )

    parser.add_argument(
        "--publisher-region",
        help="Filter by publisher's country code"
    )

    parser.add_argument(
        "--language",
        help="Language filter (e.g., English, Spanish)"
    )

    # Sorting and pagination
    parser.add_argument(
        "--sort",
        choices=["recent_added_first", "oldest_added_first", "recent_published_first",
                 "oldest_published_first", "listen_score"],
        default="recent_added_first",
        help="Sort order (default: recent_added_first)"
    )

    parser.add_argument(
        "--page",
        type=int,
        default=1,
        help="Page number for pagination (default: 1)"
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
        "genre_id": args.genre_id,
        "page": args.page,
        "region": args.region,
        "publisher_region": args.publisher_region,
        "language": args.language,
        "sort": args.sort,
        "safe_mode": 1 if args.safe_mode else 0,
    }

    # Make API request
    try:
        client = ListenNotesAPI(api_key=args.api_key, use_mock=args.mock)
        results = client.best_podcasts(**api_params)

        # Output results
        if args.output == "json":
            print(json.dumps(results, indent=2))
        elif args.output == "pretty":
            print(f"\nBest Podcasts")
            if args.genre_id:
                print(f"Genre ID: {args.genre_id}")
            if args.region:
                print(f"Region: {args.region}")
            print("=" * 80)

            for idx, podcast in enumerate(results.get('podcasts', []), 1):
                print(f"\n{idx}. {podcast.get('title', 'N/A')}")

                publisher = podcast.get('publisher', 'N/A')
                print(f"   Publisher: {publisher}")

                total_episodes = podcast.get('total_episodes')
                if total_episodes:
                    print(f"   Episodes: {total_episodes}")

                listen_score = podcast.get('listen_score')
                if listen_score:
                    print(f"   Listen Score: {listen_score}")

                print(f"   ID: {podcast.get('id', 'N/A')}")

            # Show pagination info
            page_number = results.get('page_number', 1)
            has_next = results.get('has_next', False)
            has_previous = results.get('has_previous', False)
            print(f"\nPage: {page_number}")
            if has_next:
                print(f"More results available (use --page {page_number + 1})")

        elif args.output == "summary":
            podcasts = results.get('podcasts', [])
            print(f"Showing {len(podcasts)} best podcasts")

            if podcasts:
                print("\nTop podcasts:")
                for idx, podcast in enumerate(podcasts[:5], 1):
                    title = podcast.get('title', 'N/A')
                    print(f"{idx}. {title}")

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
