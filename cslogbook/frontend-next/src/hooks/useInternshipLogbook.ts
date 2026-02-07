"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  generateInternshipWorkdays,
  getInternshipDateRange,
  getTimesheetEntries,
  getTimesheetStats,
  saveTimesheetEntry,
  updateTimesheetEntry,
  type SaveTimesheetPayload,
  type TimesheetEntry,
  type InternshipDateRange,
} from "@/lib/services/internshipLogbookService";

export function useInternshipDateRange(token: string | null, enabled: boolean) {
  return useQuery<InternshipDateRange | null, Error>({
    queryKey: ["internship-logbook-date-range", token],
    queryFn: () => getInternshipDateRange(token ?? ""),
    enabled: Boolean(token) && enabled,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useInternshipWorkdays(token: string | null, enabled: boolean) {
  return useQuery<string[], Error>({
    queryKey: ["internship-logbook-workdays", token],
    queryFn: () => generateInternshipWorkdays(token ?? ""),
    enabled: Boolean(token) && enabled,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useTimesheetEntries(token: string | null, enabled: boolean) {
  return useQuery<TimesheetEntry[], Error>({
    queryKey: ["internship-timesheet-entries", token],
    queryFn: () => getTimesheetEntries(token ?? ""),
    enabled: Boolean(token) && enabled,
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useTimesheetStats(token: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["internship-timesheet-stats", token],
    queryFn: () => getTimesheetStats(token ?? ""),
    enabled: Boolean(token) && enabled,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useTimesheetMutations(token: string | null) {
  const queryClient = useQueryClient();

  const invalidateTimesheet = () => {
    queryClient.invalidateQueries({ queryKey: ["internship-timesheet-entries", token] });
    queryClient.invalidateQueries({ queryKey: ["internship-timesheet-stats", token] });
    queryClient.invalidateQueries({ queryKey: ["internship-logbook-workdays", token] });
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: SaveTimesheetPayload) => {
      if (!token) throw new Error("missing token");
      return saveTimesheetEntry(token, payload);
    },
    onSuccess: invalidateTimesheet,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ logId, payload }: { logId: number; payload: SaveTimesheetPayload }) => {
      if (!token) throw new Error("missing token");
      return updateTimesheetEntry(token, logId, payload);
    },
    onSuccess: invalidateTimesheet,
  });

  return { saveMutation, updateMutation };
}
