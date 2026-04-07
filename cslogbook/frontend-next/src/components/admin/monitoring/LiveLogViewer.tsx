"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useLogStream } from "@/hooks/useLogStream";
import type { LogLine } from "@/lib/services/monitoringService";

const LOG_FILES = ["app.log", "error.log", "agents.log", "auth.log", "notifications.log"];
const LEVELS = ["ALL", "ERROR", "WARN", "INFO", "DEBUG"];
const LEVEL_COLORS: Record<string, string> = { ERROR: "#f38ba8", WARN: "#f9e2af", INFO: "#89b4fa", DEBUG: "#6c7086" };

type Props = { token: string | null; initialLines: LogLine[] };

export function LiveLogViewer({ token, initialLines }: Props) {
  const [logFile, setLogFile] = useState("app.log");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);

  const { lines: liveLines, connected, clearLines } = useLogStream(token, logFile);
  const allLines = useMemo(() => [...initialLines, ...liveLines], [initialLines, liveLines]);

  const filtered = useMemo(() => {
    return allLines.filter((line) => {
      if (levelFilter !== "ALL" && line.level !== levelFilter) return false;
      if (search && !line.raw.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allLines, levelFilter, search]);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [filtered.length]);

  const handleFileChange = (file: string) => { setLogFile(file); clearLines(); };

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.08)", minWidth: 0, overflow: "hidden" }}>
      <h2 style={{ fontSize: 15, color: "#666", marginBottom: 14, textTransform: "uppercase", fontWeight: 600 }}>Live Log Viewer</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: connected ? "#22c55e" : "#ef4444", display: "inline-block", animation: connected ? "pulse 1.5s infinite" : "none" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: connected ? "#22c55e" : "#ef4444" }}>{connected ? "LIVE" : "DISCONNECTED"}</span>
        <select value={logFile} onChange={(e) => handleFileChange(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}>
          {LOG_FILES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <input type="text" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 150, padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }} />
      </div>
      <div style={{ background: "#1e1e2e", borderRadius: 8, padding: 16, fontFamily: '"Cascadia Code","Fira Code",monospace', fontSize: 12, lineHeight: 1.8, color: "#cdd6f4", maxHeight: 400, overflowY: "auto", overflowX: "auto" }}>
        {filtered.length === 0 && <div style={{ color: "#6c7086" }}>No logs to display</div>}
        {filtered.map((line, i) => (
          <div key={i} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <span style={{ color: "#6c7086" }}>{line.timestamp} </span>
            <span style={{ color: LEVEL_COLORS[line.level] || "#cdd6f4", fontWeight: line.level === "ERROR" ? 700 : 400 }}>{line.level.padEnd(5)}</span>{" "}
            {line.message}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
