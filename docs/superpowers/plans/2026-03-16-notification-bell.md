# Notification Bell Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent notification bell (🔔) to the AppShell header with dropdown popover, backed by a `notifications` DB table and real-time Socket.io delivery.

**Architecture:** Centralized `NotificationService` on backend — single `createAndNotify()` method that INSERTs to DB + emits via Socket.io. Frontend uses `NotificationContext` wrapping a `socket.io-client` connection to receive real-time events, with TanStack Query for initial data fetch. Bell icon uses Ant Design `Badge` + `Popover`.

**Tech Stack:** Sequelize migration + model, Express routes, Socket.io, React Context, TanStack Query, Ant Design, socket.io-client, dayjs

**Spec:** `docs/superpowers/specs/2026-03-16-notification-bell-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|---|---|
| `backend/migrations/XXXXXX-create-notifications.js` | DB migration — create `notifications` table |
| `backend/models/Notification.js` | Sequelize model with associations |
| `backend/services/notificationService.js` | Core logic: create, query, mark-read, emit |
| `backend/controllers/notificationController.js` | Thin HTTP handlers |
| `backend/routes/notificationRoutes.js` | Route definitions |
| `frontend-next/src/lib/socket.ts` | Socket.io client singleton |
| `frontend-next/src/lib/services/notificationService.ts` | API calls to `/api/notifications` |
| `frontend-next/src/hooks/useNotifications.ts` | TanStack Query hooks |
| `frontend-next/src/contexts/NotificationContext.tsx` | Socket.io + state management |
| `frontend-next/src/components/common/NotificationBell.tsx` | Bell icon + dropdown UI |
| `frontend-next/src/components/common/NotificationBell.module.css` | Styles |

### Modified Files

| File | Change |
|---|---|
| `backend/server.js` (~line 232) | Add `notificationService.init(io)` |
| `backend/app.js` (~line 109) | Mount notification routes |
| `backend/controllers/documents/cp05ApprovalController.js` (~line 225) | Replace emit with `notificationService` |
| `backend/controllers/documents/acceptanceApprovalController.js` (~line 292) | Replace emit with `notificationService` |
| `frontend-next/src/app/providers.tsx` | Add `NotificationProvider` |
| `frontend-next/src/components/layout/AppShell.tsx` (~line 162) | Add `<NotificationBell />` |
| `frontend-next/package.json` | Add `socket.io-client` |

---

## Chunk 1: Backend — Database & Model

### Task 1: Create migration

**Files:**
- Create: `backend/migrations/XXXXXXXX-create-notifications.js`

- [ ] **Step 1: Generate migration file**

```bash
cd cslogbook/backend && npx sequelize-cli migration:generate --name create-notifications
```

- [ ] **Step 2: Write migration**

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      notification_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'user_id' },
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('DOCUMENT', 'APPROVAL', 'LOGBOOK', 'EVALUATION', 'MEETING'),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      message: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('notifications', ['user_id', 'is_read'], {
      name: 'idx_notif_user_read'
    });
    await queryInterface.addIndex('notifications', ['user_id', 'created_at'], {
      name: 'idx_notif_user_created'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  }
};
```

- [ ] **Step 3: Run migration**

```bash
cd cslogbook/backend && npm run migrate
```

Expected: Table `notifications` created successfully.

- [ ] **Step 4: Commit**

```bash
git add backend/migrations/*create-notifications*
git commit -m "feat(notification): add notifications table migration"
```

---

### Task 2: Create Notification model

**Files:**
- Create: `backend/models/Notification.js`

- [ ] **Step 1: Create model file**

Follow pattern from `models/NotificationSetting.js`. Model auto-loads via `models/index.js` glob.

```javascript
'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, {
        foreignKey: 'userId',
        targetKey: 'userId',
        as: 'user',
        constraints: false
      });
    }
  }

  Notification.init({
    notificationId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'notification_id'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    type: {
      type: DataTypes.ENUM('DOCUMENT', 'APPROVAL', 'LOGBOOK', 'EVALUATION', 'MEETING'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    message: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_read'
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      { name: 'idx_notif_user_read', fields: ['user_id', 'is_read'] },
      { name: 'idx_notif_user_created', fields: ['user_id', 'created_at'] }
    ]
  });

  return Notification;
};
```

