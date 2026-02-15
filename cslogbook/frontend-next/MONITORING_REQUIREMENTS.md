# CSLogbook Monitoring Dashboard Requirements

**Last Updated**: 2026-02-15
**Purpose**: System monitoring and observability after production deployment
**Target Users**: DevOps, System Admins, Product Managers

---

## 🎯 Overview

หน้า Monitor Dashboard จะช่วยให้ทีมสามารถ:
1. ติดตามสุขภาพของระบบแบบ real-time
2. ตรวจสอบความคืบหน้าของการ migrate จาก legacy
3. วิเคราะห์พฤติกรรมผู้ใช้
4. จับปัญหาได้เร็วก่อนที่ผู้ใช้รายงาน
5. ตัดสินใจเรื่อง feature rollout based on data

---

## 📊 Core Monitoring Sections

### 1. System Health Overview (Critical)

**Purpose**: ดูสถานะระบบโดยรวมในภาพเดียว

**Metrics**:
```typescript
interface SystemHealthMetrics {
  // Server Status
  serverStatus: 'healthy' | 'degraded' | 'down';
  uptime: number; // seconds
  lastRestart: Date;

  // Performance
  avgResponseTime: number; // ms
  p95ResponseTime: number; // ms
  p99ResponseTime: number; // ms

  // Traffic
  requestsPerMinute: number;
  activeUsers: number;
  concurrentConnections: number;

  // Errors
  errorRate: number; // percentage
  totalErrors24h: number;
  criticalErrors: number;

  // Resources
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  diskUsage: number; // percentage
  databaseConnections: number;
}
```

**Visualizations**:
- 🟢 Status badge (Healthy/Degraded/Down)
- 📈 Real-time line chart (last 24h response times)
- 🔢 Key metrics cards with trend indicators (↑↓)
- 🚨 Alert banner for critical issues

**Example UI**:
```
┌─────────────────────────────────────────────┐
│ System Status: 🟢 Healthy                   │
│ Uptime: 30d 12h 45m                         │
├─────────────────────────────────────────────┤
│ Response Time    Requests/min    Error Rate │
│ 45ms (↓ 5%)     1,234 (↑ 12%)   0.02% (↓)  │
├─────────────────────────────────────────────┤
│ [Response Time Chart - Last 24h]            │
│     ^                                        │
│ 100ms|    *                                 │
│  50ms|  * * *  *                            │
│  25ms|* * * ** * *****                      │
│     +────────────────────────>              │
│       6am    12pm    6pm    12am            │
└─────────────────────────────────────────────┘
```

**API Endpoint**: `GET /api/monitoring/system-health`

---

### 2. Frontend-Next Migration Dashboard

**Purpose**: ติดตามความคืบหน้าการ migrate และการใช้งาน features ใหม่

**Metrics**:
```typescript
interface MigrationMetrics {
  // Feature Flag Status
  featureFlags: {
    name: string;
    enabled: boolean;
    enabledSince: Date | null;
    usageCount: number;
    errorCount: number;
  }[];

  // Page Usage (New vs Legacy)
  pageComparison: {
    route: string;
    legacyPageViews: number;
    nextPageViews: number;
    migrationPercentage: number; // % using new version
    avgLoadTime: number;
    errorRate: number;
  }[];

  // Overall Migration Progress
  totalPages: number;
  migratedPages: number;
  enabledPages: number;
  completionPercentage: number;

  // User Adoption
  totalUsers: number;
  usersOnNewPages: number;
  usersOnLegacyPages: number;
  adoptionRate: number; // percentage
}
```

**Visualizations**:
- 📊 Progress bar (Overall migration completion)
- 📈 Adoption trend chart (Daily active users on new vs legacy)
- 🎛️ Feature flag toggle status table
- 🔄 Page-by-page comparison table
- 🏆 Top migrated pages by usage

