"use client";

import { usePodcasts } from "@/stores/usePodcasts";
import { useEffect, useRef } from "react";

const MAX_RECONNECT_DELAY = 10000;

const Websocket = () => {
  const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
  if (!wsUrl) {
    throw new Error(
      "NEXT_PUBLIC_WEBSOCKET_URL is not set. Add it to frontend-v2/.env.local (e.g. ws://localhost:3001)"
    );
  }
  const endpoint = wsUrl + "/ws";

  const socket = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(1000);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;

    function connect() {
      if (unmounted.current) return;

      socket.current = new WebSocket(endpoint);

      socket.current.onopen = () => {
        console.log("Websocket connected");
        reconnectDelay.current = 1000; // Reset backoff on success
      };

      socket.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const eventType = data.event_type;
        const payload = data.payload;

        const { setMessage, addMessage, setProcessing } = usePodcasts.getState();

        console.log("Websocket event received: ", data);

        if (eventType === "reasoning") {
          addMessage({ role: "assistant", content: payload.content, type: "reasoning" });
        } else if (eventType === "tool_call") {
          const toolLabel = payload.tool_name ?? "tool";
          addMessage({ role: "assistant", content: `Using ${toolLabel}…`, type: "tool_call" });
        } else if (eventType === "tool_result") {
          const content = payload.error
            ? `Error: ${payload.error}`
            : payload.result ?? "Done";
          addMessage({ role: "assistant", content, type: "tool_result" });
        } else if (eventType === "assistant") {
          setMessage(payload.content);
          addMessage({ role: "assistant", content: payload.content });
          setProcessing(false);
        } else if (eventType === "episodes") {
          if (payload.podcasts && Array.isArray(payload.podcasts)) {
            addMessage({ role: "assistant", content: "", type: "episodes", episodes: payload.podcasts });
            setProcessing(false);
          }
        } else if (eventType === "error") {
          addMessage({ role: "assistant", content: payload.content ?? "Something went wrong.", type: "error" });
          setProcessing(false);
        } else if (eventType === "message") {
          setMessage(payload.message);
          addMessage({ role: "assistant", content: payload.message });
          setProcessing(false);
        }
      };

      socket.current.onclose = () => {
        console.log("Websocket closed, reconnecting in", reconnectDelay.current, "ms");
        if (!unmounted.current) {
          reconnectTimer.current = setTimeout(() => {
            reconnectDelay.current = Math.min(reconnectDelay.current * 2, MAX_RECONNECT_DELAY);
            connect();
          }, reconnectDelay.current);
        }
      };

      socket.current.onerror = () => {
        // onclose will fire after this, triggering reconnect
      };
    }

    connect();

    return () => {
      unmounted.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (socket.current) socket.current.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable Zustand actions, run once
  }, []);

  return <></>;
};

export default Websocket;
