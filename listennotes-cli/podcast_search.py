#!/usr/bin/env python3
"""
ListenNotes Podcast Search CLI
A command-line interface for searching podcasts using the ListenNotes API.
"""

import sys
import json
import argparse
from datetime import datetime
import requests

from listennotes_api import ListenNotesAPI


def date_to_timestamp(date_string: str) -> int:
    """
    Convert YYYY-MM-DD date string to Unix timestamp in milliseconds.

    Args:
        date_string: Date in YYYY-MM-DD format

    Returns:
        Unix timestamp in milliseconds
    """
    dt = datetime.strptime(date_string, "%Y-%m-%d")
    return int(dt.timestamp() * 1000)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Search for podcasts and episodes using the ListenNotes API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  podcast-search "kafka" --mock
  podcast-search "kafka" --language English --limit 5
  podcast-search "data engineering" --date-from 2023-01-01 --type episode
  podcast-search "python" --sort-by-date --safe-mode
        """
    )

    # Required argument
    parser.add_argument(
        "query",
        help="Search term (e.g., person, place, topic). Use quotes for exact match."
    )

    # Search type and sorting
    parser.add_argument(
        "--type", "-t",
        choices=["episode", "podcast", "curated"],
        default="episode",
        help="Type of content to search (default: episode)"
    )

    parser.add_argument(
        "--sort-by-date",
        action="store_true",
        help="Sort results by date instead of relevance"
    )

    # Pagination
    parser.add_argument(
        "--offset",
        type=int,
        default=0,
        help="Pagination offset (default: 0)"
    )

    parser.add_argument(
        "--limit", "-n",
        type=int,
        default=10,
        dest="page_size",
        help="Number of results per page, 1-10 (default: 10)"
    )

    # Date filters
    parser.add_argument(
        "--date-from", "-f",
        dest="published_after",
        help="Filter by start date (YYYY-MM-DD)"
    )

    parser.add_argument(
        "--date-to", "-d",
        dest="published_before",
        help="Filter by end date (YYYY-MM-DD)"
    )

    # Language and region
    parser.add_argument(
        "--language", "-l",
        help="Filter by language (e.g., English, Spanish)"
    )

    parser.add_argument(
        "--region", "-r",
        help="Filter by region/country code (e.g., us, uk)"
    )

    # Audio length filters
    parser.add_argument(
        "--len-min",
        type=int,
        help="Minimum audio length in minutes"
    )

    parser.add_argument(
        "--len-max",
        type=int,
        help="Maximum audio length in minutes"
    )

    # Podcast-specific filters
    parser.add_argument(
        "--episode-count-min",
        type=int,
        help="Minimum number of episodes (podcast type only)"
    )

    parser.add_argument(
        "--episode-count-max",
        type=int,
        help="Maximum number of episodes (podcast type only)"
    )

    # Genre filter
    parser.add_argument(
        "--genre-ids",
        help="Comma-delimited genre IDs to filter by"
    )

    # Search field filter
    parser.add_argument(
        "--only-in",
        help="Search only in specific fields: title, description, author, audio (comma-separated)"
    )

    # Boolean filters
    parser.add_argument(
        "--safe-mode",
        action="store_true",
        help="Exclude explicit content"
    )

    parser.add_argument(
        "--unique-podcasts",
        action="store_true",
        help="Return only one episode per podcast (episode type only)"
    )

    # Include/exclude specific podcasts
    parser.add_argument(
        "--include-podcasts",
        dest="ocid",
        help="Comma-delimited podcast IDs to include (max 5, episodes only)"
    )

    parser.add_argument(
        "--exclude-podcasts",
        dest="ncid",
        help="Comma-delimited podcast IDs to exclude (max 5, episodes only)"
    )

    # Output format
    parser.add_argument(
        "--output", "-o",
        choices=["json", "pretty", "summary", "compact"],
        default="json",
        help="Output format (default: json). Use 'compact' for minimal fields needed by post_episode."
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

    # Validate page_size
    if not 1 <= args.page_size <= 10:
        parser.error("--limit must be between 1 and 10")

    # Build API parameters
    api_params = {
        "q": args.query,
        "type": args.type,
        "sort_by_date": 1 if args.sort_by_date else 0,
        "offset": args.offset,
        "page_size": args.page_size,
        "language": args.language,
        "region": args.region,
        "len_min": args.len_min,
        "len_max": args.len_max,
        "episode_count_min": args.episode_count_min,
        "episode_count_max": args.episode_count_max,
        "genre_ids": args.genre_ids,
        "only_in": args.only_in,
        "safe_mode": 1 if args.safe_mode else 0,
        "unique_podcasts": 1 if args.unique_podcasts else 0,
        "ocid": args.ocid,
        "ncid": args.ncid,
    }

    # Convert dates to timestamps
    if args.published_after:
        try:
            api_params["published_after"] = date_to_timestamp(args.published_after)
        except ValueError as e:
            parser.error(f"Invalid --date-from format: {e}")

    if args.published_before:
        try:
            api_params["published_before"] = date_to_timestamp(args.published_before)
        except ValueError as e:
            parser.error(f"Invalid --date-to format: {e}")

    # Make API request
    try:
        client = ListenNotesAPI(api_key=args.api_key, use_mock=args.mock)
        results = client.search(**api_params)

        # Output results
        
        if args.output == "json":
            print(json.dumps(results, indent=2))
        elif args.output == "pretty":
            print(f"\nSearch Results for: '{args.query}'")
            print(f"Total: {results.get('total', 0)} | Showing: {results.get('count', 0)}")
            print("=" * 80)

            for idx, item in enumerate(results.get('results', []), 1):
                print(f"\n{idx}. {item.get('title_original', item.get('title', 'N/A'))}")

                if args.type == "episode":
                    podcast_title = item.get('podcast', {}).get('title_original', 'N/A')
                    print(f"   Podcast: {podcast_title}")
                    pub_date = item.get('pub_date_ms')
                    if pub_date:
                        date_str = datetime.fromtimestamp(pub_date / 1000).strftime('%Y-%m-%d')
                        print(f"   Published: {date_str}")
                    length = item.get('audio_length_sec')
                    if length:
                        print(f"   Length: {length // 60} min")
                elif args.type == "podcast":
                    publisher = item.get('publisher_original', 'N/A')
                    print(f"   Publisher: {publisher}")
                    episode_count = item.get('total_episodes')
                    if episode_count:
                        print(f"   Episodes: {episode_count}")

                print(f"   ID: {item.get('id', 'N/A')}")

        elif args.output == "compact":
            # Minimal fields for post_episode tool
            keep = ["title_original", "audio", "audio_length_sec", "image", "thumbnail",
                    "description_original", "pub_date_ms", "link"]
            compact = {
                "count": results.get("count", 0),
                "total": results.get("total", 0),
                "results": [],
            }
            for item in results.get("results", []):
                entry = {k: item.get(k) for k in keep if item.get(k) is not None}
                # Flatten podcast metadata
                podcast = item.get("podcast", {})
                if podcast.get("title_original"):
                    entry["podcast_title"] = podcast["title_original"]
                if podcast.get("publisher_original"):
                    entry["publisher"] = podcast["publisher_original"]
                compact["results"].append(entry)
            print(json.dumps(compact, indent=2))

        elif args.output == "summary":
            count = results.get('count', 0)
            total = results.get('total', 0)
            print(f"Found {total} results, showing {count}")

            if results.get('results'):
                print("\nTop results:")
                for idx, item in enumerate(results['results'][:5], 1):
                    title = item.get('title_original', item.get('title', 'N/A'))
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