**Example UI**:
```
┌─────────────────────────────────────────────┐
│ Migration Progress                          │
│ ████████████████░░░░ 78% Complete           │
│ 41/52 pages migrated | 38/41 enabled        │
├─────────────────────────────────────────────┤
│ User Adoption                               │
│ Frontend-Next: 1,234 users (67%)            │
│ Legacy:          608 users (33%)            │
│                                             │
│ [Adoption Trend - Last 30 Days]             │
│     ^                                       │
│ 100%|                              /****    │
│  50%|                      /******/         │
│   0%|/****************                     │
│     +────────────────────────────>         │
│        Day 1   Day 15   Day 30             │
├─────────────────────────────────────────────┤
│ Feature Flags Status                        │
│ ✅ INTERNSHIP_LOGBOOK      1,234 uses       │
│ ✅ INTERNSHIP_CERTIFICATE    567 uses       │
│ ✅ PROJECT_PHASE2            890 uses       │
│ ❌ MEETINGS_PAGE             (disabled)     │
└─────────────────────────────────────────────┘
```

**API Endpoints**:
- `GET /api/monitoring/migration-status`
- `GET /api/monitoring/feature-flags`
- `GET /api/monitoring/page-usage-comparison`

---

### 3. User Activity Monitor

**Purpose**: เข้าใจพฤติกรรมผู้ใช้และการใช้งานระบบ

**Metrics**:
```typescript
interface UserActivityMetrics {
  // Real-time Activity
  currentActiveUsers: number;
  activeByRole: {
    student: number;
    teacher: number;
    admin: number;
    guest: number;
  };

  // Session Statistics
  avgSessionDuration: number; // minutes
  totalSessions24h: number;
  bounceRate: number; // percentage

  // Popular Pages (Last 24h)
  topPages: {
    path: string;
    pageViews: number;
    uniqueVisitors: number;
    avgTimeOnPage: number;
    exitRate: number;
  }[];

  // User Actions (Last 24h)
  topActions: {
    action: string; // e.g., "submit_cs05", "approve_document"
    count: number;
    successRate: number;
    avgDuration: number;
  }[];

  // Geographic Distribution (for future)
  usersByLocation?: {
    region: string;
    count: number;
  }[];
}
```

**Visualizations**:
- 🔴 Real-time active users counter
- 👥 Users by role pie chart
- 📋 Top pages table with metrics
- 🎬 User actions frequency bar chart
- 🕐 Session duration histogram

**Example UI**:
```
┌─────────────────────────────────────────────┐
│ Active Users Now: 1,847 👥                  │
│ Students: 1,234 | Teachers: 456 | Admin: 23│
├─────────────────────────────────────────────┤
│ Top Pages (Last 24h)                        │
│ 1. /dashboard/student        5,678 views    │
│ 2. /project/phase1           3,456 views    │
│ 3. /internship-registration  2,345 views    │
│ 4. /internship/logbook       1,890 views    │
│ 5. /admin/documents          1,234 views    │
├─────────────────────────────────────────────┤
│ Top Actions (Last 24h)                      │
│ submit_cs05:        123 (95% success)       │
│ create_logbook:     456 (98% success)       │
│ approve_document:    89 (100% success)      │
│ record_exam_result:  34 (97% success)       │
└─────────────────────────────────────────────┘
```

**API Endpoints**:
- `GET /api/monitoring/user-activity`
- `GET /api/monitoring/top-pages`
- `GET /api/monitoring/user-actions`

---

### 4. Business Metrics Dashboard

**Purpose**: ติดตามตัวเลขทางธุรกิจและ workflow ของระบบ

**Metrics**:
```typescript
interface BusinessMetrics {
  // Document Submissions (Current Semester)
  internshipDocuments: {
    pending: number;
    reviewing: number;
    approved: number;
    rejected: number;
    total: number;
  };

  projectDocuments: {
    topicExamPending: number;
    kp02QueueLength: number;
    systemTestPending: number;
    thesisPending: number;
  };

  // Processing Efficiency
  avgApprovalTime: {
    internshipCS05: number; // hours
    internshipCertificate: number;
    projectTopicExam: number;
    projectDefense: number;
  };

  // Deadline Compliance
  lateSubmissions: {
    total: number;
    byType: {
      internship: number;
      project: number;
    };
    percentage: number;
  };

  // Queue Health
  longestWaitingDocument: {
    type: string;
    waitingDays: number;
    studentName: string;
  };

  // Student Progress
  students: {
    total: number;
    eligibleInternship: number;
    eligibleProject: number;
    activeInternships: number;
    activeProjects: number;
  };
}
```