- [ ] **Step 2: Verify model loads**

```bash
cd cslogbook/backend && node -e "const db = require('./models'); console.log('Notification' in db ? 'OK' : 'MISSING')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/models/Notification.js
git commit -m "feat(notification): add Notification sequelize model"
```

---

## Chunk 2: Backend — NotificationService & API

### Task 3: Create NotificationService

**Files:**
- Create: `backend/services/notificationService.js`

- [ ] **Step 1: Create service**

```javascript
'use strict';

const { Notification } = require('../models');
const notificationSettingsService = require('./notificationSettingsService');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.io = null;
  }

  /**
   * เรียกครั้งเดียวใน server.js หลัง app.set('io', io)
   */
  init(io) {
    this.io = io;
    logger.info('NotificationService initialized with Socket.io');
  }

  /**
   * สร้าง notification + emit real-time
   * ตรวจ NotificationSetting ก่อนสร้าง
   */
  async createAndNotify(userId, { type, title, message, metadata }) {
    try {
      // ตรวจว่า notification type นี้ enable อยู่ไหม
      const isEnabled = await notificationSettingsService.isNotificationEnabled(type);
      if (!isEnabled) {
        return null;
      }

      const notification = await Notification.create({
        userId,
        type,
        title,
        message: message || null,
        metadata: metadata || null,
        isRead: false
      });

      // Emit real-time via Socket.io
      if (this.io) {
        this.io.to(`user_${userId}`).emit('notification:new', {
          notificationId: notification.notificationId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          metadata: notification.metadata,
          isRead: false,
          createdAt: notification.createdAt
        });
      }

      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', {
        userId, type, title, error: error.message
      });
      return null; // ไม่ throw — notification failure ไม่ควร block main flow
    }
  }

  /**
   * สร้าง notification ให้หลาย user (bulkCreate + emit per room)
   */
  async createAndNotifyMany(userIds, { type, title, message, metadata }) {
    try {
      const isEnabled = await notificationSettingsService.isNotificationEnabled(type);
      if (!isEnabled) return [];

      const uniqueIds = [...new Set(userIds)];
      const records = uniqueIds.map(userId => ({
        userId,
        type,
        title,
        message: message || null,
        metadata: metadata || null,
        isRead: false
      }));

      const notifications = await Notification.bulkCreate(records);

      // Emit to each user room
      if (this.io) {
        notifications.forEach(n => {
          this.io.to(`user_${n.userId}`).emit('notification:new', {
            notificationId: n.notificationId,
            type: n.type,
            title: n.title,
            message: n.message,
            metadata: n.metadata,
            isRead: false,
            createdAt: n.created_at
          });
        });
      }

      return notifications;
    } catch (error) {
      logger.error('Failed to bulk create notifications:', { error: error.message });
      return [];
    }
  }

  /**
   * ดึง notifications ของ user (paginated, ล่าสุดก่อน)
   */
  async getNotifications(userId, { limit = 20, offset = 0 } = {}) {
    const { count, rows } = await Notification.findAndCountAll({
      where: { userId },
      order: [['created_at', 'DESC']],
      limit: Math.min(limit, 50),
      offset
    });

    return {
      notifications: rows,
      total: count,
      limit,
      offset
    };
  }

  /**
   * นับจำนวน unread
   */
  async getUnreadCount(userId) {
    return Notification.count({
      where: { userId, isRead: false }
    });
  }

  /**
   * Mark single notification as read (ตรวจ ownership)
   */
  async markAsRead(notificationId, userId) {
    const [updated] = await Notification.update(
      { isRead: true },
      { where: { notificationId, userId } }
    );
    return updated > 0;
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId) {
    const [updated] = await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );
    return updated;
  }
}

module.exports = new NotificationService();
```

