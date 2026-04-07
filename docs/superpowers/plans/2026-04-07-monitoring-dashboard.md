# Monitoring Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างหน้า admin monitoring dashboard แสดง system health, agent status, live log viewer (Socket.io), และ SystemLog audit trail

**Architecture:** Backend เพิ่ม 3 endpoints + Socket.io namespace `/monitoring` สำหรับ log streaming. Frontend เพิ่ม page + 4 components + 1 hook ใต้ admin route. ใช้ agentStatusService + SystemLog model ที่มีอยู่แล้ว

**Tech Stack:** Express, Socket.io, Winston, Sequelize | Next.js, TanStack Query, Ant Design, Socket.io-client

**Spec:** `docs/superpowers/specs/2026-04-07-monitoring-dashboard-design.md`

---

## File Structure

```
Backend (create/modify):
  cslogbook/backend/services/monitoringService.js          # NEW — health stats, log reader, SystemLog query
  cslogbook/backend/routes/admin/monitoringRoutes.js       # NEW — 3 REST endpoints
  cslogbook/backend/routes/adminRoutes.js                  # MODIFY — mount monitoring routes
  cslogbook/backend/server.js                              # MODIFY — add Socket.io /monitoring namespace

Frontend (create):
  cslogbook/frontend-next/src/lib/services/monitoringService.ts    # NEW — API calls
  cslogbook/frontend-next/src/hooks/useLogStream.ts                # NEW — Socket.io hook
  cslogbook/frontend-next/src/components/admin/monitoring/SystemHealthCard.tsx   # NEW
  cslogbook/frontend-next/src/components/admin/monitoring/AgentStatusCard.tsx    # NEW
  cslogbook/frontend-next/src/components/admin/monitoring/LiveLogViewer.tsx      # NEW
  cslogbook/frontend-next/src/components/admin/monitoring/SystemActionsTable.tsx # NEW
  cslogbook/frontend-next/src/app/(app)/admin/monitoring/page.tsx               # NEW — page
```

---

## Task 1: Backend — monitoringService.js

**Files:**
- Create: `cslogbook/backend/services/monitoringService.js`

- [ ] **Step 1: สร้าง monitoringService พร้อม 3 methods**

```javascript
// cslogbook/backend/services/monitoringService.js
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Op } = require('sequelize');
const { SystemLog, User } = require('../models');
const agentManager = require('../agents');
const logger = require('../utils/logger');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const VALID_LOG_FILES = ['app.log', 'error.log', 'agents.log', 'auth.log', 'notifications.log'];

class MonitoringService {
  /**
   * ดึง system health stats
   */
  async getHealthStats() {
    const status = agentManager.getStatus();
    const agentList = agentManager.getAgentList();
    const runningCount = agentList.filter(name => status.agents[name]?.isRunning).length;

    // นับ errors 24 ชม. จาก SystemLog
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const errors24h = await SystemLog.count({
      where: {
        actionType: { [Op.like]: '%ERROR%' },
        created_at: { [Op.gte]: oneDayAgo }
      }
    });

    const mem = process.memoryUsage();

    return {
      uptime: Math.floor(process.uptime()),
      agentsRunning: runningCount,
      agentsTotal: agentList.length,
      errors24h,
      memoryMB: Math.round(mem.rss / 1024 / 1024)
    };
  }

  /**
   * อ่าน N บรรทัดสุดท้ายจาก log file
   * @param {string} fileName - ชื่อไฟล์ log
   * @param {number} lines - จำนวนบรรทัด (default 100)
   */
  async getRecentLogs(fileName, lines = 100) {
    if (!VALID_LOG_FILES.includes(fileName)) {
      throw new Error(`Invalid log file: ${fileName}`);
    }

    const filePath = path.join(LOG_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const result = [];
      const rl = readline.createInterface({
        input: fs.createReadStream(filePath, { encoding: 'utf8' }),
        crlfDelay: Infinity
      });

      rl.on('line', (line) => {
        result.push(line);
        if (result.length > lines) {
          result.shift();
        }
      });

      rl.on('close', () => {
        resolve(result.map(line => this.parseLine(line)));
      });

      rl.on('error', reject);
    });
  }

  /**
   * Parse log line เป็น structured object
   * Format: [2026-04-07 14:05:21] INFO: message {metadata}
   */
  parseLine(raw) {
    const match = raw.match(/^\[(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})\]\s(\w+):\s(.*)$/);
    if (match) {
      return { timestamp: match[1], level: match[2], message: match[3], raw };
    }
    return { timestamp: '', level: 'INFO', message: raw, raw };
  }

  /**
   * ดึง SystemLog records ล่าสุด
   * @param {number} limit
   * @param {number} offset
   */
  async getSystemActions(limit = 20, offset = 0) {
    const { count, rows } = await SystemLog.findAndCountAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['userId', 'firstName', 'lastName', 'role']
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return {
      data: rows,
      total: count,
      limit,
      offset
    };
  }

  /**
   * สร้าง file watcher สำหรับ live tail
   * @param {string} fileName
   * @param {Function} onLine - callback เมื่อมี line ใหม่
   * @returns {{ stop: Function }} watcher handle
   */
  createLogWatcher(fileName, onLine) {
    if (!VALID_LOG_FILES.includes(fileName)) {
      throw new Error(`Invalid log file: ${fileName}`);
    }

    const filePath = path.join(LOG_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return { stop: () => {} };
    }

    let fileSize = fs.statSync(filePath).size;
    let stopped = false;

    const watcher = fs.watch(filePath, (eventType) => {
      if (stopped || eventType !== 'change') return;

      const newSize = fs.statSync(filePath).size;
      if (newSize <= fileSize) {
        fileSize = newSize;
        return;
      }

      const stream = fs.createReadStream(filePath, {
        start: fileSize,
        encoding: 'utf8'
      });

      let buffer = '';
      stream.on('data', (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.trim()) {
            onLine(this.parseLine(line));
          }
        }
      });

      stream.on('end', () => {
        fileSize = newSize;
      });
    });

    return {
      stop: () => {
        stopped = true;
        watcher.close();
      }
    };
  }
}

module.exports = new MonitoringService();
```

