/**
 * CS05 status sets — mirrors backend/services/internship/cs05Statuses.js.
 * Keep the two lists in sync; they represent the same lifecycle contract.
 *
 * Lifecycle after approval:
 *   approved → acceptance_approved → supervisor_evaluated →
 *   referral_ready → referral_downloaded → completed
 *
 * Previous UI drift: several pages compared `status === "approved"` and
 * treated every other non-pending/non-cancelled status as rejected, which
 * incorrectly flagged CS05s that had advanced past `approved` (e.g. once
 * the head approves the Acceptance Letter → status becomes
 * `acceptance_approved`) as "ไม่ผ่าน".
 */
export const CS05_POST_APPROVED_STATUSES = [
  "approved",
  "acceptance_approved",
  "supervisor_evaluated",
  "referral_ready",
  "referral_downloaded",
  "completed",
] as const;

export type Cs05PostApprovedStatus = (typeof CS05_POST_APPROVED_STATUSES)[number];

export function isCs05PostApproved(
  status: string | null | undefined,
): status is Cs05PostApprovedStatus {
  return !!status && (CS05_POST_APPROVED_STATUSES as readonly string[]).includes(status);
}
