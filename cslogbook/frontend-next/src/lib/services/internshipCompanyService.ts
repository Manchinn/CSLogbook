import { apiFetch } from "@/lib/api/client";

export type InternshipCompanyRow = {
  companyName: string;
  totalStudents: number;
  capacityLimit: number;
  capacityUsed: number;
  capacityStatus: "full" | "available";
};

export type InternshipCompanyMeta = {
  academicYear: number | null;
  semester: number | null;
  totalCompanies: number;
  totalStudents: number;
  totalAllCompanies: number;
  totalAllStudents: number;
  limit: number;
  page: number;
  totalPages: number;
  generatedAt: string;
};

export type InternshipCompanyStats = {
  success?: boolean;
  meta: InternshipCompanyMeta;
  rows: InternshipCompanyRow[];
};

export type InternshipCompanyIntern = {
  userId?: number;
  studentCode?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  internshipPosition?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  internshipDays?: number | null;
};

export type InternshipCompanyDetail = {
  success?: boolean;
  companyName: string;
  total: number;
  interns: InternshipCompanyIntern[];
};

const CAPACITY_LIMIT = 2; // legacy rule from the previous frontend

type StatsParams = {
  academicYear?: number | null;
  semester?: number | null;
  limit?: number | null;
  page?: number | null;
};

export async function getInternshipCompanyStats(token: string, params: StatsParams) {
  const query = new URLSearchParams();
  if (params.academicYear) query.set("academicYear", String(params.academicYear));
  if (params.semester) query.set("semester", String(params.semester));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.page) query.set("page", String(params.page));

  const queryString = query.toString();

  const response = await apiFetch<InternshipCompanyStats>(
    `/internship/company-stats${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
      token,
    }
  );

  const rows = (response.rows ?? []).map((row) => {
    const used = Number(row.totalStudents ?? 0);
    return {
      ...row,
      totalStudents: used,
      capacityLimit: CAPACITY_LIMIT,
      capacityUsed: used,
      capacityStatus: used >= CAPACITY_LIMIT ? "full" : "available",
    } satisfies InternshipCompanyRow;
  });

  return { ...response, rows } satisfies InternshipCompanyStats;
}

export async function getInternshipCompanyDetail(token: string, companyName: string, academicYear?: number | null) {
  const encodedName = encodeURIComponent(companyName.trim());
  const query = new URLSearchParams();
  if (academicYear) query.set("academicYear", String(academicYear));
  const queryString = query.toString();

  return apiFetch<InternshipCompanyDetail>(
    `/internship/company-stats/${encodedName}/detail${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
      token,
    }
  );
}