- [ ] **Step 2: Verify — ตรวจว่า models import ถูก**

```bash
cd cslogbook/backend && node -e "const s = require('./services/monitoringService'); console.log(typeof s.getHealthStats)"
```
Expected: `function`

- [ ] **Step 3: Commit**

```bash
git add cslogbook/backend/services/monitoringService.js
git commit -m "feat(monitoring): add monitoringService — health, logs, SystemLog, file watcher"
```

---

## Task 2: Backend — REST Routes + Socket.io

**Files:**
- Create: `cslogbook/backend/routes/admin/monitoringRoutes.js`
- Modify: `cslogbook/backend/routes/adminRoutes.js`
- Modify: `cslogbook/backend/server.js`

- [ ] **Step 1: สร้าง monitoring routes**

```javascript
// cslogbook/backend/routes/admin/monitoringRoutes.js
const express = require('express');
const router = express.Router();
const monitoringService = require('../../services/monitoringService');
const logger = require('../../utils/logger');

// GET /api/admin/monitoring/health
router.get('/health', async (req, res) => {
  try {
    const stats = await monitoringService.getHealthStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('MonitoringRoute health error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/monitoring/logs?file=app.log&lines=100
router.get('/logs', async (req, res) => {
  try {
    const { file = 'app.log', lines = 100 } = req.query;
    const logs = await monitoringService.getRecentLogs(file, Math.min(Number(lines), 500));
    res.json({ success: true, data: logs });
  } catch (error) {
    logger.error('MonitoringRoute logs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/monitoring/system-logs?limit=20&offset=0
router.get('/system-logs', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const result = await monitoringService.getSystemActions(
      Math.min(Number(limit), 100),
      Number(offset)
    );
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('MonitoringRoute system-logs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Mount ใน adminRoutes.js**

ใน `cslogbook/backend/routes/adminRoutes.js` เพิ่มหลัง agent-status routes (line 168):

```javascript
// === Monitoring Routes ===
const monitoringRoutes = require('./admin/monitoringRoutes');
router.use('/monitoring', adminAuth, monitoringRoutes);
```

- [ ] **Step 3: เพิ่ม Socket.io /monitoring namespace ใน server.js**

ใน `cslogbook/backend/server.js` เพิ่มหลัง `io.on('connection', ...)` block (หลัง line ~275):

```javascript
// === Monitoring Socket.io namespace (admin-only) ===
const monitoringNs = io.of('/monitoring');
const monitoringService = require('./services/monitoringService');

