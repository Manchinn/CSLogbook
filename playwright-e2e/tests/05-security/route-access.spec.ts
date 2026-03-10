import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Security Tests — UAT Part E
 *
 * 1. Route Access Control (parameterized matrix)
 * 2. File Upload Validation (API-level + client-side)
 * 3. Token Expiry / Invalid Token
 * 4. Concurrent Approval Guard (skipped — better via API test)
 *
 * หมายเหตุ: tests ในไฟล์นี้สร้าง browser context เอง
 * จึงรันแค่ project เดียว (student) เพื่อไม่ให้ซ้ำ 3 รอบ
 */

// รันแค่ project เดียว — tests สร้าง context เองอยู่แล้ว
test.beforeEach(async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'student',
    'security tests manage their own contexts — run once only'
  );
});

// ──────────────────────────────────────────────
// 1. Route Access Control
// ──────────────────────────────────────────────

type RouteAccess = {
  path: string;
  allowedRoles: ('officer' | 'advisor' | 'student')[];
  description: string;
};

const PROTECTED_ROUTES: RouteAccess[] = [
  {
    path: '/admin/settings/academic',
    allowedRoles: ['officer'],
    description: 'Admin Settings',
  },
  {
    path: '/admin/users/students',
    allowedRoles: ['officer'],
    description: 'Student Management',
  },
  {
    path: '/admin/users/teachers',
    allowedRoles: ['officer'],
    description: 'Teacher Management',
  },
  {
    path: '/admin/documents/internship',
    allowedRoles: ['officer'],
    description: 'Internship Documents',
  },
  {
    path: '/dashboard/admin',
    allowedRoles: ['officer'],
    description: 'Admin Dashboard',
  },
  {
    path: '/teacher/project1/advisor-queue',
    allowedRoles: ['advisor'],
    description: 'Advisor Queue',
  },
  {
    path: '/teacher/meeting-approvals',
    allowedRoles: ['advisor'],
    description: 'Meeting Approvals',
  },
  {
    path: '/dashboard/student',
    allowedRoles: ['student'],
    description: 'Student Dashboard',
  },
  // TODO: เพิ่ม routes อื่นตามระบบจริง
];

const ROLES = ['officer', 'advisor', 'student'] as const;

const ROLE_AUTH_FILES: Record<string, string> = {
  officer: 'auth/officer.json',
  advisor: 'auth/advisor.json',
  student: 'auth/student.json',
};

for (const route of PROTECTED_ROUTES) {
  test.describe(`Access: ${route.description} (${route.path})`, () => {
    // Allowed roles → access OK
    for (const role of route.allowedRoles) {
      test(`${role} can access`, async ({ browser }) => {
        const ctx = await browser.newContext({
          storageState: ROLE_AUTH_FILES[role],
        });
        const page = await ctx.newPage();

        await page.goto(route.path);
        await page.waitForLoadState('networkidle');

        // ต้องอยู่ที่ route เดิม (ไม่ถูก redirect)
        expect(page.url()).toContain(route.path);

        await ctx.close();
      });
    }

    // Unauthorized roles → redirect away
    const unauthorizedRoles = ROLES.filter(
      (r) => !route.allowedRoles.includes(r)
    );

    for (const role of unauthorizedRoles) {
      test(`${role} is redirected away`, async ({ browser }) => {
        const ctx = await browser.newContext({
          storageState: ROLE_AUTH_FILES[role],
        });
        const page = await ctx.newPage();

        await page.goto(route.path);

        // รอจน URL เปลี่ยน หรือ timeout 10 วินาที
        await expect(async () => {
          expect(page.url()).not.toContain(route.path);
        }).toPass({ timeout: 10_000 });

        await ctx.close();
      });
    }

    // Unauthenticated → redirect to /login
    test('unauthenticated → redirect to login', async ({ browser }) => {
      const ctx = await browser.newContext({
        storageState: { cookies: [], origins: [] },
      });
      const page = await ctx.newPage();

      await page.goto(route.path);
      await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });

      await ctx.close();
    });
  });
}

// ──────────────────────────────────────────────
// 2. File Upload Validation
// ──────────────────────────────────────────────

