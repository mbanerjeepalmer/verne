#!/bin/bash
# Quick test script for the mock server

echo "Testing ListenNotes CLI with mock server (no API key required)"
echo "================================================================"
echo ""

echo "Test 1: Basic search"
python podcast_search.py "kafka" --mock --limit 3 --output summary
echo ""

echo "Test 2: Search with filters"
python podcast_search.py "technology" --mock --limit 2 --language English --output summary
echo ""

echo "Test 3: Search podcasts (not episodes)"
python podcast_search.py "science" --mock --type podcast --limit 2 --output summary
echo ""

echo "Test 4: Pretty output format"
python podcast_search.py "AI" --mock --limit 2 --output pretty
echo ""

echo "All tests completed!"
