export const featureFlags = {
  useLegacyFrontend: process.env.NEXT_PUBLIC_USE_LEGACY_FRONTEND === "true",
  enableSSO: process.env.NEXT_PUBLIC_ENABLE_SSO === "true",
  enableTeacherWidgetMigration: process.env.NEXT_PUBLIC_ENABLE_TEACHER_WIDGET_MIGRATION === "true",
  enableStudentWidgetMigration: process.env.NEXT_PUBLIC_ENABLE_STUDENT_WIDGET_MIGRATION === "true",
  enableStudentInternshipWidget:
    process.env.NEXT_PUBLIC_ENABLE_STUDENT_INTERNSHIP_WIDGET === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_STUDENT_WIDGET_MIGRATION === "true",
  enableStudentProjectWidget:
    process.env.NEXT_PUBLIC_ENABLE_STUDENT_PROJECT_WIDGET === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_STUDENT_WIDGET_MIGRATION === "true",
};
