# Notification Bell Feature — Design Spec

## Context

ระบบ CSLogbook ยังไม่มีระบบแจ้งเตือน (notification) แบบ in-app ทำให้นักศึกษา อาจารย์ และ admin ต้องเข้าไปตรวจสอบสถานะคำร้อง/เอกสารเองตลอด โดย Socket.io infrastructure มีพร้อมอยู่แล้ว (room `user_{userId}`, auth middleware) แต่ยังใช้แค่ emit `document:rejected` เพียง 2 จุด

**เป้าหมาย:** สร้าง notification bell icon 🔔 ที่มุมบนขวาของ AppShell พร้อม dropdown popover แสดงรายการแจ้งเตือน เพื่อให้ผู้ใช้ทุก role ทราบเมื่อมีการ approve/reject, ส่งเอกสาร, นัดสอบ, นัดประชุม โดยเก็บ notification ลง database (persistent)

---

## Architecture Overview

**Approach: Centralized NotificationService**

```
[Controller/Service]
    → notificationService.createAndNotify(userId, { type, title, message, metadata })
        → INSERT notifications table
        → io.to(`user_${userId}`).emit('notification:new', payload)

[Frontend]
    NotificationProvider (Socket.io client)
        → listen 'notification:new'
        → update badge count + notification list
        → Bell icon + Popover dropdown in AppShell header
```

---

## 1. Database — Notification Model

### Migration: `create-notifications`

```sql
CREATE TABLE notifications (
  notification_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  type              ENUM('DOCUMENT','APPROVAL','LOGBOOK','EVALUATION','MEETING') NOT NULL,
  title             VARCHAR(200) NOT NULL,
  message           VARCHAR(500),
  metadata          JSON,
  is_read           BOOLEAN DEFAULT FALSE,
  created_at        DATETIME DEFAULT NOW(),
  updated_at        DATETIME DEFAULT NOW(),

  INDEX idx_notif_user_read (user_id, is_read),
  INDEX idx_notif_user_created (user_id, created_at DESC),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

### Sequelize Model: `backend/models/Notification.js`

| Field | Type | Notes |
|---|---|---|
| `notificationId` | INTEGER, PK, AUTO | maps to `notification_id` |
| `userId` | INTEGER, FK → users | ผู้รับ notification |
| `type` | ENUM | DOCUMENT, APPROVAL, LOGBOOK, EVALUATION, MEETING |
| `title` | STRING(200) | เช่น "คำร้อง CS03 ได้รับการอนุมัติ" |
| `message` | STRING(500), nullable | รายละเอียดเพิ่มเติม |
| `metadata` | JSON, nullable | ดู metadata schema ด้านล่าง |
| `isRead` | BOOLEAN, default false | สถานะอ่านแล้ว |

**Metadata schema per type:**

| Type | Metadata fields |
|---|---|
| DOCUMENT | `{ documentId, documentName, action: approved/rejected/submitted, targetUrl }` |
| APPROVAL | `{ documentId, documentName, action: approved/rejected, targetUrl }` |
| LOGBOOK | `{ logbookId, targetUrl }` |
| EVALUATION | `{ examType: topic/defense, targetUrl }` |
| MEETING | `{ meetingId, meetingDate, targetUrl }` |

`targetUrl` ใช้เป็น relative path (เช่น `/project/documents`) เพื่อให้ frontend navigate ไปหน้าที่เกี่ยวข้องเมื่อคลิก notification

**Associations:**

- `Notification.belongsTo(User, { foreignKey: 'userId' })`

---

## 2. Backend — NotificationService

### File: `backend/services/notificationService.js` (ใหม่)

แทนที่ `agents/helpers/notificationService.js` (dead code ที่ ref model ที่ไม่มี)

```javascript
class NotificationService {
  /**
   * Initialize ครั้งเดียวใน server.js หลัง app.set('io', io)
   * เพื่อไม่ต้อง pass io ทุก call
   */
  init(io) { this.io = io; }

  /**
   * สร้าง notification + emit real-time via Socket.io
   * ตรวจ NotificationSetting ก่อนสร้าง
   */
  async createAndNotify(userId, { type, title, message, metadata }) { }

  /**
   * สร้าง notification ให้หลาย user พร้อมกัน (เช่น แจ้งกรรมการสอบทุกคน)
   * ใช้ Notification.bulkCreate + loop emit per user room
   * เรียก isNotificationEnabled(type) ครั้งเดียว
   */
  async createAndNotifyMany(userIds, { type, title, message, metadata }) { }

