/**
 * useStudentPermissions Hook
 * 
 * A thin wrapper around StudentEligibilityContext for backward compatibility.
 * This hook no longer makes its own API calls - it uses the centralized context
 * to prevent duplicate API requests (client-swr-dedup pattern).
 * 
 * @deprecated Consider using useStudentEligibility() directly from contexts/StudentEligibilityContext
 */
import { useStudentEligibility } from '../contexts/StudentEligibilityContext';

export const useStudentPermissions = () => {
  const eligibility = useStudentEligibility();
  
  // Return data in the same shape as before for backward compatibility
  return {
    canAccessInternship: eligibility.canAccessInternship,
    canAccessProject: eligibility.canAccessProject,
    canRegisterInternship: eligibility.canRegisterInternship,
    canRegisterProject: eligibility.canRegisterProject,
    internshipReason: eligibility.internshipReason,
    projectReason: eligibility.projectReason,
    requirements: eligibility.requirements,
    academicSettings: eligibility.academicSettings,
    isLoading: eligibility.isLoading,
    lastUpdated: eligibility.lastUpdated,
    messages: eligibility.messages,
    // Expose the refresh function from context
    refreshPermissions: (showMessage = false) => eligibility.refreshEligibility(showMessage, true)
  };
};
