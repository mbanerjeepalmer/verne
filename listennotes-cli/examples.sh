#!/bin/bash
# Example usage of the ListenNotes CLI

echo "========================================="
echo "1. PODCAST SEARCH EXAMPLES"
echo "========================================="

echo -e "\n=== Basic Search ==="
podcast-search "kafka" --mock

echo -e "\n=== Search with Language Filter ==="
podcast-search "kafka" --language English --limit 5 --mock

echo -e "\n=== Search Podcasts (not episodes) ==="
podcast-search "data engineering" --type podcast --limit 3 --mock

echo -e "\n=== Search with Date Range ==="
podcast-search "AI" --date-from 2024-01-01 --date-to 2024-12-31 --mock

echo -e "\n=== Search with Audio Length Filter ==="
podcast-search "interviews" --len-min 30 --len-max 60 --mock

echo -e "\n=== Pretty Output Format ==="
podcast-search "python programming" --output pretty --limit 3 --mock

echo -e "\n=== Summary Output ==="
podcast-search "technology" --output summary --mock

echo -e "\n=== Safe Mode (exclude explicit content) ==="
podcast-search "comedy" --safe-mode --limit 5 --mock

echo -e "\n=== Sort by Date ==="
podcast-search "news" --sort-by-date --limit 5 --mock

echo -e "\n=== Search Only in Titles ==="
podcast-search "startup" --only-in title --limit 3 --mock

echo -e "\n=== Unique Podcasts (one episode per podcast) ==="
podcast-search "science" --unique-podcasts --limit 5 --mock

echo -e "\n========================================="
echo "2. BEST PODCASTS EXAMPLES"
echo "========================================="

echo -e "\n=== Get Best Podcasts ==="
podcast-best --mock

echo -e "\n=== Best Podcasts by Genre ==="
podcast-best --genre-id 68 --region us --mock

echo -e "\n=== Best Podcasts in Specific Language ==="
podcast-best --language English --sort listen_score --mock

echo -e "\n=== Best Podcasts with Pagination ==="
podcast-best --page 2 --safe-mode --mock

echo -e "\n=== Best Podcasts Pretty Output ==="
podcast-best --output pretty --mock

echo -e "\n========================================="
echo "3. GET PODCAST DETAILS EXAMPLES"
echo "========================================="

echo -e "\n=== Get Podcast Information ==="
podcast-get "4d3fe717842d4902a372de50e4b0b36f" --mock

echo -e "\n=== Get Podcast with Oldest Episodes First ==="
podcast-get "4d3fe717842d4902a372de50e4b0b36f" --sort oldest_first --mock

echo -e "\n=== Get Podcast Pretty Output ==="
podcast-get "4d3fe717842d4902a372de50e4b0b36f" --output pretty --mock

echo -e "\n=== Get Podcast Summary ==="
podcast-get "4d3fe717842d4902a372de50e4b0b36f" --output summary --mock

echo -e "\n========================================="
echo "4. GET EPISODE DETAILS EXAMPLES"
echo "========================================="

echo -e "\n=== Get Episode Information ==="
episode-get "0e4c4740b1754701b6832ef04413ca4e" --mock

echo -e "\n=== Get Episode with Transcript (if available) ==="
episode-get "0e4c4740b1754701b6832ef04413ca4e" --show-transcript --mock

echo -e "\n=== Get Episode Pretty Output ==="
episode-get "0e4c4740b1754701b6832ef04413ca4e" --output pretty --mock

echo -e "\n=== Get Episode Summary ==="
episode-get "0e4c4740b1754701b6832ef04413ca4e" --output summary --mock

echo -e "\n========================================="
echo "5. PODCAST RECOMMENDATIONS EXAMPLES"
echo "========================================="

echo -e "\n=== Get Podcast Recommendations ==="
podcast-recommendations "25212ac3c53240a880dd5032e547047b" --mock

echo -e "\n=== Get Podcast Recommendations (Safe Mode) ==="
podcast-recommendations "25212ac3c53240a880dd5032e547047b" --safe-mode --mock

echo -e "\n=== Get Podcast Recommendations Pretty Output ==="
podcast-recommendations "25212ac3c53240a880dd5032e547047b" --output pretty --mock

echo -e "\n========================================="
echo "6. EPISODE RECOMMENDATIONS EXAMPLES"
echo "========================================="

echo -e "\n=== Get Episode Recommendations ==="
episode-recommendations "914a9deafa5340eeaa2859c77f275799" --mock

echo -e "\n=== Get Episode Recommendations (Safe Mode) ==="
episode-recommendations "914a9deafa5340eeaa2859c77f275799" --safe-mode --mock

echo -e "\n=== Get Episode Recommendations Pretty Output ==="
episode-recommendations "914a9deafa5340eeaa2859c77f275799" --output pretty --mock

echo -e "\n========================================="
echo "ALL EXAMPLES COMPLETED"
echo "========================================="
