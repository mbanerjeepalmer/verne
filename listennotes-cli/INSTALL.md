# Installation Guide

## Quick Start

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set your API key**
   ```bash
   export LISTENNOTES_API_KEY="your_api_key_here"
   ```

3. **Test the CLI**
   ```bash
   # Test with mock server (no API key needed)
   python podcast_search.py "kafka" --mock --limit 5

   # Or with real API (requires API key)
   python podcast_search.py "kafka" --limit 5
   ```

## Installation as Command

To use `podcast-search` command globally:

```bash
pip install -e .
```

Then you can use it anywhere:

```bash
podcast-search "your search term"
```

## Verify Installation

```bash
podcast-search --help
```

## Get API Key

1. Go to https://www.listennotes.com/api/
2. Sign up for an account
3. Get your API key from the dashboard
4. Add it to your environment:
   ```bash
   export LISTENNOTES_API_KEY="your_key"
   ```

## Test Examples

Run the examples script to see various usage patterns:

```bash
./examples.sh
```

Note: You need a valid API key for the examples to work.