**Visualizations**:
- 📊 Document status bar charts
- ⏱️ Average processing time line charts (trend over time)
- 🚨 Late submissions alert cards
- 📈 Student progression funnel
- ⚠️ Queue alerts (documents waiting > 7 days)

**Example UI**:
```
┌─────────────────────────────────────────────┐
│ Document Queues (Current Semester)          │
│                                             │
│ Internship CS05:    45 pending              │
│ │████████░░ 12/45 reviewed today            │
│                                             │
│ Project KP02 Queue: 23 pending              │
│ │████░░░░░░  5/23 verified today            │
│                                             │
│ System Test:        8 pending               │
│ Thesis Defense:    15 pending               │
├─────────────────────────────────────────────┤
│ ⚠️ Alerts                                   │
│ • 3 documents waiting > 7 days              │
│ • 12 late submissions today                 │
├─────────────────────────────────────────────┤
│ Avg. Processing Time (Last 7 Days)          │
│ Internship CS05:     2.3 hours (↓ 0.5h)    │
│ Certificate:         4.5 hours (↑ 1.2h)    │
│ Project Topic Exam:  1.8 days  (↓ 0.3d)    │
│ Defense Approval:    3.2 days  (→ same)    │
└─────────────────────────────────────────────┘
```

**API Endpoints**:
- `GET /api/monitoring/business-metrics`
- `GET /api/monitoring/queue-health`
- `GET /api/monitoring/processing-times`

---

### 5. Error & Exception Tracking

**Purpose**: ตรวจจับและวิเคราะห์ errors ให้แก้ไขได้รวดเร็ว

**Metrics**:
```typescript
interface ErrorMetrics {
  // Error Summary
  total24h: number;
  criticalErrors: number;
  warnings: number;
  resolved: number;

  // Error Categories
  byType: {
    frontend: number; // JavaScript errors
    backend: number;  // API errors
    database: number;
    network: number;
  };

  // Top Errors
  topErrors: {
    message: string;
    count: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    affectedUsers: number;
    firstSeen: Date;
    lastSeen: Date;
    status: 'new' | 'investigating' | 'resolved';
    stackTrace?: string;
  }[];

  // Failed Requests
  failedApiRequests: {
    endpoint: string;
    method: string;
    statusCode: number;
    count: number;
    errorRate: number; // percentage
  }[];

  // Frontend Performance Issues
  slowPages: {
    route: string;
    avgLoadTime: number;
    p95LoadTime: number;
    affectedUsers: number;
  }[];
}
```

**Visualizations**:
- 🚨 Error count trend chart (24h/7d/30d)
- 📊 Error breakdown pie chart (by type)
- 📋 Top errors table (sortable by count, severity)
- 🔴 Critical errors alert banner
- 🔍 Error detail drawer (stack trace, affected users)

**Example UI**:
```
┌─────────────────────────────────────────────┐
│ 🚨 Critical Errors: 3 (Last 24h)            │
│ Total Errors: 156 (↓ 23% vs yesterday)     │
├─────────────────────────────────────────────┤
│ Error Breakdown                             │
│ Frontend:    89 (57%)  │██████░░░░          │
│ Backend:     45 (29%)  │████░░░░░░          │
│ Database:    12 (8%)   │█░░░░░░░░░          │
│ Network:     10 (6%)   │█░░░░░░░░░          │
├─────────────────────────────────────────────┤
│ Top Errors (Last 24h)                       │
│ 1. [CRITICAL] Database timeout              │
│    45 occurrences | 12 affected users       │
│    /api/projects/mine endpoint              │
│    First seen: 2h ago | Status: Investigating
│                                             │
│ 2. [HIGH] JWT token expired                 │
│    23 occurrences | 23 affected users       │
│    AuthGuard component                      │
│    First seen: 5h ago | Status: Resolved    │
│                                             │
│ 3. [MEDIUM] Hydration mismatch              │
│    18 occurrences | 8 affected users        │
│    StudentEligibilityWidget                 │
│    First seen: 1d ago | Status: New         │
├─────────────────────────────────────────────┤
│ Failed API Requests (Error Rate > 5%)       │
│ GET /api/projects/:id/workflow-state        │
│ 15 failures / 234 requests (6.4%)           │
│ Most common: 504 Gateway Timeout (10)       │
└─────────────────────────────────────────────┘
```