- [ ] **Step 2: Commit**

```bash
git add backend/services/notificationService.js
git commit -m "feat(notification): add centralized NotificationService"
```

---

### Task 4: Init NotificationService in server.js

**Files:**
- Modify: `backend/server.js` (~line 232, after `app.set('io', io)`)

- [ ] **Step 1: Add init call after `app.set('io', io)`**

After line `app.set('io', io);` (line 231), add:

```javascript
// Initialize notification service with Socket.io
const notificationService = require('./services/notificationService');
notificationService.init(io);
```

- [ ] **Step 2: Commit**

```bash
git add backend/server.js
git commit -m "feat(notification): init NotificationService with Socket.io in server.js"
```

---

### Task 5: Create notification controller & routes

**Files:**
- Create: `backend/controllers/notificationController.js`
- Create: `backend/routes/notificationRoutes.js`
- Modify: `backend/app.js` (~line 109)

- [ ] **Step 1: Create controller**

```javascript
'use strict';

const notificationService = require('../services/notificationService');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await notificationService.getNotifications(userId, { limit, offset });

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลการแจ้งเตือนได้'
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await notificationService.getUnreadCount(userId);

    return res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถนับการแจ้งเตือนได้'
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = parseInt(req.params.id);

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'notification ID ไม่ถูกต้อง'
      });
    }

    const updated = await notificationService.markAsRead(notificationId, userId);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการแจ้งเตือน'
      });
    }

    return res.json({
      success: true,
      message: 'อ่านแจ้งเตือนแล้ว'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถอัปเดตการแจ้งเตือนได้'
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await notificationService.markAllAsRead(userId);

    return res.json({
      success: true,
      message: `อ่านแจ้งเตือนทั้งหมด ${count} รายการ`,
      data: { updatedCount: count }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถอัปเดตการแจ้งเตือนได้'
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
```

- [ ] **Step 2: Create routes**

```javascript
'use strict';

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;
```

- [ ] **Step 3: Mount routes in app.js**

In `backend/app.js`, add after the existing route mounts (~line 109, before workflow routes):

```javascript
const notificationRoutes = require('./routes/notificationRoutes');
```
(add to the require block at top)

```javascript
app.use('/api/notifications', authenticateToken, notificationRoutes);
```
(add to the route mount section)

- [ ] **Step 4: Test API manually**

```bash
cd cslogbook/backend && npm run dev
```

Test with curl or Postman:
- `GET /api/notifications` → `{ success: true, data: { notifications: [], total: 0 } }`
- `GET /api/notifications/unread-count` → `{ success: true, data: { unreadCount: 0 } }`

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/notificationController.js backend/routes/notificationRoutes.js backend/app.js
git commit -m "feat(notification): add notification API endpoints"
```

---

## Chunk 3: Backend — Event Integration

### Task 6: Replace existing socket emits with NotificationService

**Files:**
- Modify: `backend/controllers/documents/cp05ApprovalController.js` (~line 225-239)
- Modify: `backend/controllers/documents/acceptanceApprovalController.js` (~line 292-306)

- [ ] **Step 1: Update cp05ApprovalController — rejection**

Find the existing `document:rejected` emit block (~line 225-239) and replace with:

```javascript
// แจ้งเตือน notification
try {
  const notificationService = require('../../services/notificationService');
  await notificationService.createAndNotify(doc.userId, {
    type: 'DOCUMENT',
    title: 'คำร้อง CS05 ถูกปฏิเสธ',
    message: reason || 'กรุณาตรวจสอบและแก้ไข',
    metadata: {
      documentId: doc.documentId,
      documentName: 'CS05',
      action: 'rejected',
      targetUrl: '/project/documents'
    }
  });
} catch (notifyErr) {
  logger.warn('Notification failed (CS05 reject):', notifyErr.message);
}
```

- [ ] **Step 2: Add CS05 approval notification**

Find the approval success response in the same controller and add before `return res.json(...)`:

```javascript
// แจ้งเตือน notification
try {
  const notificationService = require('../../services/notificationService');
  await notificationService.createAndNotify(doc.userId, {
    type: 'APPROVAL',
    title: 'คำร้อง CS05 ได้รับการอนุมัติ',
    message: null,
    metadata: {
      documentId: doc.documentId,
      documentName: 'CS05',
      action: 'approved',
      targetUrl: '/project/documents'
    }
  });
} catch (notifyErr) {
  logger.warn('Notification failed (CS05 approve):', notifyErr.message);
}
```

- [ ] **Step 3: Update acceptanceApprovalController — rejection + approval**

Same pattern as CP05. Find the existing emit block (~line 292-306) and replace. Also add approval notification.

Use `documentName: 'ACCEPTANCE'` and `targetUrl: '/internship/documents'`.

- [ ] **Step 4: Verify both controllers work**

```bash
cd cslogbook/backend && npm run dev
```

No errors on startup. Existing approval/rejection flows still work.

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/documents/cp05ApprovalController.js backend/controllers/documents/acceptanceApprovalController.js
git commit -m "feat(notification): integrate NotificationService in document approval controllers"
```

