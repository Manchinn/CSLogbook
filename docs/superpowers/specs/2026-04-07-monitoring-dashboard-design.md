# Monitoring Dashboard — Design Spec

**Date:** 2026-04-07
**Status:** Approved
**Route:** `/admin/monitoring`

---

## Goal

หน้า dashboard สำหรับ admin/เจ้าหน้าที่ ดู system health, agent status, live logs, และ audit trail ในหน้าเดียว — ใช้สำหรับ maintenance mode

## Users

- Admin เท่านั้น (RoleGuard roles=["admin"])

## Layout

Single-page dashboard, 4 sections ใน grid:

```
┌─────────────────────┬─────────────────────┐
│  1. System Health   │  2. Agent Status    │
│  (4 stat cards)     │  (agent list + ↻)   │
├─────────────────────┴─────────────────────┤
│  3. Live Log Viewer (full width)          │
│  [file dropdown] [level filter] [search]  │
│  [dark terminal — live tail via Socket.io]│
├───────────────────────────────────────────┤
│  4. Recent System Actions (full width)    │
│  [table from SystemLog DB]                │
└───────────────────────────────────────────┘
```

---

## Section 1: System Health

4 stat cards ใน 2×2 grid:

| Stat | Source | Color |
|------|--------|-------|
| Uptime | `process.uptime()` — format เป็น "Xd Yh" | green |
| Agents Running | AgentManager.getStatus() — นับ running/total | blue |
| Errors (24h) | นับจาก `error.log` หรือ SystemLog ที่ actionType=ERROR ใน 24 ชม. | red |
| Memory Usage | `process.memoryUsage().rss` — format เป็น MB | orange |

**API:** `GET /api/admin/monitoring/health`
```json
{
  "uptime": 489600,
  "agentsRunning": 8,
  "agentsTotal": 8,
  "errors24h": 3,
  "memoryMB": 142
}
```

---

## Section 2: Agent Status

แสดงรายชื่อ agents ทั้งหมดจาก AgentManager:

| Column | Data |
|--------|------|
| ชื่อ (Thai) | `agentStatusService.getAgentDisplayName()` |
| Schedule | `agentStatusService.getAgentSchedule()` |
| Status | dot สี (green=running, gray=stopped) + label |
| Action | ปุ่ม ↻ restart |

**API:** ใช้ endpoint ที่มีอยู่ `GET /api/admin/agent-status`
**Restart:** ใช้ `POST /api/admin/agent-status/:agentName/restart`

---

## Section 3: Live Log Viewer

### UI Components
- **LIVE indicator** — green dot + "LIVE" label (pulse animation)
- **File dropdown** — เลือก 1 ใน 5 log files: `app.log`, `error.log`, `agents.log`, `auth.log`, `notifications.log`
- **Level filter** — All / ERROR / WARN / INFO / DEBUG
- **Search input** — filter log lines ด้วย keyword (client-side filter)
- **Log area** — dark theme (Catppuccin Mocha), monospace font, max-height 400px + scroll, auto-scroll to bottom

### Color scheme (per level)
- INFO: `#89b4fa` (blue)
- WARN: `#f9e2af` (yellow)
- ERROR: `#f38ba8` (red, bold)
- DEBUG: `#6c7086` (gray)
- Timestamp: `#6c7086` (gray)

### Real-time via Socket.io

**Backend:** สร้าง Socket.io namespace `/monitoring` (admin-only auth)

```
Client                           Server
  |--- join(logFile) ----------->|  start tail on logFile
  |<-- log_line(data) -----------|  new line from file
  |--- switch(newLogFile) ------>|  stop old tail, start new
  |--- disconnect -------------->|  cleanup tail watchers
```

**Implementation:**
- ใช้ `fs.watch()` หรือ `tail` module watch log file
- ส่ง parsed log line: `{ timestamp, level, source, message }`
- Client filter level/search ฝั่ง frontend (ไม่ส่งกลับ server)

**API (initial load):** `GET /api/admin/monitoring/logs?file=app.log&lines=100`
- โหลด 100 lines ล่าสุดเมื่อเปิดหน้าหรือสลับ file
- หลังจากนั้นรับ real-time ผ่าน Socket.io

---

## Section 4: Recent System Actions

### UI
- Table แสดง SystemLog records ล่าสุด (default 20 rows)
- Columns: เวลา, ผู้ใช้, ประเภท (badge), รายละเอียด, IP
- Badge สีตาม actionType:
  - LOGIN → blue
  - APPROVE → green
  - REJECT → red
  - UPDATE → orange
- Auto-refresh ทุก 30 วินาที (TanStack Query refetchInterval)

**API:** `GET /api/admin/monitoring/system-logs?limit=20&offset=0`
```json
{
  "data": [
    {
      "logId": 1,
      "actionType": "APPROVE",
      "actionDescription": "อนุมัติ CS05 #312",
      "ipAddress": "203.150.x.x",
      "userId": 5,
      "user": { "firstName": "admin", "lastName": "01" },
      "createdAt": "2026-04-07T14:05:30Z"
    }
  ],
  "total": 150
}
```

---

## File Structure

### Backend (3 ไฟล์ใหม่)
```
backend/
├── routes/admin/monitoringRoutes.js       # 3 endpoints + Socket.io setup
├── services/monitoringService.js          # health stats, log reader, SystemLog query
└── (modify) server.js                     # mount Socket.io namespace /monitoring
```

### Frontend (4 ไฟล์ใหม่)
```
frontend-next/src/
├── app/(app)/admin/monitoring/
│   └── page.tsx                           # Page with RoleGuard
├── components/admin/monitoring/
│   ├── SystemHealthCard.tsx               # 4 stat cards
│   ├── AgentStatusCard.tsx                # agent list + restart
│   ├── LiveLogViewer.tsx                  # Socket.io log viewer
│   └── SystemActionsTable.tsx             # SystemLog table
├── hooks/
│   └── useLogStream.ts                    # Socket.io hook for log streaming
└── lib/services/
    └── monitoringService.ts               # API calls
```

---

## Tech Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Real-time | Socket.io (existing) | มี infra อยู่แล้ว ไม่ต้องเพิ่ม dependency |
| Log parsing | Server-side parse → JSON | Client ไม่ต้อง parse raw text |
| Level/search filter | Client-side | ลด server load, responsive UX |
| SystemLog query | Sequelize + pagination | มี model อยู่แล้ว |
| Auth | Socket.io middleware (JWT) | เดียวกับ REST auth |
| Style | Ant Design + custom CSS | ตาม codebase pattern |

---

## Out of Scope (อนาคต)

- Collapsible sections
- Log download/export
- Alert/notification เมื่อ error threshold ถึง
- Email log table
- Agent log history (last run result)
