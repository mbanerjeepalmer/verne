We want to run Mistral Vibe (https://github.com/mistralai/mistral-vibe) in a Daytona sandbox.

We want Vibe to be able to:
- use tools,
- see its filesystem,
- in general, act as any coding agent would.

We've identified three ways to do this:
1. the Python SDK directly,
2. with `vibe-acp`,
3. with `vibe --prompt "blah"`

You can see a comparison in `docs/agent-refined.md`.

You need to:
1. verify that the Python implementation is unconstrained -- that it can use bash and the filesystem fully, use tools, all the bells and whistles;
  - if not, use vibe-acp
2. attempt to deploy it using Daytona (you have `DAYTONA_API_KEY`)
3. verify that it can answer the question 'What is the capital of France?' -- if needed, you can use `MISTRAL_API_KEY` from `./.env` here
4. Work out the io -- we need to be able to hit a POST endpoint on a remote server with messages and tool outputs.
