# Search tuning

Currently we hardcode the prompt that goes to Mistral Vibe in a sandbox:

```ts

async function main() {
  let sandbox: Sandbox | undefined;
  try {
    const result = await createVibesSandbox();
    sandbox = result.sandbox;
    const { url } = result;

    // Test: use ListenNotes CLI with real API key
    const testMessage =
      'Use the podcast-search CLI to search for "kafka" podcasts with --output summary. The LISTENNOTES_API_KEY env var is already set. Run: podcast-search "kafka" --output summary';
    console.log(`\nSending: "${testMessage}"`);
    const resp = await fetch(`${url}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: testMessage }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!resp.ok) {
      console.error(`Request failed: ${resp.status} ${resp.statusText}`);
      console.error(await resp.text());
    } else {
      console.log("\nResponse:");
      console.log(JSON.stringify(await resp.json(), null, 2));
    }
```

We want to adjust this so that:
1. It has a system prompt that tells it its purpose (to find podcasts) and how to do that (i.e. with the listennotes CLI).
2. We can pass the user prompt (e.g. "I'm interested in Kafka") to Vibe
