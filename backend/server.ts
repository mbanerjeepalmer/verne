import { Hono } from "hono";
import { cors } from "hono/cors";
import Bun from "bun";
import type { IPodcast } from "./types";
import { sendQuery } from "./sandbox";

type Env = {
  Bindings: {
    server: Bun.Server<undefined>;
  };
};

const app = new Hono<Env>();
const clients = new Set<any>();

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

  console.log(`Received query:`, body.query);

  try {
    const result = await sendQuery(body.query);

    // Extract the last assistant message
    const assistantEvents = result.events.filter((e) => e.role === "assistant");
    const lastMessage =
      assistantEvents.at(-1)?.content ?? "No response from agent.";

    const broadcast = {
      event_type: "message",
      payload: {
        message: lastMessage,
      },
    };

    clients.forEach((ws) => {
      ws.send(JSON.stringify(broadcast));
    });

    return c.json({ success: true, response: broadcast });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("Query failed:", errorMessage);

    const broadcast = {
      event_type: "message",
      payload: {
        message: `Error: ${errorMessage}`,
      },
    };

    clients.forEach((ws) => {
      ws.send(JSON.stringify(broadcast));
    });

    return c.json({ success: false, error: errorMessage }, 500);
  }
});

Bun.serve({
  port: 3001,

  fetch(req, server) {
    return app.fetch(req, { server });
  },

  websocket: {
    open(ws) {
      console.log("WebSocket connection opened");
      clients.add(ws);
      console.log(`Client connected. Total clients: ${clients.size}`);
    },

    close(ws) {
      console.log("WebSocket connection closed");
      clients.delete(ws);
      console.log(`Client disconnected. Total clients: ${clients.size}`);
    },

    message(_, message) {
      console.log("WebSocket message received:", message);
    },
  },
});
