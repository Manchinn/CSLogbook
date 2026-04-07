"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { LogLine } from "@/lib/services/monitoringService";

const MAX_LINES = 500;

export function useLogStream(token: string | null, logFile: string) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const clearLines = useCallback(() => setLines([]), []);

  useEffect(() => {
    if (!token) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const baseUrl = apiUrl.replace(/\/api\/?$/, "");
    const socket = io(`${baseUrl}/monitoring`, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => { setConnected(true); socket.emit("tail", logFile); });
    socket.on("log_line", (logLine: LogLine) => {
      setLines((prev) => {
        const next = [...prev, logLine];
        return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
      });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    return () => { socket.emit("stop_tail"); socket.disconnect(); socketRef.current = null; };
  }, [token, logFile]);

  return { lines, connected, clearLines };
}
