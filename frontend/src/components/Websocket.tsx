"use client";

import { useEffect, useRef } from "react";

const Websocket = () => {
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    socket.current = new WebSocket(
      `${import.meta.env.VITE_WEBSOCKET_SERVER_URL}`,
    );

    socket.current.onopen = () => {
      console.log("🎉 Websocket connected");
    };

    socket.current.onmessage = (event) => {
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
