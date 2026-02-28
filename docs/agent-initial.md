

We want to test multiple approaches to running Mistral Vibe as an agent in a sandbox.

It will receive prompts as strings from a separate NextJS app.

We want the Mistral Vibe agent to be able to run in a bash sandbox and return structured output to the server. As well as a filesystem we'll give it tools.

This involves two stages:
1. Spin up the Mistral Vibe agent
2. Communicate with it

== (1) Spin up the Mistral Vibe agent
Test out multiple approaches to spinning up Mistral Vibe in a sandbox with tools. We need to be able to spin it up from Typescript.

Vibe: https://github.com/mistralai/mistral-vibe

Consider:
- E2b
- Daytona
- Fly Sprites


Success criterion: we can run a Typescript file that starts the sandbox, and gives Mistral Vibe a prompt "What is the capital of France?" and it will respond "Paris". Note we only need this to be visible in stdio, not necessarily outside the sandbox.


== (2) Communicate with the agent