  /** ดึง notifications ของ user (paginated, ล่าสุดก่อน) */
  async getNotifications(userId, { limit = 20, offset = 0 }) { }

  /** นับจำนวน unread */
  async getUnreadCount(userId) { }

  /** Mark single notification as read (ตรวจ ownership: notification.userId === userId) */
  async markAsRead(notificationId, userId) { }

  /** Mark all as read */
  async markAllAsRead(userId) { }
}
```

**สำคัญ:**
- `createAndNotify` ต้องเรียก `notificationSettingsService.isNotificationEnabled(type)` ก่อน — ถ้า admin disable type นั้น จะไม่สร้าง notification
- **io injection:** เรียก `notificationService.init(io)` ครั้งเดียวใน `server.js` หลัง `app.set('io', io)` ไม่ต้อง pass io ทุก call
- **Ownership check:** `markAsRead` ต้องตรวจว่า `notification.userId === userId` ก่อน update
- **Old file cleanup:** ลบ `agents/helpers/notificationService.js` (dead code ที่ ref model ที่ไม่มี)

---

## 3. Backend — API Endpoints

### File: `backend/routes/notificationRoutes.js` (ใหม่)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | authenticateToken | ดึง notification list (query: limit, offset) |
| GET | `/api/notifications/unread-count` | authenticateToken | นับ unread |
| PUT | `/api/notifications/:id/read` | authenticateToken | Mark as read |
| PUT | `/api/notifications/read-all` | authenticateToken | Mark all as read |

### Controller: `backend/controllers/notificationController.js` (ใหม่)

Thin controller → delegate to `notificationService`

**Response format:** ใช้ `{ success, data, message }` envelope ตาม convention ของ project

### Mount: เพิ่มใน `backend/app.js`

```javascript
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);
```

---

## 4. Backend — Event Integration Points

เพิ่ม `notificationService.createAndNotify()` ใน controller/service ที่มีอยู่:

### Phase 1 — Document approval/rejection (แก้ code ที่มี emit อยู่แล้ว)

| Event | File | Recipient | Type |
|---|---|---|---|
| CS05 rejected | `controllers/documents/cp05ApprovalController.js` (line ~229) | student | DOCUMENT |
| CS05 approved | `controllers/documents/cp05ApprovalController.js` | student | APPROVAL |
| Acceptance rejected | `controllers/documents/acceptanceApprovalController.js` (line ~296) | student | DOCUMENT |
| Acceptance approved | `controllers/documents/acceptanceApprovalController.js` | student | APPROVAL |

### Phase 2 — Document submission (นศ. ส่งเอกสาร → แจ้ง teacher)

| Event | File | Recipient | Type |
|---|---|---|---|
| นศ. submit เอกสาร | `services/documentService.js` | advisor/teacher | DOCUMENT |

### Phase 3 — Exam/Meeting scheduling

| Event | File | Recipient | Type |
|---|---|---|---|
| นัดสอบหัวข้อ/สอบป้องกัน | exam/defense controllers | student + กรรมการ | EVALUATION |
| นัดประชุม | meeting service | ผู้เข้าร่วม | MEETING |

---

## 5. Frontend — Socket.io Client

### File: `frontend-next/src/lib/socket.ts` (ใหม่)

```typescript
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;
  socket = io(process.env.NEXT_PUBLIC_API_URL || '', {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
```

**Dependency:** `socket.io-client` (ต้อง install ใน frontend-next)

---

## 6. Frontend — NotificationProvider

### File: `frontend-next/src/contexts/NotificationContext.tsx` (ใหม่)

```typescript
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  fetchNotifications: () => void;
}
```

**Provider nesting order:** `QueryClientProvider > AuthProvider > NotificationProvider`

**Behavior:**

- Wrap ใน `providers.tsx` ภายใน `AuthProvider` (ต้องรู้ token ก่อน)
- On mount (authenticated): connect socket + fetch initial unread count
- Listen `notification:new` → prepend to list + increment count
- On logout: disconnect socket, clear state
- **Reconnection:** ใช้ socket.io-client built-in reconnect (default) + re-fetch unread count เมื่อ reconnect สำเร็จ เพื่อดึง notification ที่พลาดระหว่าง disconnect
- ใช้ TanStack Query สำหรับ fetch notification list (cache + refetch)

---

## 7. Frontend — Bell Icon + Dropdown

### Component: `frontend-next/src/components/common/NotificationBell.tsx` (ใหม่)

**Position:** AppShell header ขวา ก่อนปุ่ม Logout

```
┌──────────────────────────────────────────────────┐
│  ภาคเรียน 1/2567              🔔(3)  [ออกจากระบบ]│
│                                 │                │
│                         ┌───────┴──────────┐     │
│                         │ การแจ้งเตือน [อ่านทั้งหมด]│
│                         ├──────────────────┤     │
│                         │ ● CS03 ได้รับการ   │     │
│                         │   อนุมัติ   2 นาที  │     │
│                         │──────────────────│     │
│                         │   นศ. ส่ง CS05     │     │
│                         │   รอตรวจ    1 ชม.  │     │
│                         │──────────────────│     │
│                         │ ● กำหนดสอบหัวข้อ   │     │
│                         │   วันที่ 20 มี.ค.   │     │
│                         └──────────────────┘     │
└──────────────────────────────────────────────────┘
```

**UI Details:**
- Ant Design: `Badge` + `BellOutlined` + `Popover`
- Dropdown max-height: ~400px, scrollable
- Unread items: highlight background (เช่น `var(--color-surface-1)`)
- แต่ละรายการ: icon ตาม type + title + relative time (ใช้ `dayjs().fromNow()`)
- คลิกรายการ → `markAsRead(id)` + navigate ไป `metadata.targetUrl` (ถ้ามี)
- ปุ่ม "อ่านทั้งหมด" ด้านบนขวาของ dropdown
- Empty state: "ไม่มีการแจ้งเตือน"

### Integration: แก้ `AppShell.tsx`

เพิ่ม `<NotificationBell />` ใน header area (flex row, ก่อน logout button)

---

## 8. Socket.io Events

| Event Name | Direction | Payload |
|---|---|---|
| `notification:new` | Server → Client | `{ notificationId, type, title, message, metadata, createdAt }` |

---

## 9. Files to Create/Modify

### New Files
| File | Purpose |
|---|---|
| `backend/migrations/XXXXXX-create-notifications.js` | สร้าง notifications table |
| `backend/models/Notification.js` | Sequelize model |
| `backend/services/notificationService.js` | Core notification logic |
| `backend/controllers/notificationController.js` | API handlers |
| `backend/routes/notificationRoutes.js` | Route definitions |
| `frontend-next/src/lib/socket.ts` | Socket.io client |
| `frontend-next/src/contexts/NotificationContext.tsx` | Notification state management |
| `frontend-next/src/components/common/NotificationBell.tsx` | Bell icon + dropdown UI |
| `frontend-next/src/lib/services/notificationService.ts` | Frontend API calls |
| `frontend-next/src/hooks/useNotifications.ts` | React Query hooks |

### Modified Files
| File | Change |
|---|---|
| `backend/app.js` | Mount notification routes |
| `backend/models/index.js` | Register Notification model associations |
| `backend/controllers/documents/cp05ApprovalController.js` | เพิ่ม createAndNotify calls |
| `backend/controllers/documents/acceptanceApprovalController.js` | เพิ่ม createAndNotify calls |
| `backend/services/documentService.js` | เพิ่ม createAndNotify เมื่อ submit |
| `frontend-next/src/components/layout/AppShell.tsx` | เพิ่ม NotificationBell |
| `frontend-next/src/app/providers.tsx` | เพิ่ม NotificationProvider |
| `frontend-next/package.json` | เพิ่ม socket.io-client dependency |

---

## 10. Verification

1. **Backend unit test:** สร้าง notification → ตรวจว่า record อยู่ใน DB
2. **API test:** GET /api/notifications, PUT mark-as-read → response ถูกต้อง
3. **Integration test:** Approve เอกสาร → ตรวจว่า notification ถูกสร้าง + socket emit
4. **Frontend manual test:**
   - Login → bell icon แสดง unread count
   - Approve เอกสาร → notification ปรากฏ real-time ใน dropdown
   - คลิกรายการ → mark as read, badge count ลด
   - "อ่านทั้งหมด" → clear all unread
   - Logout + login กลับ → notification เก่ายังอยู่ (persistent)
