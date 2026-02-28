# ListenNotes CLI

A comprehensive command-line interface for interacting with the [ListenNotes API](https://www.listennotes.com/api/).

## Features

- **Search**: Full-text search across episodes, podcasts, and curated lists
- **Best Podcasts**: Get the best podcasts by genre, region, and language
- **Podcast Details**: Fetch detailed information about specific podcasts
- **Episode Details**: Get episode information including transcripts (PRO plan)
- **Recommendations**: Get podcast and episode recommendations
- Advanced filtering by date, language, region, audio length, and more
- Multiple output formats (JSON, pretty-printed, summary)
- Mock server support for testing without API key
- Designed for use in automated environments and coding agents

## Installation

### Using pip (recommended)

```bash
pip install -e .
```

This will install the `podcast-search` command globally.

### Direct usage

```bash
python podcast_search.py "your search query"
```

## Configuration

Set your ListenNotes API key as an environment variable:

```bash
export LISTENNOTES_API_KEY="your_api_key_here"
```

Alternatively, pass it via the `--api-key` flag:

```bash
podcast-search "kafka" --api-key "your_api_key_here"
```

### Testing Without an API Key

Use the `--mock` flag to test with the ListenNotes mock server (no API key required):

```bash
podcast-search "kafka" --mock
```

The mock server returns sample data and doesn't require authentication, making it perfect for testing and development.

## Available Commands

The CLI provides six commands for different API operations:

- `podcast-search` - Search for podcasts and episodes
- `podcast-best` - Get the best podcasts
- `podcast-get` - Get detailed podcast information by ID
- `episode-get` - Get detailed episode information by ID
- `podcast-recommendations` - Get podcast recommendations
- `episode-recommendations` - Get episode recommendations

## Usage

### 1. Search for Podcasts and Episodes

```bash
podcast-search "kafka"
```

Or test with the mock server:

```bash
podcast-search "kafka" --mock
```

#### Search with Filters

```bash
# Search for episodes in English, limit to 5 results
podcast-search "kafka" --language English --limit 5

# Search for podcasts published in 2023
podcast-search "data engineering" --date-from 2023-01-01 --date-to 2023-12-31 --type podcast

# Search with date sorting
podcast-search "python" --sort-by-date

# Exclude explicit content
podcast-search "technology" --safe-mode
```

#### Advanced Filtering

```bash
# Filter by audio length (10-60 minutes)
podcast-search "interviews" --len-min 10 --len-max 60

# Search only in titles
podcast-search "startup" --only-in title

# Filter by genre IDs
podcast-search "comedy" --genre-ids "133,134"

# Return one episode per podcast
podcast-search "science" --unique-podcasts
```

### 2. Get Best Podcasts

```bash
# Get best podcasts in the US
podcast-best --mock

# Get best podcasts by genre
podcast-best --genre-id 68 --region us

# Get best podcasts in a specific language
podcast-best --language English --sort listen_score

# Browse different pages
podcast-best --page 2 --safe-mode
```

### 3. Get Podcast Details

```bash
# Get podcast information (returns up to 10 recent episodes)
podcast-get "4d3fe717842d4902a372de50e4b0b36f" --mock

# Get podcast with oldest episodes first
podcast-get "4d3fe717842d4902a372de50e4b0b36f" --sort oldest_first

# Paginate through episodes using the timestamp from the response
podcast-get "4d3fe717842d4902a372de50e4b0b36f" --next-episode-pub-date 1234567890000

# Pretty output
podcast-get "4d3fe717842d4902a372de50e4b0b36f" --output pretty
```

### 4. Get Episode Details

```bash
# Get episode information
episode-get "0e4c4740b1754701b6832ef04413ca4e" --mock

# Get episode with transcript (requires PRO/ENTERPRISE plan)
episode-get "0e4c4740b1754701b6832ef04413ca4e" --show-transcript

# Pretty output with all details including RSS feed
episode-get "0e4c4740b1754701b6832ef04413ca4e" --output pretty
```

### 5. Get Podcast Recommendations

```bash
# Get recommended podcasts similar to a given podcast
podcast-recommendations "25212ac3c53240a880dd5032e547047b" --mock

# Get recommendations with safe mode
podcast-recommendations "25212ac3c53240a880dd5032e547047b" --safe-mode

# Pretty output
podcast-recommendations "25212ac3c53240a880dd5032e547047b" --output pretty
```

### 6. Get Episode Recommendations

```bash
# Get recommended episodes similar to a given episode
episode-recommendations "914a9deafa5340eeaa2859c77f275799" --mock

# Get recommendations with safe mode
episode-recommendations "914a9deafa5340eeaa2859c77f275799" --safe-mode

# Pretty output
episode-recommendations "914a9deafa5340eeaa2859c77f275799" --output pretty
```

### Output Formats

All commands support three output formats:

```bash
# JSON output (default, machine-readable)
<command> <args> --output json

# Pretty-printed output (human-readable)
<command> <args> --output pretty

# Summary output (minimal)
<command> <args> --output summary
```

## Command-Line Options

### podcast-search

**Required:**
- `query` - Search term (e.g., person, place, topic)

**Options:**
- `--type, -t` - Type: episode, podcast, curated (default: episode)
- `--sort-by-date` - Sort by date instead of relevance
- `--offset` - Pagination offset (default: 0)
- `--limit, -n` - Number of results, 1-10 (default: 10)
- `--date-from, -f` - Start date filter (YYYY-MM-DD)
- `--date-to, -d` - End date filter (YYYY-MM-DD)
- `--language, -l` - Language filter
- `--region, -r` - Region/country code filter
- `--len-min` - Minimum audio length in minutes
- `--len-max` - Maximum audio length in minutes
- `--episode-count-min` - Minimum episodes (podcast type only)
- `--episode-count-max` - Maximum episodes (podcast type only)
- `--genre-ids` - Comma-delimited genre IDs
- `--only-in` - Search fields: title, description, author, audio
- `--safe-mode` - Exclude explicit content
- `--unique-podcasts` - One episode per podcast (episodes only)
- `--include-podcasts` - Include specific podcast IDs (max 5)
- `--exclude-podcasts` - Exclude specific podcast IDs (max 5)
- `--output, -o` - Output format: json, pretty, summary
- `--api-key` - API key (overrides env var)
- `--mock` - Use mock/test server

### podcast-best

**Options:**
- `--genre-id` - Genre identifier
- `--region` - Country code filter (default: us)
- `--publisher-region` - Filter by publisher's country
- `--language` - Language filter
- `--sort` - Sort: recent_added_first, oldest_added_first, recent_published_first, oldest_published_first, listen_score
- `--page` - Page number (default: 1)
- `--safe-mode` - Exclude explicit content
- `--output, -o` - Output format: json, pretty, summary
- `--api-key` - API key (overrides env var)
- `--mock` - Use mock/test server

### podcast-get

**Required:**
- `podcast_id` - Podcast identifier

**Options:**
- `--next-episode-pub-date` - Pagination cursor (epoch timestamp in ms)
- `--sort` - Episode sort: recent_first, oldest_first (default: recent_first)
- `--output, -o` - Output format: json, pretty, summary
- `--api-key` - API key (overrides env var)
- `--mock` - Use mock/test server

### episode-get

**Required:**
- `episode_id` - Episode identifier

**Options:**
- `--show-transcript` - Include transcript (PRO/ENTERPRISE plan required)
- `--output, -o` - Output format: json, pretty, summary
- `--api-key` - API key (overrides env var)
- `--mock` - Use mock/test server

### podcast-recommendations

**Required:**
- `podcast_id` - Podcast identifier

**Options:**
- `--safe-mode` - Exclude explicit content
- `--output, -o` - Output format: json, pretty, summary
- `--api-key` - API key (overrides env var)
- `--mock` - Use mock/test server

### episode-recommendations

**Required:**
- `episode_id` - Episode identifier

**Options:**
- `--safe-mode` - Exclude explicit content
- `--output, -o` - Output format: json, pretty, summary
- `--api-key` - API key (overrides env var)
- `--mock` - Use mock/test server

## Programmatic Usage

Since the CLI outputs JSON by default, it's easy to parse in scripts:

```bash
# Get search results as JSON
results=$(podcast-search "machine learning" --limit 3)

# Parse with jq
echo "$results" | jq '.results[].title_original'
```

## API Reference

For complete API documentation, visit:
- [ListenNotes API Documentation](https://www.listennotes.com/api/docs/)
- [API Quickstarts](https://www.listennotes.help/article/22-podcast-api-quickstarts)

## Requirements

- Python 3.8+
- requests library
- ListenNotes API key (get one at [listennotes.com/api](https://www.listennotes.com/api/))

## License

MIT License

## Support

For issues and questions:
- ListenNotes API: https://www.listennotes.com/api/faq/
- GitHub Issues: [Report an issue](https://github.com/yourusername/listennotes-cli/issues)