---

### Task 7: Delete dead code `agents/helpers/notificationService.js`

**Files:**
- Delete: `backend/agents/helpers/notificationService.js`

- [ ] **Step 1: Verify no active imports**

Search for imports of this file. It's dead code (refs non-existent Notification model). Confirm no other file actively imports it.

```bash
cd cslogbook/backend && grep -r "agents/helpers/notificationService" --include="*.js" .
```

If only self-references or unused requires, safe to delete.

- [ ] **Step 2: Delete file**

```bash
rm cslogbook/backend/agents/helpers/notificationService.js
```

- [ ] **Step 3: Fix any broken imports**

If any file imports it, update to use `../../services/notificationService` instead.

- [ ] **Step 4: Commit**

```bash
git add -u backend/agents/helpers/notificationService.js
git commit -m "chore: remove dead code agents/helpers/notificationService.js"
```

---

### Task 7.5: Enable notification types in settings

**Prerequisite:** `notification_settings` table มี default `is_enabled = false` สำหรับทุก type. ต้อง enable ก่อนจึงจะสร้าง notification ได้.

- [ ] **Step 1: Enable via admin UI หรือ direct SQL**

Option A (Admin UI): Login as admin → Settings → Notification Settings → Enable DOCUMENT, APPROVAL, EVALUATION, MEETING

Option B (Direct SQL):

```sql
UPDATE notification_settings SET is_enabled = true WHERE notification_type IN ('DOCUMENT', 'APPROVAL', 'EVALUATION', 'MEETING');
```

- [ ] **Step 2: Verify settings are enabled**

```bash
curl -H "Authorization: Bearer <admin_token>" http://localhost:5000/api/admin/notification-settings
```

Expected: DOCUMENT, APPROVAL, EVALUATION, MEETING should all show `enabled: true`

---

## Chunk 4: Frontend — Socket.io & Services

### Task 8: Install socket.io-client

**Files:**
- Modify: `frontend-next/package.json`

- [ ] **Step 1: Install dependency**

```bash
cd cslogbook/frontend-next && npm install socket.io-client
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/package.json frontend-next/package-lock.json
git commit -m "feat(notification): add socket.io-client dependency"
```

---

### Task 9: Create Socket.io client singleton

**Files:**
- Create: `frontend-next/src/lib/socket.ts`

- [ ] **Step 1: Create socket utility**

```typescript
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  // Disconnect old socket if exists
  if (socket) {
    socket.disconnect();
  }

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/lib/socket.ts
git commit -m "feat(notification): add Socket.io client singleton"
```

---

### Task 10: Create notification API service

**Files:**
- Create: `frontend-next/src/lib/services/notificationService.ts`

- [ ] **Step 1: Create service**

Follow pattern from `documentService.ts` — use `apiFetch`.

