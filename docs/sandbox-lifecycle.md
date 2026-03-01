# Sandbox lifecycle

Currently we spin up a fresh E2b sandbox on every request.

The first problem is that this is slow. The second is that we may be preventing ourselves from keeping history with the agent.

Instead we should make sure that:
- (a) a sandbox is made available eagerly when we start the server -- if an appropriate sandbox already exists, use that;
- (b) when the user submits a query then it hits a hot Vibe agent;
- (c) we therefore have the possibility to keep conversation history over time with the same Vibe agent from the UI;
- (d) yet when required we can kill and restart from the homepage.

You need to work through this in stages. Do (a) first then ensure it works using the LangFuse MCP, then ask for me to confirm it works. Then you can move on.

I think (c) may need some subtlety -- how do we sync the history/state between frontend and backend? We can take shortcuts if needed. This is for a hackathon.

Out of scope for now:
- per-user sandboxes -- we only have one user for now;
