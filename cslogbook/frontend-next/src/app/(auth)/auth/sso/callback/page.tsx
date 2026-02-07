import { SsoCallbackClient } from "./SsoCallbackClient";

type SsoCallbackPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SsoCallbackPage({ searchParams }: SsoCallbackPageProps) {
  const resolvedSearchParams = await searchParams;

  const token = resolvedSearchParams?.token;
  const redirectPath = resolvedSearchParams?.redirectPath;
  const error = resolvedSearchParams?.error;

  return (
    <SsoCallbackClient
      token={Array.isArray(token) ? token[0] : token}
      redirectPath={Array.isArray(redirectPath) ? redirectPath[0] : redirectPath}
      error={Array.isArray(error) ? error[0] : error}
    />
  );
}
