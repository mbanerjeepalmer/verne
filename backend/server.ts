import { Hono } from "hono";
import { cors } from "hono/cors";
import Bun from "bun";
import type { IPodcast } from "./types";
import { sendQueryStream, initSandbox, getSandboxStatus, killSandbox } from "./sandbox";
import { handleTranscriptionWebSocket } from "./transcription";

type Env = {
  Bindings: {
    server: Bun.Server<undefined>;
  };
};

const app = new Hono<Env>();
const clients = new Set<any>();
const transcriptionClients = new Map<any, (message: string | Buffer) => Promise<void>>();
let submissionCount = 0;
let currentSessionId: string | null = null;

// Enable CORS for all routes
app.use("*", cors());

app.get("/", (c) => {
  return c.text("Server running");
});

app.get("/ws", (c) => {
  if (c.req.header("upgrade") !== "websocket") {
    return c.text("Expected websocket", 400);
  }

  const upgraded = c.env.server.upgrade(c.req.raw);

  if (!upgraded) {
    return c.text("Upgrade failed", 500);
  }

  return new Response(null);
});

app.post("/broadcast", async (c) => {
  const body = await c.req.json<{ event_type: string; podcast: IPodcast }>();

  const broadcast = {
    event_type: body.event_type,
    payload: {
      podcast: body.podcast,
    },
  };

  clients.forEach((ws) => {
    ws.send(JSON.stringify(broadcast));
  });

  return c.json({ message: broadcast });
});

app.get("/sandbox/status", (c) => {
  return c.json(getSandboxStatus());
});

app.post("/sandbox/restart", async (c) => {
  console.log("Restarting sandbox...");
  await killSandbox();
  currentSessionId = null;
  // Eagerly create a new sandbox
  initSandbox()
    .then((url) => console.log(`New sandbox ready: ${url}`))
    .catch((err) => console.error("Sandbox restart failed:", err));
  return c.json({ success: true, message: "Sandbox restarting" });
});

app.post("/query", async (c) => {
  const body = await c.req.json<{ query: string }>();

  console.log(`Received query:`, body.query);

  try {
    const episodes: Record<string, any>[] = [];
    let lastMessage = "No response from agent.";

    const result = await sendQueryStream(
      body.query,
      (event) => {
        // Collect post_episode tool calls for final broadcast
        if (event.type === "tool_call" && event.tool_name === "post_episode") {
          episodes.push(event.args ?? {});
          return;
        }

        // Track last assistant message
        if (event.type === "assistant" && event.content) {
          lastMessage = event.content;
        }

        // Stream each event to WebSocket clients in real-time
        const broadcast = { event_type: event.type, payload: event };
        const msg = JSON.stringify(broadcast);
        clients.forEach((ws) => ws.send(msg));
      },
      currentSessionId ?? undefined
    );

    if (result.session_id) {
      currentSessionId = result.session_id;
    }

    // Broadcast episodes at the end if any were collected
    if (episodes.length > 0) {
      const broadcast = {
        event_type: "episodes",
        payload: { message: lastMessage, podcasts: episodes },
      };
      const msg = JSON.stringify(broadcast);
      clients.forEach((ws) => ws.send(msg));
    }

    return c.json({ success: true });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("Query failed:", errorMessage);

    const broadcast = {
      event_type: "error",
      payload: { content: errorMessage },
    };
    const msg = JSON.stringify(broadcast);
    clients.forEach((ws) => ws.send(msg));

    return c.json({ success: false, error: errorMessage }, 500);
  }
});

const port = process.env.PORT || 3001;

Bun.serve({
  port,

  fetch(req, server) {
    return app.fetch(req, { server });
  },

  websocket: {
    async open(ws) {
      console.log("WebSocket connection opened");
      clients.add(ws);
      console.log(`Client connected. Total clients: ${clients.size}`);
    },

    close(ws) {
      console.log("WebSocket connection closed");
      clients.delete(ws);
      transcriptionClients.delete(ws);
      console.log(`Client disconnected. Total clients: ${clients.size}`);
    },

    async message(ws, message) {
      // Check if this is a transcription-related message
      if (typeof message === "string") {
        try {
          const data = JSON.parse(message);

          // Handle transcription start
          if (data.type === "transcription.start") {
            console.log("[Transcription] Starting transcription for client");
            const handler = await handleTranscriptionWebSocket(ws);
            transcriptionClients.set(ws, handler);
            // Send start signal to handler
            await handler(message);
            return;
          }

          // Handle transcription stop or other transcription messages
          if (data.type === "transcription.stop" || transcriptionClients.has(ws)) {
            const handler = transcriptionClients.get(ws);
            if (handler) {
              await handler(message);
            }
            return;
          }

          // Regular message handling
          console.log("WebSocket message received:", message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      } else {
        // Binary message - check if this client has a transcription handler
        const handler = transcriptionClients.get(ws);
        if (handler) {
          await handler(message);
        } else {
          console.log("Binary message received without transcription handler");
        }
      }
    },
  },
});

// Eagerly warm the sandbox at server start
console.log(`Server started on port ${port} — warming sandbox...`);
initSandbox()
  .then((url) => console.log(`Sandbox ready: ${url}`))
  .catch((err) => console.error("Sandbox warm-up failed:", err));
