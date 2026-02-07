"use client";

type WidgetStateProps = {
  enabled: boolean;
  hydrated: boolean;
  isLoading: boolean;
  error: unknown;
  loadingFallback: React.ReactNode;
  errorFallback: React.ReactNode;
  children: React.ReactNode;
};

export function WidgetState({
  enabled,
  hydrated,
  isLoading,
  error,
  loadingFallback,
  errorFallback,
  children,
}: WidgetStateProps) {
  if (!enabled) return null;
  if (!hydrated || isLoading) return <>{loadingFallback}</>;
  if (error) return <>{errorFallback}</>;
  return <>{children}</>;
}