**API Endpoints**:
- `GET /api/monitoring/errors/summary`
- `GET /api/monitoring/errors/top`
- `GET /api/monitoring/errors/:id/details`
- `GET /api/monitoring/failed-requests`

**Integration**:
- Sentry (recommended)
- LogRocket
- Custom error logging

---

### 6. Performance Metrics

**Purpose**: ติดตาม performance และ UX metrics

**Metrics**:
```typescript
interface PerformanceMetrics {
  // Web Vitals (Core Web Vitals)
  webVitals: {
    // Load Performance
    fcp: number;  // First Contentful Paint (ms)
    lcp: number;  // Largest Contentful Paint (ms)
    ttfb: number; // Time to First Byte (ms)

    // Interactivity
    fid: number;  // First Input Delay (ms)
    tti: number;  // Time to Interactive (ms)
    tbt: number;  // Total Blocking Time (ms)

    // Visual Stability
    cls: number;  // Cumulative Layout Shift (score)

    // Percentiles
    p50: CoreWebVitals;
    p75: CoreWebVitals;
    p95: CoreWebVitals;
  };

  // API Performance
  apiMetrics: {
    avgResponseTime: number;
    p95ResponseTime: number;
    slowestEndpoints: {
      endpoint: string;
      avgTime: number;
      p95Time: number;
      count: number;
    }[];
  };

  // Database Performance
  databaseMetrics: {
    avgQueryTime: number;
    slowQueries: {
      query: string;
      avgTime: number;
      count: number;
    }[];
    connectionPoolUsage: number; // percentage
  };

  // Cache Performance
  cacheMetrics: {
    hitRate: number; // percentage
    missRate: number;
    avgHitTime: number;
    avgMissTime: number;
  };

  // Bundle Size
  bundleMetrics: {
    totalSize: number; // MB
    jsSize: number;
    cssSize: number;
    imageSize: number;
    chunksCount: number;
  };
}
```

**Visualizations**:
- 🎯 Core Web Vitals scorecard (Good/Needs Improvement/Poor)
- 📈 Performance trend charts (Last 7d/30d)
- 🐌 Slowest endpoints/queries table
- 📦 Bundle size breakdown
- 🔍 Performance by page comparison

**Example UI**:
```
┌─────────────────────────────────────────────┐
│ Core Web Vitals                             │
│                                             │
│ LCP: 1.2s  🟢 Good       (Target: <2.5s)   │
│ FID: 45ms  🟢 Good       (Target: <100ms)  │
│ CLS: 0.05  🟢 Good       (Target: <0.1)    │
│                                             │
│ Overall Score: 95/100                       │
├─────────────────────────────────────────────┤
│ API Performance (P95)                       │
│ Average: 185ms                              │
│                                             │
│ Slowest Endpoints:                          │
│ 1. GET /api/reports/export         2,345ms │
│ 2. POST /api/admin/upload          1,234ms │
│ 3. GET /api/projects/workflow-state  567ms │
├─────────────────────────────────────────────┤
│ Database Performance                        │
│ Avg Query Time: 12ms                        │
│                                             │
│ Slowest Queries (P95):                      │
│ 1. SELECT * FROM Meeting JOIN...    234ms  │
│ 2. UPDATE StudentWorkflow...        156ms  │
├─────────────────────────────────────────────┤
│ Cache Hit Rate: 87% 🟢                      │
│ Bundle Size: 2.3 MB (JS: 1.8 MB)           │
└─────────────────────────────────────────────┘
```

**API Endpoints**:
- `GET /api/monitoring/performance/web-vitals`
- `GET /api/monitoring/performance/api`
- `GET /api/monitoring/performance/database`
- `GET /api/monitoring/performance/cache`

**Integration**:
- Google Analytics 4 (Web Vitals)
- Lighthouse CI
- Custom performance tracking

---

### 7. Background Jobs & Agents Status

**Purpose**: ติดตาม background processes ที่รันอัตโนมัติ

