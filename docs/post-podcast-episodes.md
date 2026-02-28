As we can see in `.playwright-mcp/page-2026-02-28T21-02-09-090Z.png` currently when the model responds, it can only respond with messages.

Instead we want:
1. the Vibe agent to have access to a tool called post_episode , which will make a HTTP request to the `/broadcast` endpoint, adhering to the episode schema.
2. all messages from Vibe (including thinking steps, and any other intermediate steps) to be sent to the frontend as messages, and

Get (1) working fully first then ask permission before moving on to (2).
