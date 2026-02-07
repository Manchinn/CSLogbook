export function buildLegacyHref(): null {
  return null;
}

export function resolveAppLink(path: string) {
  return { href: path, external: false } as const;
}