test.describe('File Upload Validation', () => {
  const FIXTURES_DIR = path.join(__dirname, '..', '..', 'fixtures', 'files');
  const API_URL = process.env.API_URL || 'http://localhost:5000/api';

  test.beforeAll(async () => {
    if (!fs.existsSync(FIXTURES_DIR)) {
      fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    }

    // Dummy .exe file (1 KB)
    const exePath = path.join(FIXTURES_DIR, 'malicious.exe');
    if (!fs.existsSync(exePath)) {
      fs.writeFileSync(exePath, Buffer.alloc(1024, 'MZ'));
    }

    // Oversized PDF (11 MB) — เกิน backend limit 10MB
    const bigPdfPath = path.join(FIXTURES_DIR, 'oversized.pdf');
    if (!fs.existsSync(bigPdfPath)) {
      const header = Buffer.from('%PDF-1.4\n');
      const body = Buffer.alloc(11 * 1024 * 1024, 0);
      fs.writeFileSync(bigPdfPath, Buffer.concat([header, body]));
    }
  });

  test('API rejects non-PDF file upload', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: ROLE_AUTH_FILES.student,
    });
    const page = await ctx.newPage();

    // ดึง JWT token จาก storage state
    await page.goto('/dashboard/student');
    const token = await page.evaluate(() =>
      localStorage.getItem('cslogbook:auth-token')
    );
    expect(token).toBeTruthy();

    // ส่ง .exe file ผ่าน API — POST /api/documents/submit
    // Backend multer จะ reject non-PDF (ถ้ามี fileFilter) หรือ controller จะ reject
    const exeFile = fs.readFileSync(path.join(FIXTURES_DIR, 'malicious.exe'));
    const response = await page.request.post(
      `${API_URL}/documents/submit`,
      {
        multipart: {
          file: {
            name: 'malicious.exe',
            mimeType: 'application/octet-stream',
            buffer: exeFile,
          },
          documentType: 'CS05',
        },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // ต้องไม่ return 200 success — reject ด้วย 4xx
    expect(response.status()).toBeGreaterThanOrEqual(400);

    await ctx.close();
  });

  test('API rejects file larger than size limit', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: ROLE_AUTH_FILES.student,
    });
    const page = await ctx.newPage();

    await page.goto('/dashboard/student');
    const token = await page.evaluate(() =>
      localStorage.getItem('cslogbook:auth-token')
    );
    expect(token).toBeTruthy();

    // ส่ง oversized PDF (11 MB) — backend limit คือ 5-10 MB
    const bigPdf = fs.readFileSync(path.join(FIXTURES_DIR, 'oversized.pdf'));
    const response = await page.request.post(
      `${API_URL}/documents/submit`,
      {
        multipart: {
          file: {
            name: 'oversized.pdf',
            mimeType: 'application/pdf',
            buffer: bigPdf,
          },
          documentType: 'CS05',
        },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // ต้อง reject — 400 หรือ 413 (Payload Too Large)
    expect(response.status()).toBeGreaterThanOrEqual(400);

    await ctx.close();
  });

  test('client-side file inputs restrict to PDF only', async ({ browser }) => {
    // ตรวจว่า file input มี accept="application/pdf" เป็น defense-in-depth
    const ctx = await browser.newContext({
      storageState: ROLE_AUTH_FILES.student,
    });
    const page = await ctx.newPage();

    // ลองหน้า internship-registration ที่ student ทุกคนเข้าได้
    await page.goto('/internship-registration');
    await page.waitForLoadState('networkidle');

    const fileInputs = page.locator('input[type="file"]');
    const count = await fileInputs.count();

    if (count > 0) {
      const accept = await fileInputs.first().getAttribute('accept');
      expect(accept).toContain('pdf');
    } else {
      test.skip(true, 'No file input on page — student may need different state');
    }

    await ctx.close();
  });
});

// ──────────────────────────────────────────────
// 3. Token Expiry / Invalid Token
// ──────────────────────────────────────────────

test.describe('Token Expiry & Invalid Token', () => {
  test('expired token → redirect to login', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await ctx.newPage();

    // Inject expired JWT ผ่าน localStorage
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem(
        'cslogbook:auth-token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJzdHVkZW50IiwiZXhwIjoxMDAwMDAwMDAwfQ.invalid_signature'
      );
    });

    await page.goto('/dashboard/student');
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });

    await ctx.close();
  });

  test('tampered token → redirect to login', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await ctx.newPage();

    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('cslogbook:auth-token', 'tampered.jwt.token.garbage');
    });

    await page.goto('/dashboard/admin');
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });

    await ctx.close();
  });

  test('removed token mid-session → redirect on next navigation', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      storageState: ROLE_AUTH_FILES.student,
    });
    const page = await ctx.newPage();

    await page.goto('/dashboard/student');
    await page.waitForLoadState('networkidle');

    // ลบ token ระหว่าง session
    await page.evaluate(() => {
      localStorage.removeItem('cslogbook:auth-token');
    });

    // Navigate ใหม่ → ต้อง redirect ไป login
    await page.goto('/dashboard/student');
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });

    await ctx.close();
  });
});

// ──────────────────────────────────────────────
// 4. Concurrent Approval Guard
// ──────────────────────────────────────────────

test.describe('Concurrent Approval Guard', () => {
  // ⚠ ทดสอบยากใน E2E — ต้องมี 2 users approve record เดียวกันพร้อมกัน
  // แนะนำ: ทดสอบผ่าน API/unit test ที่ control timing ได้ดีกว่า
  test.skip('two approvers cannot double-approve same record', async ({
    browser,
  }) => {
    const ctx1 = await browser.newContext({
      storageState: ROLE_AUTH_FILES.advisor,
    });
    const ctx2 = await browser.newContext({
      storageState: ROLE_AUTH_FILES.advisor,
    });

    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();

    await page1.goto('/teacher/meeting-approvals');
    await page2.goto('/teacher/meeting-approvals');

    // TODO: ทั้ง 2 กด approve พร้อมกัน → ตรวจว่าไม่เกิด duplicate
    // Better tested via API/unit test with controlled concurrency

    await ctx1.close();
    await ctx2.close();
  });
});
