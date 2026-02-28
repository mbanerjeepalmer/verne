We are designing a command line interface for For the ListenNotes API. We wants it to work like the example below:

podcast-search "kafka"

So this would be like a command that would give all the search results for Kafka. Listen Notes does not have a CLI but we want to make it possible for a coding agent to use these commands. The coding agent is in a 
ona sandbox, and we want this to be in the declarative image. Make sure to check out the Listen Notes docs for what parameters they have and make sure that the CLI uses those. 

Write it as python code

This is the design plan:

CLI API Design
Command Structure
podcast-search <query> [options]
Options
Option
Description
Example
--query, -q
Search term(s)
podcast-search "kafka"
--date-from, -f
Filter by start date (YYYY-MM-DD)
--date-from 2023-01-01
--date-to, -t
Filter by end date (YYYY-MM-DD)
--date-to 2023-12-31
--language, -l
Filter by language (e.g., "en", "es")
--language en
--operator, -o
Boolean operator for multiple queries (AND, OR)
--operator AND
--limit, -n
Limit the number of results
--limit 10
Example Usage
podcast-search "kafka" --date-from 2023-01-01 --language en --limit 5
Implementation Notes
• 
Integrates with ListenNotes API endpoints (/search, /podcasts)
• 
Uses environment variables for API keys (e.g., LISTENNOTES_API_KEY)
• 
Outputs results in JSON format for programmatic use

