"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ProjectDetail } from "@/lib/services/studentService";

export type DraftBasic = {
  projectNameTh: string;
  projectNameEn: string;
  projectType: string | null;
};

export type DraftClassification = {
  tracks: string[];
};

export type DraftMembers = {
  secondMemberCode: string;
  syncing: boolean;
  synced: boolean;
  validated: boolean;
  error: string | null;
};

export type DraftDetails = {
  background: string;
  objective: string;
  benefit: string;
};

type DraftStatus = {
  creating: boolean;
  saving: boolean;
  refreshing: boolean;
};

type DraftContextValue = {
  basic: DraftBasic;
  classification: DraftClassification;
  members: DraftMembers;
  details: DraftDetails;
  projectId: number | null;
  projectStatus: string;
  projectMembers: Array<{ studentId: number; role?: string; studentCode?: string | null; name?: string | null }>;
  status: DraftStatus;
  setBasic: (value: Partial<DraftBasic>) => void;
  setClassification: (value: Partial<DraftClassification>) => void;
  setMembers: (value: Partial<DraftMembers>) => void;
  setDetails: (value: Partial<DraftDetails>) => void;
  setProjectId: (value: number | null) => void;
  setProjectStatus: (value: string) => void;
  setProjectMembers: (value: DraftContextValue["projectMembers"]) => void;
  setStatus: (value: Partial<DraftStatus>) => void;
  hydrateFromProject: (project: ProjectDetail) => void;
  computeReadiness: () => Array<{ key: string; label: string; pass: boolean }>;
};

const DraftContext = createContext<DraftContextValue | undefined>(undefined);

const defaultState = {
  basic: { projectNameTh: "", projectNameEn: "", projectType: null },
  classification: { tracks: [] },
  members: { secondMemberCode: "", syncing: false, synced: false, validated: false, error: null },
  details: { background: "", objective: "", benefit: "" },
  projectId: null as number | null,
  projectStatus: "draft",
  projectMembers: [] as DraftContextValue["projectMembers"],
  status: { creating: false, saving: false, refreshing: false },
};

export function ProjectDraftProvider({ children }: { children: React.ReactNode }) {
  const [basic, setBasicState] = useState(defaultState.basic);
  const [classification, setClassificationState] = useState(defaultState.classification);
  const [members, setMembersState] = useState(defaultState.members);
  const [details, setDetailsState] = useState(defaultState.details);
  const [projectId, setProjectId] = useState<number | null>(defaultState.projectId);
  const [projectStatus, setProjectStatus] = useState(defaultState.projectStatus);
  const [projectMembers, setProjectMembers] = useState(defaultState.projectMembers);
  const [status, setStatusState] = useState(defaultState.status);

  const setBasic = useCallback((value: Partial<DraftBasic>) => {
    setBasicState((prev) => ({ ...prev, ...value }));
  }, []);

  const setClassification = useCallback((value: Partial<DraftClassification>) => {
    setClassificationState((prev) => ({ ...prev, ...value }));
  }, []);

  const setMembers = useCallback((value: Partial<DraftMembers>) => {
    setMembersState((prev) => ({ ...prev, ...value }));
  }, []);

  const setDetails = useCallback((value: Partial<DraftDetails>) => {
    setDetailsState((prev) => ({ ...prev, ...value }));
  }, []);

  const setStatus = useCallback((value: Partial<DraftStatus>) => {
    setStatusState((prev) => ({ ...prev, ...value }));
  }, []);

  const hydrateFromProject = useCallback(
    (project: ProjectDetail) => {
      setProjectId(project.projectId ?? null);
      setProjectStatus(project.status ?? "draft");
      setProjectMembers(Array.isArray(project.members) ? project.members : []);
      setBasicState({
        projectNameTh: project.projectNameTh || "",
        projectNameEn: project.projectNameEn || "",
        projectType: project.projectType ?? null,
      });
      setClassificationState({
        tracks: Array.isArray(project.tracks) ? project.tracks : [],
      });
      setDetailsState({
        background: project.background || "",
        objective: project.objective || "",
        benefit: project.benefit || "",
      });

      const secondMember = (project.members || []).find((member) => member.role === "member");
      if (secondMember?.studentCode) {
        setMembersState((prev) => ({
          ...prev,
          secondMemberCode: secondMember.studentCode || "",
          synced: true,
          validated: true,
          error: null,
        }));
      }
    },
    []
  );

  const computeReadiness = useCallback(() => {
    const hasMember2 = Boolean(members.secondMemberCode?.trim());
    return [
      { key: "name_th", label: "ชื่อภาษาไทย", pass: Boolean(basic.projectNameTh.trim()) },
      { key: "name_en", label: "ชื่อภาษาอังกฤษ", pass: Boolean(basic.projectNameEn.trim()) },
      { key: "type", label: "ประเภท", pass: Boolean(basic.projectType) },
      { key: "tracks", label: "หมวด", pass: classification.tracks.length > 0 },
      { key: "member2", label: "สมาชิกคนที่สอง", pass: hasMember2 },
      {
        key: "details",
        label: "รายละเอียดขั้นต่ำ",
        pass: Boolean(details.background.trim() && details.objective.trim() && details.benefit.trim()),
      },
    ];
  }, [basic, classification, details, members.secondMemberCode]);

  const value = useMemo(
    () => ({
      basic,
      classification,
      members,
      details,
      projectId,
      projectStatus,
      projectMembers,
      status,
      setBasic,
      setClassification,
      setMembers,
      setDetails,
      setProjectId,
      setProjectStatus,
      setProjectMembers,
      setStatus,
      hydrateFromProject,
      computeReadiness,
    }),
    [
      basic,
      classification,
      computeReadiness,
      details,
      members,
      projectId,
      projectMembers,
      projectStatus,
      setBasic,
      setClassification,
      setDetails,
      setMembers,
      setProjectId,
      setProjectMembers,
      setProjectStatus,
      setStatus,
      status,
      hydrateFromProject,
    ]
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useProjectDraft() {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error("useProjectDraft must be used within ProjectDraftProvider");
  }
  return context;
}
