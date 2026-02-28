import { Hono } from "hono";
import { cors } from "hono/cors";
import Bun from "bun";
import type { IPodcast } from "./types";
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

app.post("/query", async (c) => {
  const body = await c.req.json<{ query: string }>();
  submissionCount++;

  console.log(`Received query (submission ${submissionCount}):`, body.query);

  if (submissionCount === 1) {
    // First submission: ask for clarification
    const broadcast = {
      event_type: "clarification",
      payload: {
        message: "Could you please provide more details about what kind of podcast content you're looking for?",
      },
    };

    clients.forEach((ws) => {
      ws.send(JSON.stringify(broadcast));
    });

    return c.json({ success: true, response: broadcast });
  } else {
    // Second submission: return message and three podcast episodes
    const broadcast = {
      event_type: "results",
      payload: {
        message: "Here are three podcast episodes based on your query:",
        podcasts: [
          {
            name: "Software Engineering Daily",
            src: "https://example.com/audio1.mp3",
            duration: 3300,
            cover_image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=128&h=128&fit=crop&q=80",
            start_time: 322,
            end_time: 752,
          },
          {
            name: "Data Engineering Podcast",
            src: "https://example.com/audio2.mp3",
            duration: 2700,
            cover_image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=128&h=128&fit=crop&q=80",
            start_time: 848,
            end_time: 1238,
          },
          {
            name: "The Distributed Systems Pod",
            src: "https://example.com/audio3.mp3",
            duration: 3600,
            cover_image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=128&h=128&fit=crop&q=80",
            start_time: 525,
            end_time: 1020,
          },
        ],
      },
    };

    clients.forEach((ws) => {
      ws.send(JSON.stringify(broadcast));
    });

    // Reset counter for next cycle
    submissionCount = 0;

    return c.json({ success: true, response: broadcast });
  }
});

Bun.serve({
  port: 3001,

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
