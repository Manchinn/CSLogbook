type EligibilityData = {
  academicSettings?: {
    currentSemester?: number | string | null;
    projectRegistrationPeriod?: unknown;
  } | null;
  requirements?: {
    project?: {
      allowedSemesters?: unknown;
    } | null;
  } | null;
};

type ProjectData = {
  examResult?: string | null;
  status?: string | null;
} | null;

type GateConfig = {
  project: ProjectData;
  eligibility: EligibilityData | null;
  formatDate?: (value?: string | null) => string;
};

function normalizeAllowedSemesters(value: unknown) {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).flat();
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "object" && parsed !== null) {
        return Object.values(parsed as Record<string, unknown>).flat();
      }
    } catch {
      return [];
    }
  }
  return [];
}

function getProjectRegistrationStartDate(value: unknown) {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed?.startDate ?? null;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") {
    const registration = value as { startDate?: string | null };
    return registration.startDate ?? null;
  }
  return null;
}

export function getPhase2GateReasons({ project, eligibility, formatDate }: GateConfig) {
  if (!project) return ["ยังไม่มีข้อมูลโครงงาน"];
  const reasons: string[] = [];

  if (project.examResult !== "passed") {
    reasons.push("ผลสอบหัวข้อยังไม่ผ่าน");
  }

  if (!project.status || !["in_progress", "completed"].includes(project.status)) {
    reasons.push("สถานะโครงงานยังไม่อยู่ในขั้น \"กำลังดำเนินการ\"");
  }

  const academicSettings = eligibility?.academicSettings ?? null;
  const currentSemester =
    academicSettings?.currentSemester !== undefined && academicSettings?.currentSemester !== null
      ? Number(academicSettings.currentSemester)
      : null;

  const rawSemesters = eligibility?.requirements?.project?.allowedSemesters;
  const allowedSemesters = normalizeAllowedSemesters(rawSemesters)
    .map((item) => Number(item))
    .filter((semester) => Number.isInteger(semester));

  if (allowedSemesters.length > 0 && typeof currentSemester === "number") {
    if (!allowedSemesters.includes(currentSemester)) {
      reasons.push(`ภาคเรียนที่ ${currentSemester} ยังไม่เปิดยื่นสอบปริญญานิพนธ์`);
    }
  }

  const projectRegistrationStartDate = getProjectRegistrationStartDate(academicSettings?.projectRegistrationPeriod);
  if (projectRegistrationStartDate) {
    const startDate = new Date(projectRegistrationStartDate);
    if (!Number.isNaN(startDate.getTime()) && new Date() < startDate) {
      const format = formatDate ?? (() => "-");
      const displayDate = format(projectRegistrationStartDate);
      reasons.push(
        displayDate !== "-"
          ? `ภาคเรียนถัดไปจะเปิดให้ยื่นสอบปริญญานิพนธ์ ในวันที่ ${displayDate}`
          : "ภาคเรียนถัดไปยังไม่เปิดให้ยื่นสอบปริญญานิพนธ์"
      );
    }
  }

  return reasons;
}
