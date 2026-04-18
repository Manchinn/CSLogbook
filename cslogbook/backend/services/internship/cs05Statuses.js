/**
 * CS05 status sets — shared across internship services to keep whitelists
 * in sync. Previous drift between services caused cascading "ไม่พบข้อมูล"
 * bugs when CS05 auto-transitioned past `approved` (e.g. acceptance_approved
 * once head approves the Acceptance Letter).
 *
 * Lifecycle after approval:
 *   approved → acceptance_approved → supervisor_evaluated →
 *   referral_ready → referral_downloaded → completed
 */
const CS05_POST_APPROVED_STATUSES = [
  "approved",
  "acceptance_approved",
  "supervisor_evaluated",
  "referral_ready",
  "referral_downloaded",
  "completed",
];

/**
 * Summary view — also allows viewing cancelled records so the student /
 * officer can still see history for a cancelled internship.
 */
const CS05_SUMMARY_VIEW_STATUSES = [
  ...CS05_POST_APPROVED_STATUSES,
  "cancelled",
];

module.exports = {
  CS05_POST_APPROVED_STATUSES,
  CS05_SUMMARY_VIEW_STATUSES,
};