```typescript
import { apiFetch } from '@/lib/api/client';

export interface NotificationItem {
  notificationId: number;
  type: 'DOCUMENT' | 'APPROVAL' | 'LOGBOOK' | 'EVALUATION' | 'MEETING';
  title: string;
  message: string | null;
  metadata: {
    documentId?: number;
    documentName?: string;
    action?: string;
    targetUrl?: string;
    [key: string]: unknown;
  } | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: NotificationItem[];
    total: number;
    limit: number;
    offset: number;
  };
}

interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

export async function getNotifications(
  token: string,
  params?: { limit?: number; offset?: number }
) {
  const search = new URLSearchParams();
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.offset) search.set('offset', String(params.offset));
  const query = search.toString();
  const path = `/notifications${query ? `?${query}` : ''}`;
  return apiFetch<NotificationsResponse>(path, { method: 'GET', token });
}

export async function getUnreadCount(token: string) {
  return apiFetch<UnreadCountResponse>('/notifications/unread-count', {
    method: 'GET',
    token,
  });
}

export async function markNotificationAsRead(token: string, id: number) {
  return apiFetch<{ success: boolean }>(`/notifications/${id}/read`, {
    method: 'PUT',
    token,
  });
}

export async function markAllNotificationsAsRead(token: string) {
  return apiFetch<{ success: boolean }>('/notifications/read-all', {
    method: 'PUT',
    token,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/lib/services/notificationService.ts
git commit -m "feat(notification): add frontend notification API service"
```

---

### Task 11: Create React Query hooks

**Files:**
- Create: `frontend-next/src/hooks/useNotifications.ts`

- [ ] **Step 1: Create hooks**

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/services/notificationService';

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: (token: string) => [...NOTIFICATION_KEYS.all, 'list', token] as const,
  unreadCount: (token: string) => [...NOTIFICATION_KEYS.all, 'unread-count', token] as const,
};

export function useNotificationList(token: string | null, limit = 20) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(token ?? ''),
    queryFn: () => getNotifications(token!, { limit }),
    enabled: Boolean(token),
    retry: 1,
  });
}

export function useUnreadCount(token: string | null) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(token ?? ''),
    queryFn: () => getUnreadCount(token!),
    enabled: Boolean(token),
    retry: 1,
    refetchInterval: 1000 * 60, // fallback polling ทุก 1 นาที (หลักคือ socket)
  });
}

export function useMarkAsRead(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => markNotificationAsRead(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

export function useMarkAllAsRead(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/hooks/useNotifications.ts
git commit -m "feat(notification): add React Query hooks for notifications"
```

---

## Chunk 5: Frontend — NotificationContext & Bell UI

### Task 12: Create NotificationContext

**Files:**
- Create: `frontend-next/src/contexts/NotificationContext.tsx`
- Modify: `frontend-next/src/app/providers.tsx`

- [ ] **Step 1: Create context**

Follow pattern from `AuthContext.tsx`.

```typescript
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { NOTIFICATION_KEYS } from '@/hooks/useNotifications';

/**
 * NotificationContext จัดการ Socket.io connection เท่านั้น
 * ใช้ React Query เป็น single source of truth สำหรับ notification data + unread count
 * เมื่อ socket ได้รับ notification:new → invalidate queries → React Query refetch อัตโนมัติ
 */
interface NotificationContextType {
  /** Socket connected? */
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const socketInitialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectSocket();
      socketInitialized.current = false;
      return;
    }

    if (socketInitialized.current) return;
    socketInitialized.current = true;

    const socket = connectSocket(token);

    // เมื่อได้รับ notification ใหม่ → invalidate React Query cache
    // React Query จะ refetch notification list + unread count อัตโนมัติ
    socket.on('notification:new', () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    });

    // Re-fetch เมื่อ reconnect (กรณีพลาด notification ระหว่าง disconnect)
    socket.on('connect', () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    });

    return () => {
      socket.off('notification:new');
      socket.off('connect');
      disconnectSocket();
      socketInitialized.current = false;
    };
  }, [isAuthenticated, token, queryClient]);

  return (
    <NotificationContext.Provider value={{ isConnected: socketInitialized.current }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}
```

- [ ] **Step 2: Add NotificationProvider to providers.tsx**

In `frontend-next/src/app/providers.tsx`, add import and wrap:

```typescript
import { NotificationProvider } from '@/contexts/NotificationContext';
```

Change the return to:

```tsx
return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);
```

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/contexts/NotificationContext.tsx frontend-next/src/app/providers.tsx
git commit -m "feat(notification): add NotificationContext with Socket.io integration"
```