**Metrics**:
```typescript
interface BackgroundJobMetrics {
  // Agent Status (from backend/agents/)
  agents: {
    name: string; // e.g., "deadlineReminderAgent"
    status: 'running' | 'stopped' | 'error';
    lastRun: Date;
    nextRun: Date;
    successRate: number; // percentage
    totalRuns24h: number;
    failedRuns24h: number;
    avgDuration: number; // seconds
    lastError?: string;
  }[];

  // Email Queue
  emailQueue: {
    pending: number;
    processing: number;
    sent24h: number;
    failed24h: number;
    bounced24h: number;
    avgDeliveryTime: number; // minutes
  };

  // Scheduled Tasks
  scheduledTasks: {
    name: string;
    schedule: string; // cron expression
    lastRun: Date;
    status: 'success' | 'failed' | 'running';
    duration: number; // seconds
  }[];

  // Data Cleanup Jobs
  cleanupJobs: {
    name: string;
    lastRun: Date;
    recordsProcessed: number;
    recordsDeleted: number;
    status: 'success' | 'failed';
  }[];
}
```

**Visualizations**:
- 🤖 Agent status cards with health indicators
- 📧 Email queue stats
- 📅 Scheduled tasks timeline
- 📊 Success/failure rate charts
- 🔔 Alert for failed jobs

**Example UI**:
```
┌─────────────────────────────────────────────┐
│ Background Agents Status                    │
│                                             │
│ 🟢 deadlineReminderAgent                    │
│    Last Run: 10 min ago                     │
│    Next Run: in 50 min                      │
│    Success Rate: 98% (45/46 runs)           │
│                                             │
│ 🟢 eligibilityUpdater                       │
│    Last Run: 2 hours ago                    │
│    Next Run: in 4 hours                     │
│    Success Rate: 100% (24/24 runs)          │
│                                             │
│ 🔴 academicSemesterScheduler                │
│    Last Run: Failed 3 hours ago             │
│    Error: Database connection timeout       │
│    Next Retry: in 1 hour                    │
├─────────────────────────────────────────────┤
│ Email Queue                                 │
│ Pending:    23                              │
│ Processing:  5                              │
│ Sent (24h): 1,234                           │
│ Failed:      12 (0.96%)                     │
│ Avg Delivery: 2.3 minutes                   │
├─────────────────────────────────────────────┤
│ Recent Scheduled Tasks                      │
│ ✅ Update student eligibility (2h ago)      │
│ ✅ Send deadline reminders (10m ago)        │
│ ❌ Generate weekly reports (3h ago)         │
│    Error: Timeout after 300s                │
└─────────────────────────────────────────────┘
```

**API Endpoints**:
- `GET /api/monitoring/agents/status`
- `GET /api/monitoring/email-queue`
- `GET /api/monitoring/scheduled-tasks`

**Integration**:
- Backend already has `/api/agent-status` endpoint
- Extend with more detailed metrics

---

### 8. Security & Audit Log

**Purpose**: ติดตาม security events และ suspicious activities

**Metrics**:
```typescript
interface SecurityMetrics {
  // Authentication
  auth: {
    failedLogins24h: number;
    suspiciousLogins: {
      userId: string;
      username: string;
      reason: string; // e.g., "Multiple locations", "Unusual time"
      timestamp: Date;
      ipAddress: string;
    }[];
    lockedAccounts: number;
    passwordResets24h: number;
  };

  // Authorization
  authorization: {
    deniedAccesses24h: number;
    topDeniedRoutes: {
      route: string;
      count: number;
      users: string[];
    }[];
  };

  // API Abuse
  apiAbuse: {
    rateLimitExceeded: number;
    suspiciousPatterns: {
      ipAddress: string;
      requestCount: number;
      endpoints: string[];
      reason: string;
    }[];
  };

  // Data Access Audit
  criticalActions: {
    action: string; // e.g., "delete_student", "approve_all_documents"
    userId: string;
    username: string;
    timestamp: Date;
    ipAddress: string;
    details: any;
  }[];

  // Vulnerability Alerts
  vulnerabilities: {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    affectedComponent: string;
    detectedAt: Date;
    status: 'new' | 'acknowledged' | 'patched';
  }[];
}
```

