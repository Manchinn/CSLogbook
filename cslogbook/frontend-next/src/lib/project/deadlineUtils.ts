import type { StudentDeadlineDetail } from "@/lib/services/studentService";

type DeadlineStep = {
  deadlineName?: string | null;
  relatedTo?: string | null;
};

export const DEFAULT_DEADLINE_KEYWORD_FILTER = /วันสุดท้าย|ของ|การ|เอกสาร|คำ|ขอ|โครงงานพิเศษ|คพ\.|\(|\)/g;

export function parseDateValue(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function extractDeadlineKeywords(text: string, filter: RegExp = DEFAULT_DEADLINE_KEYWORD_FILTER) {
  return text
    .replace(filter, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1)
    .map((word) => word.toLowerCase());
}

export function getDeadlineBaseTime(deadline: StudentDeadlineDetail) {
  if (deadline.deadlineAt) return parseDateValue(deadline.deadlineAt);
  if (deadline.deadlineDate) {
    const time = deadline.deadlineTime ?? "00:00:00";
    return parseDateValue(`${deadline.deadlineDate}T${time}`);
  }
  return null;
}

export function getEffectiveDeadline(deadline: StudentDeadlineDetail, base: Date | null) {
  const effective = parseDateValue(deadline.effectiveDeadlineAt ?? null);
  if (effective) return effective;
  if (!base) return null;
  const graceMinutes = deadline.gracePeriodMinutes ?? 0;
  if (deadline.allowLate && graceMinutes > 0) {
    return new Date(base.getTime() + graceMinutes * 60 * 1000);
  }
  return base;
}

export function getDeadlineSortTime(deadline: StudentDeadlineDetail) {
  const effective = parseDateValue(deadline.effectiveDeadlineAt ?? null);
  const base = effective ?? getDeadlineBaseTime(deadline);
  return base ? base.getTime() : Number.POSITIVE_INFINITY;
}

export function isDeadlineMatch(
  step: DeadlineStep,
  deadline: StudentDeadlineDetail,
  keywordFilter: RegExp = DEFAULT_DEADLINE_KEYWORD_FILTER
) {
  if (!step.deadlineName || !step.relatedTo) return false;
  const deadlineName = String(deadline.name || "").trim();
  const stepDeadlineName = String(step.deadlineName || "").trim();
  const relatedToMatch = String(deadline.relatedTo || "").toLowerCase() === step.relatedTo.toLowerCase();

  if (!relatedToMatch) return false;
  if (deadlineName === stepDeadlineName) return true;

  const deadlineKeywords = extractDeadlineKeywords(deadlineName, keywordFilter);
  const stepKeywords = extractDeadlineKeywords(stepDeadlineName, keywordFilter);
  const commonKeywords = deadlineKeywords.filter((keyword) => stepKeywords.includes(keyword));
  if (commonKeywords.length >= 2) return true;

  return deadlineName.includes(stepDeadlineName) || stepDeadlineName.includes(deadlineName);
}
