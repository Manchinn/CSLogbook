function readFlag(name: string, defaultValue = false) {
  const raw = process.env[name];
  if (raw === "true") return true;
  if (raw === "false") return false;
  return defaultValue;
}

export const featureFlags = {
  enableMockAuth: readFlag("NEXT_PUBLIC_ENABLE_MOCK_AUTH"),
  enableSSO: readFlag("NEXT_PUBLIC_ENABLE_SSO"),
  enableAdminWidgetMigration: readFlag("NEXT_PUBLIC_ENABLE_ADMIN_WIDGET_MIGRATION"),
  enableAdminProjectWorkflowWidget:
    readFlag("NEXT_PUBLIC_ENABLE_ADMIN_PROJECT_WORKFLOW_WIDGET") ||
    readFlag("NEXT_PUBLIC_ENABLE_ADMIN_WIDGET_MIGRATION"),
  enableTeacherWidgetMigration: readFlag("NEXT_PUBLIC_ENABLE_TEACHER_WIDGET_MIGRATION", true),
  enableStudentWidgetMigration: readFlag("NEXT_PUBLIC_ENABLE_STUDENT_WIDGET_MIGRATION", true),
  enableStudentInternshipWidget:
    readFlag("NEXT_PUBLIC_ENABLE_STUDENT_INTERNSHIP_WIDGET", true) ||
    readFlag("NEXT_PUBLIC_ENABLE_STUDENT_WIDGET_MIGRATION", true),
  enableStudentProjectWidget:
    readFlag("NEXT_PUBLIC_ENABLE_STUDENT_PROJECT_WIDGET", true) ||
    readFlag("NEXT_PUBLIC_ENABLE_STUDENT_WIDGET_MIGRATION", true),
  enableStudentProfilePage: readFlag("NEXT_PUBLIC_ENABLE_STUDENT_PROFILE_PAGE", true),
  enableProjectPhase1Page: readFlag("NEXT_PUBLIC_ENABLE_PROJECT_PHASE1_PAGE", true),
  enableProjectPhase2Page: readFlag("NEXT_PUBLIC_ENABLE_PROJECT_PHASE2_PAGE", true),
  enableInternshipFlowPage: readFlag("NEXT_PUBLIC_ENABLE_INTERNSHIP_FLOW_PAGE", true),
  enableInternshipLogbookPage: readFlag("NEXT_PUBLIC_ENABLE_INTERNSHIP_LOGBOOK_PAGE", true),
  enableInternshipCertificatePage: readFlag("NEXT_PUBLIC_ENABLE_INTERNSHIP_CERTIFICATE_PAGE", true),
  enableDeadlinesPage: readFlag("NEXT_PUBLIC_ENABLE_DEADLINES_PAGE", true),
  enableMeetingsPage: readFlag("NEXT_PUBLIC_ENABLE_MEETINGS_PAGE", true),
  enableReportsPage: readFlag("NEXT_PUBLIC_ENABLE_REPORTS_PAGE", true),
  enableSettingsPage: readFlag("NEXT_PUBLIC_ENABLE_SETTINGS_PAGE", true),
};