**Visualizations**:
- 🔒 Security score indicator
- 🚨 Real-time security alerts
- 📋 Audit log table (searchable, filterable)
- 📊 Failed login attempts chart
- 🌍 Suspicious activity map (by IP/location)

**Example UI**:
```
┌─────────────────────────────────────────────┐
│ 🔒 Security Score: 92/100                   │
│ No critical alerts                          │
├─────────────────────────────────────────────┤
│ Authentication Activity (24h)               │
│ Failed Logins: 23                           │
│ Locked Accounts: 2                          │
│                                             │
│ ⚠️ Suspicious Logins:                       │
│ • user@example.com logged in from           │
│   Bangkok & Chiang Mai within 1 hour        │
│   IP: 203.x.x.x → 117.x.x.x                │
├─────────────────────────────────────────────┤
│ Recent Critical Actions                     │
│ 15:30 admin@cmu.ac.th                       │
│       Deleted student record (650610001)    │
│                                             │
│ 14:20 support@cmu.ac.th                     │
│       Bulk approved 45 CS05 documents       │
│                                             │
│ 12:45 admin@cmu.ac.th                       │
│       Modified workflow step definition     │
├─────────────────────────────────────────────┤
│ API Abuse Detection                         │
│ Rate limit exceeded: 5 IPs                  │
│ Top offender: 117.x.x.x (567 requests/min) │
└─────────────────────────────────────────────┘
```

**API Endpoints**:
- `GET /api/monitoring/security/summary`
- `GET /api/monitoring/security/audit-log`
- `GET /api/monitoring/security/suspicious-activity`

---

## 🛠️ Implementation Recommendations

### Technology Stack

#### Option 1: Custom Dashboard (Recommended for MVP)
**Stack**:
```typescript
// Frontend
- Next.js page: /admin/monitoring
- React Query for real-time updates
- Chart.js or Recharts for visualizations
- Server-Sent Events (SSE) for real-time data

// Backend
- New route: /api/monitoring/*
- Cache metrics in Redis
- Aggregate data from:
  - Application logs
  - Database queries
  - Existing analytics
```

**Pros**:
- Full control over UI/UX
- Integrated with existing codebase
- No external service costs
- Can customize to specific needs

**Cons**:
- Development time required
- Need to build real-time infrastructure
- Maintenance overhead

---

#### Option 2: Third-Party Services (Recommended for Scale)

**Monitoring Tools**:
1. **Application Performance Monitoring**:
   - New Relic (comprehensive)
   - Datadog (powerful, expensive)
   - AppDynamics

2. **Error Tracking**:
   - Sentry (highly recommended) ✅
   - Bugsnag
   - Rollbar

3. **Log Management**:
   - ELK Stack (Elasticsearch, Logstash, Kibana)
   - Splunk
   - Graylog (open source)

4. **Uptime Monitoring**:
   - UptimeRobot (free tier available)
   - Pingdom
   - StatusCake

5. **Web Analytics**:
   - Google Analytics 4 (free) ✅
   - Mixpanel
   - Amplitude

6. **Real User Monitoring (RUM)**:
   - LogRocket ✅
   - FullStory
   - Hotjar

**Pros**:
- Quick to setup
- Production-ready
- Advanced features (alerting, anomaly detection)
- Less maintenance

**Cons**:
- Monthly costs
- Data stored externally
- Limited customization

---

#### Option 3: Hybrid Approach (Best of Both) ⭐ RECOMMENDED

**Recommended Architecture**:
```
┌────────────────────────────────────────┐
│ CSLogbook Custom Monitoring Dashboard │
│ (Next.js - /admin/monitoring)          │
│                                        │
│ Sections:                              │
│ • System Health (Custom)               │
│ • Migration Dashboard (Custom)         │
│ • Business Metrics (Custom)            │
│ • Background Jobs (Custom)             │
└────────────┬───────────────────────────┘
             │
             ├─> Custom Backend APIs
             │   (/api/monitoring/*)
             │
             ├─> Google Analytics 4 (embedded)
             │   • User Activity
             │   • Page Views
             │   • Web Vitals
             │
             ├─> Sentry (embedded/iframe)
             │   • Error Tracking
             │   • Performance Monitoring
             │
             └─> UptimeRobot (link)
                 • Server Uptime
```

