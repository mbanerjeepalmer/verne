# Runtime Environment Variables

## Current approach

`NEXT_PUBLIC_WEBSOCKET_URL` is baked into the frontend Docker image at build time via a Dockerfile `ARG`. This means the image is coupled to a specific backend URL and must be rebuilt to change it.

## Future improvement

To make the frontend image reusable across environments, switch to runtime injection:

1. Replace `NEXT_PUBLIC_WEBSOCKET_URL` with a server-only `WEBSOCKET_URL` env var
2. Read it in the root layout via `process.env.WEBSOCKET_URL`
3. Inject it into the client via a `<script>` tag setting `window.__ENV`
4. Read `window.__ENV.WEBSOCKET_URL` on the client instead of `process.env.NEXT_PUBLIC_WEBSOCKET_URL`

This lets the same image SHA run in any environment by changing `docker run -e` flags.
