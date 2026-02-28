"use client";

import { usePodcasts } from "@/stores/usePodcasts";
import { IPodcast } from "@/types/podcast";
import { useEffect, useRef } from "react";

const Websocket = () => {
  const { addPodcast, setPodcasts, setMessage } = usePodcasts();

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

      if (eventType === "clarification") {
        // Handle clarification message
        setMessage(payload.message);
      } else if (eventType === "results") {
        // Handle results with message and podcasts
        setMessage(payload.message);
        if (payload.podcasts && Array.isArray(payload.podcasts)) {
          setPodcasts(payload.podcasts);
        }
      } else if (eventType === "podcast" && payload.podcast) {
        // Handle single podcast (legacy support)
        addPodcast(payload.podcast as IPodcast);
      }
    };

    socket.current.onclose = async () => {};

    return () => {
      if (!socket.current) return;
      socket.current.close();
    };
  }, [addPodcast, setPodcasts, setMessage]);

  return <></>;
};

export default Websocket;