---

### Task 13: Create NotificationBell component

**Files:**
- Create: `frontend-next/src/components/common/NotificationBell.tsx`
- Create: `frontend-next/src/components/common/NotificationBell.module.css`

- [ ] **Step 1: Create CSS module**

```css
.bellWrapper {
  position: relative;
  cursor: pointer;
}

.bellButton {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: var(--color-text, #333);
  padding: 4px 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: background 0.2s;
}

.bellButton:hover {
  background: var(--color-surface-2, #f0f0f0);
}

.dropdown {
  width: 360px;
  max-height: 440px;
  display: flex;
  flex-direction: column;
}

.dropdownHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border, #e8e8e8);
}

.dropdownTitle {
  font-weight: 600;
  font-size: 15px;
  margin: 0;
}

.readAllButton {
  background: none;
  border: none;
  color: var(--color-primary, #1677ff);
  cursor: pointer;
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 4px;
}

.readAllButton:hover {
  background: var(--color-surface-1, #f5f5f5);
}

.notificationList {
  overflow-y: auto;
  max-height: 380px;
  flex: 1;
}

.notificationItem {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border, #f0f0f0);
  cursor: pointer;
  transition: background 0.15s;
}

.notificationItem:hover {
  background: var(--color-surface-1, #fafafa);
}

.unread {
  background: var(--color-surface-1, #f0f7ff);
}

.unread:hover {
  background: #e6f0fa;
}

.notificationIcon {
  font-size: 18px;
  margin-top: 2px;
  flex-shrink: 0;
}

.notificationContent {
  flex: 1;
  min-width: 0;
}

.notificationTitle {
  font-size: 14px;
  line-height: 1.4;
  margin: 0;
  color: var(--color-text, #333);
}

.notificationTime {
  font-size: 12px;
  color: var(--color-text-secondary, #999);
  margin-top: 2px;
}

.emptyState {
  padding: 40px 16px;
  text-align: center;
  color: var(--color-text-secondary, #999);
  font-size: 14px;
}

.unreadDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary, #1677ff);
  flex-shrink: 0;
  margin-top: 6px;
}

.readDot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  margin-top: 6px;
}
```

- [ ] **Step 2: Create component**

