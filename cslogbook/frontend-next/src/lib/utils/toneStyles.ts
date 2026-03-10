import type { StatusTone } from "./statusLabels";

/**
 * แปลง StatusTone → CSS Module class name จาก requestPage.module.css
 * ใช้แทน nested ternary ที่ซ้ำกันใน request pages
 */
const TONE_CLASS_MAP: Record<string, string> = {
  success: "tagSuccess",
  warning: "tagWarning",
  danger: "tagDanger",
  info: "tagInfo",
  muted: "tagDefault",
  default: "tagDefault",
};

export function toneClassName(tone: StatusTone | string): string {
  return TONE_CLASS_MAP[tone] ?? "tagDefault";
}
