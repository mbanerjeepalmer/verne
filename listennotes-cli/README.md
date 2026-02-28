# ListenNotes Podcast Search CLI

A command-line interface for searching podcasts and episodes using the [ListenNotes API](https://www.listennotes.com/api/).

## Features

- Full-text search across episodes, podcasts, and curated lists
- Advanced filtering by date, language, region, audio length, and more
- Multiple output formats (JSON, pretty-printed, summary)
- Support for all ListenNotes API search parameters
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

## Usage

### Basic Search

```bash
podcast-search "kafka"
```

Or test with the mock server:

```bash
podcast-search "kafka" --mock
```

### Search with Filters

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

### Advanced Filtering

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

### Output Formats

```bash
# JSON output (default, machine-readable)
podcast-search "AI" --output json

# Pretty-printed output (human-readable)
podcast-search "AI" --output pretty

# Summary output (minimal)
podcast-search "AI" --output summary
```

## Command-Line Options

### Required Arguments

| Argument | Description |
|----------|-------------|
| `query` | Search term (e.g., person, place, topic). Use quotes for exact match. |

### Optional Arguments

| Option | Description | Example |
|--------|-------------|---------|
| `--type, -t` | Type of content: episode, podcast, curated | `--type podcast` |
| `--sort-by-date` | Sort by date instead of relevance | `--sort-by-date` |
| `--offset` | Pagination offset | `--offset 10` |
| `--limit, -n` | Number of results (1-10) | `--limit 5` |
| `--date-from, -f` | Filter by start date (YYYY-MM-DD) | `--date-from 2023-01-01` |
| `--date-to, -d` | Filter by end date (YYYY-MM-DD) | `--date-to 2023-12-31` |
| `--language, -l` | Filter by language | `--language English` |
| `--region, -r` | Filter by region/country code | `--region us` |
| `--len-min` | Minimum audio length in minutes | `--len-min 10` |
| `--len-max` | Maximum audio length in minutes | `--len-max 60` |
| `--episode-count-min` | Minimum episodes (podcast only) | `--episode-count-min 50` |
| `--episode-count-max` | Maximum episodes (podcast only) | `--episode-count-max 200` |
| `--genre-ids` | Comma-delimited genre IDs | `--genre-ids "68,82"` |
| `--only-in` | Search fields: title, description, author, audio | `--only-in title,description` |
| `--safe-mode` | Exclude explicit content | `--safe-mode` |
| `--unique-podcasts` | One episode per podcast (episodes only) | `--unique-podcasts` |
| `--include-podcasts` | Include specific podcast IDs (max 5) | `--include-podcasts "id1,id2"` |
| `--exclude-podcasts` | Exclude specific podcast IDs (max 5) | `--exclude-podcasts "id1,id2"` |
| `--output, -o` | Output format: json, pretty, summary | `--output pretty` |
| `--api-key` | API key (overrides env var) | `--api-key "key"` |
| `--mock` | Use mock/test server (no API key required) | `--mock` |

## Use in Daytona Sandbox

This CLI is designed to work seamlessly in Daytona sandboxes and automated coding environments.

### Installation in Daytona

Add to your `.devcontainer/devcontainer.json` or Dockerfile:

```dockerfile
# Install the CLI
COPY listennotes-cli /tmp/listennotes-cli
RUN cd /tmp/listennotes-cli && pip install -e . && rm -rf /tmp/listennotes-cli

# Set API key
ENV LISTENNOTES_API_KEY="your_api_key_here"
```

Or in your `postCreateCommand`:

```json
{
  "postCreateCommand": "pip install -e /path/to/listennotes-cli && export LISTENNOTES_API_KEY='your_key'"
}
```

### Programmatic Usage

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
