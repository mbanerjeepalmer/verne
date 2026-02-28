#!/bin/bash
# Example usage of the podcast-search CLI

echo "=== Basic Search ==="
podcast-search "kafka"

echo -e "\n=== Search with Language Filter ==="
podcast-search "kafka" --language English --limit 5

echo -e "\n=== Search Podcasts (not episodes) ==="
podcast-search "data engineering" --type podcast --limit 3

echo -e "\n=== Search with Date Range ==="
podcast-search "AI" --date-from 2024-01-01 --date-to 2024-12-31

echo -e "\n=== Search with Audio Length Filter ==="
podcast-search "interviews" --len-min 30 --len-max 60

echo -e "\n=== Pretty Output Format ==="
podcast-search "python programming" --output pretty --limit 3

echo -e "\n=== Summary Output ==="
podcast-search "technology" --output summary

echo -e "\n=== Safe Mode (exclude explicit content) ==="
podcast-search "comedy" --safe-mode --limit 5

echo -e "\n=== Sort by Date ==="
podcast-search "news" --sort-by-date --limit 5

echo -e "\n=== Search Only in Titles ==="
podcast-search "startup" --only-in title --limit 3

echo -e "\n=== Unique Podcasts (one episode per podcast) ==="
podcast-search "science" --unique-podcasts --limit 5
