/**
 * thaiDateUtils.ts
 * ชุดเครื่องมือสำหรับจัดการวันที่และเวลาตามมาตรฐานไทย (th-TH / Asia/Bangkok)
 *
 * หลักการ:
 * - ปีที่จัดเก็บในระบบเป็น พ.ศ. (Buddhist Era) — > 2500
 * - Server อาจอยู่ใน UTC แต่ฝั่ง Client ต้องไม่ให้เกิด UTC-shifting
 * - Timezone คงที่ Asia/Bangkok (UTC+7) ไม่มี DST
 * - ส่ง ISO 8601 ที่มี offset +07:00 ชัดเจนเมื่อส่งไป Backend เสมอ
 */

const BANGKOK_OFFSET = "+07:00";
const BE_OFFSET = 543; // ค.ศ. + 543 = พ.ศ.

// ────────────────────────────────────────────────
// 1. Academic Year Helpers (พ.ศ.)
// ────────────────────────────────────────────────

/**
 * ตรวจว่าปีที่ระบุเป็น พ.ศ. หรือไม่ (ต้องมากกว่า 2500)
 */
export function isBuddhistYear(year: number): boolean {
  return year >= 2500;
}

/**
 * แปลงปี ค.ศ. เป็น พ.ศ. ถ้าค่าน้อยกว่า 2500 ให้บวก 543
 * ถ้าเป็น พ.ศ. แล้ว (≥ 2500) คืนค่าเดิม
 */
export function ensureBuddhistYear(year: number | string | null | undefined): number | null {
  if (year === null || year === undefined || year === "") return null;
  const n = Number(year);
  if (!Number.isFinite(n)) return null;
  return n < 2500 ? n + BE_OFFSET : n;
}

/**
 * ปี พ.ศ. ปัจจุบัน ปรับตามปีการศึกษา (ก่อนมิ.ย. = ปีก่อน)
 */
export function currentBuddhistYear(): number {
  const now = new Date();
  const buddhistYear = now.getFullYear() + BE_OFFSET;
  return now.getMonth() < 5 ? buddhistYear - 1 : buddhistYear;
}

/**
 * สร้าง placeholder hint สำหรับ input ปีการศึกษา
 * แสดงปีปัจจุบัน (พ.ศ.) เป็นตัวอย่าง
 */
export function academicYearPlaceholder(): string {
  return `เช่น ${new Date().getFullYear() + BE_OFFSET}`;
}

/**
 * ตรวจสอบว่าค่าที่ input เป็น พ.ศ. ที่สมเหตุสมผล
 * returns null ถ้าผ่าน, returns string error ถ้าไม่ผ่าน
 */
export function validateBuddhistYear(value: string): string | null {
  if (!value) return null; // ไม่บังคับกรอก
  const n = Number(value);
  if (!Number.isFinite(n)) return "ปีการศึกษาต้องเป็นตัวเลข";
  if (n > 0 && n < 2500) return `ระบบใช้ — ค่า ${n} ดูเหมือนเป็น ค.ศ. (น่าจะเป็น ${n + BE_OFFSET})`;
  if (n < 2400 || n > 3000) return "ปีการศึกษาไม่อยู่ในช่วงที่ถูกต้อง";
  return null;
}

// ────────────────────────────────────────────────
// 2. Date Formatting (DD/MM/YYYY พ.ศ.)
// ────────────────────────────────────────────────

/**
 * แปลงวันที่ ISO string หรือ YYYY-MM-DD เป็น DD/MM/YYYY (พ.ศ.)
 * คืน "-" ถ้า input ว่างหรือ invalid
 *
 * @example
 *   formatThaiDate("2025-06-01") → "01/06/2568"
 */
export function formatThaiDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  // ใช้ UTC parse เพื่อป้องกัน local-offset shifting
  // รองรับทั้ง "YYYY-MM-DD" และ ISO string
  const parts = dateStr.substring(0, 10).split("-");
  if (parts.length !== 3) return dateStr; // fallback คืนค่าเดิม
  const [y, m, d] = parts;
  const year = Number(y);
  if (!Number.isFinite(year)) return dateStr;
  const beYear = year < 2500 ? year + BE_OFFSET : year;
  return `${d}/${m}/${beYear}`;
}

/**
 * แปลงวันที่ + เวลาเป็น DD/MM/YYYY HH:mm (พ.ศ.)
 *
 * @example
 *   formatThaiDateTime("2025-06-01", "16:30") → "01/06/2568 16:30"
 *   formatThaiDateTime("2025-06-01T16:30:00+07:00") → "01/06/2568 16:30"
 */