monitoringNs.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const jwtLib = require('jsonwebtoken');
    const payload = jwtLib.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin') {
      return next(new Error('Admin access required'));
    }
    socket.data.userId = payload.userId || payload.id;
    socket.data.role = payload.role;
    next();
  } catch (e) {
    next(new Error('Invalid token'));
  }
});

monitoringNs.on('connection', (socket) => {
  logger.info(`[Monitoring] Admin connected userId=${socket.data.userId}`);
  let currentWatcher = null;

  socket.on('tail', (fileName) => {
    // หยุด watcher เก่า
    if (currentWatcher) {
      currentWatcher.stop();
      currentWatcher = null;
    }

    try {
      currentWatcher = monitoringService.createLogWatcher(fileName, (logLine) => {
        socket.emit('log_line', logLine);
      });
      logger.info(`[Monitoring] Tailing ${fileName} for userId=${socket.data.userId}`);
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('stop_tail', () => {
    if (currentWatcher) {
      currentWatcher.stop();
      currentWatcher = null;
    }
  });

  socket.on('disconnect', () => {
    if (currentWatcher) {
      currentWatcher.stop();
      currentWatcher = null;
    }
    logger.info(`[Monitoring] Admin disconnected userId=${socket.data.userId}`);
  });
});
```

- [ ] **Step 4: Verify — test health endpoint**

```bash
curl -s http://localhost:5000/api/admin/monitoring/health
```
Expected: 401 (ต้อง auth) — ยืนยันว่า route mounted ถูก

- [ ] **Step 5: Commit**

```bash
git add cslogbook/backend/routes/admin/monitoringRoutes.js cslogbook/backend/routes/adminRoutes.js cslogbook/backend/server.js
git commit -m "feat(monitoring): add REST endpoints + Socket.io /monitoring namespace"
```

---

## Task 3: Frontend — monitoringService.ts + useLogStream hook

**Files:**
- Create: `cslogbook/frontend-next/src/lib/services/monitoringService.ts`
- Create: `cslogbook/frontend-next/src/hooks/useLogStream.ts`

- [ ] **Step 1: สร้าง API service**

```typescript
// cslogbook/frontend-next/src/lib/services/monitoringService.ts
import { apiFetch } from "@/lib/api/client";

export interface HealthStats {
  uptime: number;
  agentsRunning: number;
  agentsTotal: number;
  errors24h: number;
  memoryMB: number;
}

export interface LogLine {
  timestamp: string;
  level: string;
  message: string;
  raw: string;
}

export interface SystemAction {
  logId: number;
  actionType: string;
  actionDescription: string;
  ipAddress: string | null;
  userId: number | null;
  user: { userId: number; firstName: string; lastName: string; role: string } | null;
  created_at: string;
}

export async function getHealthStats(token: string): Promise<HealthStats> {
  const res = await apiFetch("/admin/monitoring/health", { token });
  return res.data;
}

export async function getRecentLogs(token: string, file = "app.log", lines = 100): Promise<LogLine[]> {
  const res = await apiFetch(`/admin/monitoring/logs?file=${file}&lines=${lines}`, { token });
  return res.data;
}

export async function getSystemActions(
  token: string,
  limit = 20,
  offset = 0
): Promise<{ data: SystemAction[]; total: number }> {
  const res = await apiFetch(`/admin/monitoring/system-logs?limit=${limit}&offset=${offset}`, { token });
  return { data: res.data, total: res.total };
}
```

- [ ] **Step 2: สร้าง useLogStream hook**

```typescript
// cslogbook/frontend-next/src/hooks/useLogStream.ts
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

    const socket = io(`${baseUrl}/monitoring`, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("tail", logFile);
    });

    socket.on("log_line", (logLine: LogLine) => {
      setLines((prev) => {
        const next = [...prev, logLine];
        return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
      });
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    return () => {
      socket.emit("stop_tail");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, logFile]);

  return { lines, connected, clearLines };
}
```

- [ ] **Step 3: Verify — TypeScript check**

```bash
cd cslogbook/frontend-next && npx tsc --noEmit 2>&1 | grep -i "monitoringService\|useLogStream" | head -5
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add cslogbook/frontend-next/src/lib/services/monitoringService.ts cslogbook/frontend-next/src/hooks/useLogStream.ts
git commit -m "feat(monitoring): add frontend API service + useLogStream Socket.io hook"
```

---

## Task 4: Frontend — 4 Components

**Files:**
- Create: `cslogbook/frontend-next/src/components/admin/monitoring/SystemHealthCard.tsx`
- Create: `cslogbook/frontend-next/src/components/admin/monitoring/AgentStatusCard.tsx`
- Create: `cslogbook/frontend-next/src/components/admin/monitoring/LiveLogViewer.tsx`
- Create: `cslogbook/frontend-next/src/components/admin/monitoring/SystemActionsTable.tsx`

- [ ] **Step 1: SystemHealthCard**

```tsx
// cslogbook/frontend-next/src/components/admin/monitoring/SystemHealthCard.tsx
"use client";

import type { HealthStats } from "@/lib/services/monitoringService";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

type Props = { stats: HealthStats | undefined; isLoading: boolean };

export function SystemHealthCard({ stats, isLoading }: Props) {
  if (isLoading || !stats) {
    return <div className="card"><h2>SYSTEM HEALTH</h2><p>Loading...</p></div>;
  }

  const items = [
    { label: "Uptime", value: formatUptime(stats.uptime), color: "#22c55e" },
    { label: "Agents Running", value: `${stats.agentsRunning}/${stats.agentsTotal}`, color: "#3b82f6" },
    { label: "Errors (24h)", value: String(stats.errors24h), color: stats.errors24h > 0 ? "#ef4444" : "#22c55e" },
    { label: "Memory", value: `${stats.memoryMB} MB`, color: stats.memoryMB > 512 ? "#f59e0b" : "#3b82f6" },
  ];

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
      <h2 style={{ fontSize: 15, color: "#666", marginBottom: 14, textTransform: "uppercase", fontWeight: 600 }}>
        System Health
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {items.map((item) => (
          <div key={item.label} style={{ textAlign: "center", padding: 12, background: "#f8f9fa", borderRadius: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: AgentStatusCard**

```tsx
// cslogbook/frontend-next/src/components/admin/monitoring/AgentStatusCard.tsx
"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api/client";

type AgentDetail = {
  name: string;
  description: string;
  isRunning: boolean;
  schedule: string;
};

type Props = {
  agents: Record<string, AgentDetail> | undefined;
  token: string | null;
  isLoading: boolean;
  onRefresh: () => void;
};

export function AgentStatusCard({ agents, token, isLoading, onRefresh }: Props) {
  const [restarting, setRestarting] = useState<string | null>(null);

  const handleRestart = async (agentName: string) => {
    if (!token) return;
    setRestarting(agentName);
    try {
      await apiFetch(`/admin/agent-status/${agentName}/restart`, { token, method: "POST" });
      setTimeout(onRefresh, 2500);
    } catch (err) {
      console.error("Restart failed:", err);
    } finally {
      setRestarting(null);
    }
  };

  if (isLoading || !agents) {
    return <div style={{ background: "#fff", borderRadius: 12, padding: 20 }}><h2>AGENT STATUS</h2><p>Loading...</p></div>;
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
      <h2 style={{ fontSize: 15, color: "#666", marginBottom: 14, textTransform: "uppercase", fontWeight: 600 }}>
        Agent Status
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Object.entries(agents).map(([key, agent]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#f8f9fa", borderRadius: 8, fontSize: 13 }}>
            <span style={{ fontWeight: 600, flex: 1 }}>{agent.name}</span>
            <span style={{ color: "#888", fontSize: 12, flex: 1, textAlign: "center" }}>{agent.schedule}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 80 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: agent.isRunning ? "#22c55e" : "#ccc", display: "inline-block" }} />
              {agent.isRunning ? "Running" : "Stopped"}
            </span>
            <button
              onClick={() => handleRestart(key)}
              disabled={restarting === key}
              style={{ background: "none", border: "1px solid #ddd", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}
            >
              {restarting === key ? "..." : "↻"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: LiveLogViewer**

```tsx
// cslogbook/frontend-next/src/components/admin/monitoring/LiveLogViewer.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useLogStream } from "@/hooks/useLogStream";
import type { LogLine } from "@/lib/services/monitoringService";

const LOG_FILES = ["app.log", "error.log", "agents.log", "auth.log", "notifications.log"];
const LEVELS = ["ALL", "ERROR", "WARN", "INFO", "DEBUG"];
const LEVEL_COLORS: Record<string, string> = {
  ERROR: "#f38ba8",
  WARN: "#f9e2af",
  INFO: "#89b4fa",
  DEBUG: "#6c7086",
};

type Props = {
  token: string | null;
  initialLines: LogLine[];
};

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

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filtered.length]);

  const handleFileChange = (file: string) => {
    setLogFile(file);
    clearLines();
  };

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
      <h2 style={{ fontSize: 15, color: "#666", marginBottom: 14, textTransform: "uppercase", fontWeight: 600 }}>
        Live Log Viewer
      </h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: connected ? "#22c55e" : "#ef4444", display: "inline-block", animation: connected ? "pulse 1.5s infinite" : "none" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: connected ? "#22c55e" : "#ef4444" }}>
          {connected ? "LIVE" : "DISCONNECTED"}
        </span>
        <select value={logFile} onChange={(e) => handleFileChange(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}>
          {LOG_FILES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}
        />
      </div>
      <div style={{ background: "#1e1e2e", borderRadius: 8, padding: 16, fontFamily: '"Cascadia Code","Fira Code",monospace', fontSize: 12, lineHeight: 1.8, color: "#cdd6f4", maxHeight: 400, overflowY: "auto" }}>
        {filtered.map((line, i) => (
          <div key={i} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <span style={{ color: "#6c7086" }}>{line.timestamp} </span>
            <span style={{ color: LEVEL_COLORS[line.level] || "#cdd6f4", fontWeight: line.level === "ERROR" ? 700 : 400 }}>
              {line.level.padEnd(5)}
            </span>{" "}
            {line.message}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
```

- [ ] **Step 4: SystemActionsTable**

```tsx
// cslogbook/frontend-next/src/components/admin/monitoring/SystemActionsTable.tsx
"use client";

import type { SystemAction } from "@/lib/services/monitoringService";

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  LOGIN: { bg: "#dbeafe", color: "#2563eb" },
  APPROVE: { bg: "#d1fae5", color: "#059669" },
  REJECT: { bg: "#fee2e2", color: "#dc2626" },
  UPDATE: { bg: "#fef3c7", color: "#d97706" },
  CREATE: { bg: "#e0e7ff", color: "#4338ca" },
  DELETE: { bg: "#fce7f3", color: "#be185d" },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

type Props = { actions: SystemAction[] | undefined; isLoading: boolean };

export function SystemActionsTable({ actions, isLoading }: Props) {
  if (isLoading || !actions) {
    return <div style={{ background: "#fff", borderRadius: 12, padding: 20 }}><h2>RECENT SYSTEM ACTIONS</h2><p>Loading...</p></div>;
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
      <h2 style={{ fontSize: 15, color: "#666", marginBottom: 14, textTransform: "uppercase", fontWeight: 600 }}>
        Recent System Actions
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["เวลา", "ผู้ใช้", "ประเภท", "รายละเอียด", "IP"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid #e5e7eb", color: "#666", fontWeight: 600, fontSize: 12 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {actions.map((action) => {
            const badge = BADGE_STYLES[action.actionType] || BADGE_STYLES.UPDATE;
            return (
              <tr key={action.logId} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "8px 12px" }}>{formatTime(action.created_at)}</td>
                <td style={{ padding: "8px 12px" }}>
                  {action.user ? `${action.user.firstName} ${action.user.lastName}` : "-"}
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color }}>
                    {action.actionType}
                  </span>
                </td>
                <td style={{ padding: "8px 12px" }}>{action.actionDescription}</td>
                <td style={{ padding: "8px 12px", color: "#888" }}>{action.ipAddress || "-"}</td>
              </tr>
            );
          })}
          {actions.length === 0 && (
            <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "#888" }}>ไม่มีข้อมูล</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Verify — TypeScript check**

```bash
cd cslogbook/frontend-next && npx tsc --noEmit 2>&1 | grep "monitoring\|LogViewer\|AgentStatus\|SystemHealth\|SystemActions" | head -10
```
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add cslogbook/frontend-next/src/components/admin/monitoring/
git commit -m "feat(monitoring): add 4 dashboard components — health, agents, logs, actions"
```

---

## Task 5: Frontend — Page Assembly

**Files:**
- Create: `cslogbook/frontend-next/src/app/(app)/admin/monitoring/page.tsx`

- [ ] **Step 1: สร้าง monitoring page**

```tsx
// cslogbook/frontend-next/src/app/(app)/admin/monitoring/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { getHealthStats, getRecentLogs, getSystemActions } from "@/lib/services/monitoringService";
import { SystemHealthCard } from "@/components/admin/monitoring/SystemHealthCard";
import { AgentStatusCard } from "@/components/admin/monitoring/AgentStatusCard";
import { LiveLogViewer } from "@/components/admin/monitoring/LiveLogViewer";
import { SystemActionsTable } from "@/components/admin/monitoring/SystemActionsTable";
import { apiFetch } from "@/lib/api/client";

export default function MonitoringPage() {
  const { token } = useAuth();

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ["monitoring-health"],
    queryFn: () => getHealthStats(token!),
    enabled: Boolean(token),
    refetchInterval: 15_000,
  });

  const { data: agentData, isLoading: agentLoading, refetch: refetchAgents } = useQuery({
    queryKey: ["agent-status"],
    queryFn: async () => {
      const res = await apiFetch("/admin/agent-status", { token: token! });
      return res.data?.agentDetails || res.agentDetails || {};
    },
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });

  const { data: initialLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["monitoring-logs-initial"],
    queryFn: () => getRecentLogs(token!, "app.log", 100),
    enabled: Boolean(token),
  });

  const { data: actionsData, isLoading: actionsLoading } = useQuery({
    queryKey: ["monitoring-system-actions"],
    queryFn: () => getSystemActions(token!, 20, 0),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });

  return (
    <RoleGuard roles={["admin"]}>
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, marginBottom: 20, color: "#1a1a2e" }}>
          System Monitoring
          <span style={{ background: "#1a1a2e", color: "#fff", fontSize: 11, padding: "3px 10px", borderRadius: 6, marginLeft: 8 }}>
            Admin Only
          </span>
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <SystemHealthCard stats={healthData} isLoading={healthLoading} />
          <AgentStatusCard
            agents={agentData}
            token={token}
            isLoading={agentLoading}
            onRefresh={() => refetchAgents()}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <LiveLogViewer token={token} initialLines={initialLogs} />
        </div>

        <SystemActionsTable actions={actionsData?.data} isLoading={actionsLoading} />
      </div>
    </RoleGuard>
  );
}
```

- [ ] **Step 2: Verify — page loads without error**

```bash
cd cslogbook/frontend-next && npx tsc --noEmit 2>&1 | wc -l
```
Expected: 0

- [ ] **Step 3: Commit**

```bash
git add "cslogbook/frontend-next/src/app/(app)/admin/monitoring/page.tsx"
git commit -m "feat(monitoring): add admin monitoring dashboard page"
```

---

## Task 6: Menu Integration

**Files:**
- Modify: `cslogbook/frontend-next/src/lib/navigation/menuConfig.ts`

- [ ] **Step 1: เพิ่ม monitoring link ใน admin menu**

ค้นหาส่วน admin menu ใน menuConfig.ts แล้วเพิ่ม link ไปยัง `/admin/monitoring`:

```typescript
// เพิ่มใน admin menu group (ตำแหน่ง: หลังรายการสุดท้ายของ admin settings)
{ kind: "link", label: "System Monitoring", href: "/admin/monitoring", icon: "monitor" },
```

- [ ] **Step 2: Verify — ดูว่า menu render ไม่พัง**

```bash
cd cslogbook/frontend-next && npx tsc --noEmit 2>&1 | wc -l
```
Expected: 0

- [ ] **Step 3: Commit**

```bash
git add cslogbook/frontend-next/src/lib/navigation/menuConfig.ts
git commit -m "feat(monitoring): add monitoring link to admin menu"
```

---

## Execution Notes

- **Task 1-2** (backend) ไม่ขึ้นกับ Task 3-6 (frontend) → dispatch พร้อมกันได้
- **Task 3** ต้องเสร็จก่อน Task 4-5 (components ใช้ types จาก service)
- **Task 4** ต้องเสร็จก่อน Task 5 (page import components)
- **Task 6** ต้องเสร็จหลังสุด (depend on page existing)

```
Wave 1 (parallel):  Task 1 + Task 2 (backend)
Wave 2 (sequential): Task 3 → Task 4 → Task 5 → Task 6 (frontend)
```
