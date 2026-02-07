export const featureFlags = {
  useLegacyFrontend: process.env.NEXT_PUBLIC_USE_LEGACY_FRONTEND === "true",
  enableMockAuth: process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH !== "false",
};
