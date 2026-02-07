import { apiFetchData } from "@/lib/api/client";

type AcademicSettings = {
  academicYear?: number | null;
  currentSemester?: number | null;
  semester?: number | null;
};

export type AcademicInfo = {
  academicYear: number;
  semester: number;
  displayText: string;
  isFromDatabase: boolean;
};

export async function getCurrentAcademicSettings(): Promise<AcademicSettings | null> {
  return apiFetchData<AcademicSettings>("/academic/current");
}

export async function getCurrentAcademicInfo(): Promise<AcademicInfo | null> {
  const settings = await getCurrentAcademicSettings();

  if (!settings) {
    return null;
  }

  let academicYear = settings.academicYear ?? null;
  let semester = settings.currentSemester ?? settings.semester ?? null;

  if (semester == null) {
    const now = new Date();
    const month = now.getMonth() + 1;
    semester = month >= 6 && month <= 10 ? 1 : 2;
    if (academicYear == null) {
      academicYear = now.getFullYear() + 543;
    }
    return {
      academicYear,
      semester,
      displayText: `${academicYear}/${semester}*`,
      isFromDatabase: false,
    };
  }

  if (academicYear == null) {
    academicYear = new Date().getFullYear() + 543;
  }

  return {
    academicYear,
    semester,
    displayText: `${academicYear}/${semester}`,
    isFromDatabase: true,
  };
}