export function formatThaiDateTime(
  dateOrIso: string | null | undefined,
  timeStr?: string | null
): string {
  if (!dateOrIso) return "-";

  let datePart: string;
  let timePart: string | undefined;

  if (dateOrIso.includes("T")) {
    // ISO string — parse ด้วย offset Bangkok เพื่อป้องกัน UTC shift
    // ถ้ามี +07:00 ให้ใช้ตามนั้น ถ้าไม่มี offset ให้ถือว่าเป็น Bangkok time
    const normalised = dateOrIso.endsWith("Z")
      ? dateOrIso.replace("Z", "+07:00") // สมมติว่า backend ส่ง UTC แต่จริงๆ คือ Bangkok
      : dateOrIso;
    // ตัดแค่ date+time ไม่ผ่าน Date() เพื่อหลีกเลี่ยง JS timezone conversion
    const withoutOffset = normalised.slice(0, 16); // YYYY-MM-DDTHH:mm
    [datePart, timePart] = withoutOffset.split("T");
  } else {
    datePart = dateOrIso.substring(0, 10);
    timePart = timeStr ?? undefined;
  }

  const dateFormatted = formatThaiDate(datePart);
  if (!timePart) return dateFormatted;
  // เอาแค่ HH:mm (ไม่เอาวินาที)
  const displayTime = timePart.substring(0, 5);
  return `${dateFormatted} ${displayTime}`;
}

// ────────────────────────────────────────────────
// 3. Timezone-safe Input/Output Helpers
// ────────────────────────────────────────────────

/**
 * แปลง ISO string จาก backend เป็นค่าสำหรับ <input type="datetime-local">
 * โดยตรึงเวลาให้เป็น Bangkok local time (ไม่ให้ browser แปลง timezone)
 *
 * @example
 *   isoToBangkokLocalInput("2025-06-01T09:30:00.000Z") → "2025-06-01T16:30"
 */
export function isoToBangkokLocalInput(isoStr: string | null | undefined): string {
  if (!isoStr) return "";
  // บวก 7 ชั่วโมงถ้า backend ส่งมาเป็น UTC (ลงท้ายด้วย Z หรือ +00:00)
  const isUtc = isoStr.endsWith("Z") || isoStr.includes("+00:00");
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "";

  if (isUtc) {
    // ขยับ +7 ชั่วโมงก่อน format
    const bangkokMs = d.getTime() + 7 * 60 * 60 * 1000;
    const localDate = new Date(bangkokMs);
    return toDatetimeLocalString(localDate);
  }
  // มี offset อยู่แล้ว — parse ตรงๆ
  const [datePart, rest] = isoStr.split("T");
  const timePart = rest ? rest.substring(0, 5) : "00:00";
  return `${datePart}T${timePart}`;
}

/**
 * แปลงค่า <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
 * เป็น ISO 8601 ที่มี offset +07:00 ชัดเจน เพื่อส่งไป Backend
 * ป้องกัน browser แปลงเป็น UTC โดยอัตโนมัติ
 *
 * @example
 *   bangkokLocalInputToISO("2025-06-01T16:30") → "2025-06-01T16:30:00+07:00"
 */
export function bangkokLocalInputToISO(localStr: string | null | undefined): string | undefined {
  if (!localStr) return undefined;
  // YYYY-MM-DDTHH:mm → YYYY-MM-DDTHH:mm:00+07:00
  const trimmed = localStr.slice(0, 16); // ตัดวินาที/millisecond ออก
  return `${trimmed}:00${BANGKOK_OFFSET}`;
}

/**
 * รวม date string (YYYY-MM-DD) + time string (HH:mm หรือ HH:mm:ss)
 * เป็น ISO 8601 ที่มี offset +07:00
 *
 * @example
 *   combineDateTimeToISO("2025-06-01", "16:30") → "2025-06-01T16:30:00+07:00"
 */
export function combineDateTimeToISO(
  dateStr: string | null | undefined,
  timeStr: string | null | undefined,
  defaultTime = "00:00:00"
): string | undefined {
  if (!dateStr) return undefined;
  const time = normalizeTime(timeStr) ?? defaultTime;
  return `${dateStr}T${time}${BANGKOK_OFFSET}`;
}

// ────────────────────────────────────────────────
// 4. Internal helpers
// ────────────────────────────────────────────────

function normalizeTime(timeStr: string | null | undefined): string | null {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length === 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
  if (parts.length === 3) return timeStr;
  return null;
}

function toDatetimeLocalString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  );
}
