import { Hono } from "hono";

const app = new Hono();

const clients = new Set<any>();

app.get("/", (c) => {
  return c.text("Server running");
});

app.post("/broadcast", async (c) => {
  const body = await c.req.json<{ event_type: string; message: string }>();

  const broadcast = {
    event_type: body.event_type,
    message: body.message,
  };

  clients.forEach((client) => {
    client.send(JSON.stringify(broadcast));
  });

  return c.json({
    message: broadcast,
  });
});

export default {
  port: 3001,
  fetch: app.fetch,
  websocket: {
    open(ws: any) {
      console.log("WebSocket connection opened");
      clients.add(ws);
      console.log(`Client connected. Total clients: ${clients.size}`);
    },
    close() {
      console.log("WebSocket connection closed");
    },
    message(_: any, message: any) {
      console.log("WebSocket message received:", message);
    },
  },
};