**This gives you**:
- ✅ Custom business metrics
- ✅ Professional error tracking (Sentry)
- ✅ User behavior analytics (GA4)
- ✅ Uptime monitoring (UptimeRobot)
- ✅ Single pane of glass
- ✅ Cost-effective

---

### Implementation Phases

#### Phase 1: MVP (Week 1-2)
**Goal**: Basic monitoring to catch critical issues

Implement:
1. System Health Overview
   - Server status endpoint
   - Basic error count
   - Response time metrics

2. Error Tracking Setup
   - Integrate Sentry (frontend + backend)
   - Setup error alerting (email/Slack)

3. Simple Analytics
   - Google Analytics 4 setup
   - Track page views
   - Track critical user actions

**Deliverables**:
- `/admin/monitoring` route
- Basic dashboard with 3-4 key metrics
- Sentry project setup
- GA4 tracking code

---

#### Phase 2: Migration Monitoring (Week 3-4)
**Goal**: Track feature rollout success

Implement:
1. Feature Flag Usage Tracking
   - Log feature flag checks
   - Count users per flag
   - Track errors per feature

2. Page Usage Comparison
   - Track "new" vs "legacy" page views
   - Calculate adoption percentage
   - Show migration progress

3. User Adoption Metrics
   - Daily active users on new pages
   - Trend charts
   - Feature usage heatmap

**Deliverables**:
- Migration dashboard section
- Feature flag tracking code
- Adoption report

---

#### Phase 3: Business Metrics (Week 5-6)
**Goal**: Operational insights for admins

Implement:
1. Document Queue Dashboard
   - Pending counts
   - Processing times
   - Late submissions

2. Workflow Analytics
   - Average approval times
   - Bottleneck detection
   - Queue health alerts

3. Student Progress Tracking
   - Eligibility trends
   - Active internships/projects
   - Completion rates

**Deliverables**:
- Business metrics API endpoints
- Queue health dashboard
- Automated alerts (email/Slack)

---

#### Phase 4: Performance & Scale (Week 7-8+)
**Goal**: Optimize and scale

Implement:
1. Performance Monitoring
   - Core Web Vitals tracking
   - API performance metrics
   - Database query monitoring

2. Background Jobs Dashboard
   - Agent status monitoring
   - Email queue health
   - Scheduled tasks log

3. Security Audit Log
   - Critical actions log
   - Suspicious activity detection
   - Compliance reporting

**Deliverables**:
- Performance dashboard
- Background jobs monitor
- Security audit log viewer

---

## 📋 Quick Start Implementation Guide

### Step 1: Create Monitoring Route

```bash
# Terminal
cd frontend-next
mkdir -p src/app/(app)/admin/monitoring
touch src/app/(app)/admin/monitoring/page.tsx
```

```typescript
// src/app/(app)/admin/monitoring/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { monitoringService } from '@/lib/services/monitoringService';

export default function MonitoringPage() {
  const { data: health } = useQuery({
    queryKey: ['monitoring', 'health'],
    queryFn: monitoringService.getSystemHealth,
    refetchInterval: 30000, // Refresh every 30s
  });

  return (
    <div className="monitoring-dashboard">
      <h1>System Monitoring</h1>

      {/* System Health Section */}
      <section>
        <h2>System Health</h2>
        <div className="metrics-grid">
          <MetricCard
            title="Server Status"
            value={health?.serverStatus || 'Unknown'}
            status={health?.serverStatus === 'healthy' ? 'good' : 'bad'}
          />
          <MetricCard
            title="Response Time"
            value={`${health?.avgResponseTime || 0}ms`}
            trend={health?.responseTimeTrend || 'neutral'}
          />
          <MetricCard
            title="Error Rate"
            value={`${health?.errorRate || 0}%`}
            status={health?.errorRate < 1 ? 'good' : 'warning'}
          />
        </div>
      </section>

      {/* Add more sections... */}
    </div>
  );
}
```

### Step 2: Create Backend Monitoring Service

```bash
# Terminal
cd backend
touch services/monitoringService.js
```

