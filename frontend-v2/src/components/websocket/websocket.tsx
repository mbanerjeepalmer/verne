"use client";

import { usePodcasts } from "@/stores/usePodcasts";
import { IPodcast } from "@/types/podcast";
import { useEffect, useRef } from "react";

const Websocket = () => {
  const { addPodcast, setPodcasts, setMessage, addMessage } = usePodcasts();

  const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
  if (!wsUrl) {
    throw new Error(
      "NEXT_PUBLIC_WEBSOCKET_URL is not set. Add it to frontend-v2/.env.local (e.g. ws://localhost:3001)"
    );
  }
  const endpoint = wsUrl + "/ws";

  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    socket.current = new WebSocket(endpoint);

    socket.current.onopen = () => {
      console.log("🎉 Websocket connected");
    };

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const eventType = data.event_type;
      const payload = data.payload;

      console.log("🎉 Websocket event received: ", data);

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
      } else if (eventType === "episodes") {
        setMessage(payload.message);
        addMessage({ role: "assistant", content: payload.message });
        if (payload.podcasts && Array.isArray(payload.podcasts)) {
          setPodcasts(payload.podcasts);
        }
      } else if (eventType === "error") {
        addMessage({ role: "assistant", content: payload.content ?? "Something went wrong.", type: "error" });
      } else if (eventType === "message") {
        setMessage(payload.message);
        addMessage({ role: "assistant", content: payload.message });
      }
    };

    socket.current.onclose = async () => {};

    return () => {
      if (!socket.current) return;
      socket.current.close();
    };
  }, [addPodcast, setPodcasts, setMessage, addMessage]);

  return <></>;
};

export default Websocket;
