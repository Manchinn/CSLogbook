export const featureFlags = {
  enableMockAuth: process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === "true",
  enableSSO: process.env.NEXT_PUBLIC_ENABLE_SSO === "true",
  enableAdminWidgetMigration: process.env.NEXT_PUBLIC_ENABLE_ADMIN_WIDGET_MIGRATION === "true",
  enableAdminProjectWorkflowWidget:
    process.env.NEXT_PUBLIC_ENABLE_ADMIN_PROJECT_WORKFLOW_WIDGET === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_ADMIN_WIDGET_MIGRATION === "true",
  enableTeacherWidgetMigration: process.env.NEXT_PUBLIC_ENABLE_TEACHER_WIDGET_MIGRATION === "true",
  enableStudentWidgetMigration: process.env.NEXT_PUBLIC_ENABLE_STUDENT_WIDGET_MIGRATION === "true",
  enableStudentInternshipWidget:
    process.env.NEXT_PUBLIC_ENABLE_STUDENT_INTERNSHIP_WIDGET === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_STUDENT_WIDGET_MIGRATION === "true",
  enableStudentProjectWidget:
    process.env.NEXT_PUBLIC_ENABLE_STUDENT_PROJECT_WIDGET === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_STUDENT_WIDGET_MIGRATION === "true",
  enableStudentProfilePage: process.env.NEXT_PUBLIC_ENABLE_STUDENT_PROFILE_PAGE === "true",
  enableProjectPhase1Page: process.env.NEXT_PUBLIC_ENABLE_PROJECT_PHASE1_PAGE === "true",
  enableProjectPhase2Page: process.env.NEXT_PUBLIC_ENABLE_PROJECT_PHASE2_PAGE === "true",
  enableInternshipFlowPage: process.env.NEXT_PUBLIC_ENABLE_INTERNSHIP_FLOW_PAGE === "true",
  enableInternshipLogbookPage: process.env.NEXT_PUBLIC_ENABLE_INTERNSHIP_LOGBOOK_PAGE === "true",
  enableInternshipCertificatePage:
    process.env.NEXT_PUBLIC_ENABLE_INTERNSHIP_CERTIFICATE_PAGE === "true",
  enableDeadlinesPage: process.env.NEXT_PUBLIC_ENABLE_DEADLINES_PAGE === "true",
  enableMeetingsPage: process.env.NEXT_PUBLIC_ENABLE_MEETINGS_PAGE === "true",
  enableReportsPage: process.env.NEXT_PUBLIC_ENABLE_REPORTS_PAGE === "true",
  enableSettingsPage: process.env.NEXT_PUBLIC_ENABLE_SETTINGS_PAGE === "true",
};