```javascript
// backend/services/monitoringService.js
const os = require('os');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

class MonitoringService {
  // System Health
  async getSystemHealth() {
    const startTime = Date.now();

    // Database check
    const dbHealthy = await this.checkDatabaseConnection();

    // Get recent errors from logs
    const errorCount = await this.getRecentErrorCount();

    return {
      serverStatus: dbHealthy ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      errorRate: errorCount.rate,
      totalErrors24h: errorCount.total,
      cpuUsage: os.loadavg()[0],
      memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
      timestamp: new Date(),
    };
  }

  async checkDatabaseConnection() {
    try {
      await sequelize.authenticate();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  async getRecentErrorCount() {
    // Implement based on your error logging strategy
    // This is a placeholder
    return {
      total: 0,
      rate: 0,
    };
  }

  // Migration Metrics
  async getMigrationStatus() {
    // Query feature flag usage from logs or database
    // Track page views from analytics

    return {
      totalPages: 52,
      migratedPages: 41,
      enabledPages: 38,
      completionPercentage: 78,
      // ... more metrics
    };
  }

  // Add more methods...
}

module.exports = new MonitoringService();
```

### Step 3: Create API Routes

```javascript
// backend/routes/monitoring.js
const express = require('express');
const router = express.Router();
const monitoringService = require('../services/monitoringService');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// All monitoring routes require admin role
router.use(authenticateToken, requireRole(['admin', 'support']));

// System Health
router.get('/system-health', async (req, res) => {
  try {
    const health = await monitoringService.getSystemHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Migration Status
router.get('/migration-status', async (req, res) => {
  try {
    const status = await monitoringService.getMigrationStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add more routes...

module.exports = router;
```

```javascript
// backend/app.js
// Add to route mounting section
app.use('/api/monitoring', require('./routes/monitoring'));
```

### Step 4: Setup Sentry (Error Tracking)

```bash
# Terminal
npm install --save @sentry/node @sentry/profiling-node  # Backend
cd ../frontend-next
npm install --save @sentry/nextjs  # Frontend
```

```javascript
// backend/config/sentry.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

module.exports = Sentry;
```

```typescript
// frontend-next/sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

### Step 5: Setup Google Analytics 4

```typescript
// frontend-next/src/lib/analytics/gtag.ts
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

export const event = ({ action, category, label, value }: any) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
```

```typescript
// frontend-next/src/app/layout.tsx
import Script from 'next/script';
import { GA_TRACKING_ID } from '@/lib/analytics/gtag';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 🔔 Alerting Strategy

### Critical Alerts (Immediate Action)
- Server down
- Database connection failure
- Error rate > 5%
- Response time > 5s (p95)
- Background agent failed 3+ times
- Security: Multiple failed logins from same IP

**Channels**: Slack + Email + SMS (for on-call)

### Warning Alerts (Check Soon)
- Error rate > 1%
- Response time > 2s (p95)
- Queue length > 50 items
- Document waiting > 7 days
- Low cache hit rate < 70%

**Channels**: Slack + Email

### Info Alerts (FYI)
- Daily summary report
- Weekly performance digest
- Monthly business metrics
- Successful deployments

**Channels**: Email

---

## 📈 Success Metrics

**System Health**:
- ✅ Uptime > 99.9%
- ✅ Response time < 200ms (avg)
- ✅ Error rate < 0.5%

**Migration Success**:
- ✅ 80% user adoption within 4 weeks
- ✅ Zero critical bugs in new features
- ✅ Performance improvement vs legacy

**Business Operations**:
- ✅ Average approval time < 24h
- ✅ Late submissions < 5%
- ✅ Queue backlog < 3 days

---

## 🎯 Next Steps

1. **Week 1**: Implement Phase 1 (MVP monitoring)
2. **Week 2**: Setup Sentry + GA4
3. **Week 3-4**: Build migration dashboard
4. **Week 5-6**: Add business metrics
5. **Ongoing**: Refine based on real usage

**Start small, iterate fast!** 🚀

---

**Questions?** Check:
- Sentry Docs: https://docs.sentry.io/
- GA4 Docs: https://developers.google.com/analytics/devguides/collection/ga4
- Web Vitals: https://web.dev/vitals/
