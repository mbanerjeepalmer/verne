"use client";

import { IPodcast, usePodcasts } from "@/stores/usePodcasts";
import { useEffect, useRef } from "react";

const Websocket = () => {
  const { addPodcast } = usePodcasts();

  const endpoint = process.env.NEXT_PUBLIC_WEBSOCKET_URL + "/ws";

  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    socket.current = new WebSocket(endpoint);

    socket.current.onopen = () => {
      console.log("🎉 Websocket connected");
    };

    socket.current.onmessage = (event) => {
      const podcast = JSON.parse(event.data)["payload"]["podcast"] as IPodcast;
      addPodcast(podcast);
      console.log("🎉 Websocket event received: ", JSON.parse(event.data));
    };

    socket.current.onclose = async () => {};

    return () => {
      if (!socket.current) return;
      socket.current.close();
    };
  }, []);

  return <></>;
};

export default Websocket;