```tsx
'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Popover } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';
import { useAuth } from '@/contexts/AuthContext';
import {
  useNotificationList,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/useNotifications';
import type { NotificationItem } from '@/lib/services/notificationService';
import styles from './NotificationBell.module.css';

dayjs.extend(relativeTime);
dayjs.locale('th');

const TYPE_ICONS: Record<string, string> = {
  DOCUMENT: '📄',
  APPROVAL: '✅',
  LOGBOOK: '📝',
  EVALUATION: '📋',
  MEETING: '🤝',
};

export default function NotificationBell() {
  const router = useRouter();
  const { token } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: listData, isLoading } = useNotificationList(token, 20);
  const { data: countData } = useUnreadCount(token);
  const markAsRead = useMarkAsRead(token);
  const markAllAsRead = useMarkAllAsRead(token);

  // React Query เป็น single source of truth สำหรับ unread count
  const unreadCount = countData?.data?.unreadCount ?? 0;
  const notifications: NotificationItem[] = listData?.data?.notifications || [];

  const handleItemClick = useCallback(
    (item: NotificationItem) => {
      if (!item.isRead) {
        markAsRead.mutate(item.notificationId);
      }
      if (item.metadata?.targetUrl) {
        setOpen(false);
        router.push(item.metadata.targetUrl);
      }
    },
    [markAsRead, router]
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead.mutate();
  }, [markAllAsRead]);

  const dropdownContent = (
    <div className={styles.dropdown}>
      <div className={styles.dropdownHeader}>
        <h4 className={styles.dropdownTitle}>การแจ้งเตือน</h4>
        {unreadCount > 0 && (
          <button
            type="button"
            className={styles.readAllButton}
            onClick={handleMarkAllAsRead}
          >
            อ่านทั้งหมด
          </button>
        )}
      </div>
      <div className={styles.notificationList}>
        {isLoading ? (
          <div className={styles.emptyState}>กำลังโหลด...</div>
        ) : notifications.length === 0 ? (
          <div className={styles.emptyState}>ไม่มีการแจ้งเตือน</div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.notificationId}
              className={`${styles.notificationItem} ${!item.isRead ? styles.unread : ''}`}
              onClick={() => handleItemClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleItemClick(item);
              }}
            >
              <span className={!item.isRead ? styles.unreadDot : styles.readDot} />
              <span className={styles.notificationIcon}>
                {TYPE_ICONS[item.type] || '🔔'}
              </span>
              <div className={styles.notificationContent}>
                <p className={styles.notificationTitle}>{item.title}</p>
                <span className={styles.notificationTime}>
                  {dayjs(item.createdAt).fromNow()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={dropdownContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      arrow={false}
      overlayInnerStyle={{ padding: 0 }}
    >
      <button type="button" className={styles.bellButton}>
        <Badge count={unreadCount} size="small" offset={[2, -2]}>
          <BellOutlined style={{ fontSize: 20 }} />
        </Badge>
      </button>
    </Popover>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/components/common/NotificationBell.tsx frontend-next/src/components/common/NotificationBell.module.css
git commit -m "feat(notification): add NotificationBell component with dropdown popover"
```

---

### Task 14: Integrate bell into AppShell

**Files:**
- Modify: `frontend-next/src/components/layout/AppShell.tsx` (~line 162)

- [ ] **Step 1: Add NotificationBell to header**

Add import at top of AppShell.tsx:

```typescript
import NotificationBell from '@/components/common/NotificationBell';
```

In the header area, before the logout button (~line 162), add a wrapper div for right-side items:

Change the header section so the right side has both bell and logout:

```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
  <NotificationBell />
  <button type="button" className={styles.logoutLink} onClick={handleLogout}>
    ออกจากระบบ
  </button>
</div>
```

- [ ] **Step 2: Verify UI**

```bash
cd cslogbook/frontend-next && npm run dev
```

Open browser → login → verify bell icon appears in header with badge count.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/components/layout/AppShell.tsx
git commit -m "feat(notification): integrate NotificationBell into AppShell header"
```

---

## Chunk 6: End-to-End Verification

### Task 15: Full E2E test

- [ ] **Step 1: Start backend**

```bash
cd cslogbook/backend && npm run dev
```

- [ ] **Step 2: Start frontend**

```bash
cd cslogbook/frontend-next && npm run dev
```

- [ ] **Step 3: Manual E2E verification checklist**

1. **Login as student** → bell icon visible in header, badge shows 0
2. **Login as teacher/admin in another browser** → approve/reject a student document
3. **Student browser** → notification appears real-time in dropdown (without refresh)
4. **Click notification** → mark as read (highlight removed) + navigate to target page
5. **Click "อ่านทั้งหมด"** → all notifications marked read, badge goes to 0
6. **Logout + login again** → old notifications still visible (persistent from DB)
7. **Admin disable DOCUMENT notification type** → new document events don't create notifications

- [ ] **Step 4: Check for errors**

- No console errors in frontend
- No errors in `backend/logs/error.log`
- Socket.io connection established (check browser DevTools Network → WS tab)

- [ ] **Step 5: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(notification): address E2E test issues"
```
