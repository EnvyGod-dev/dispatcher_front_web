export const getOrganizationSubdomain = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const hostname = window.location.hostname.toLowerCase();

  // Production
  if (hostname.endsWith('.stratum.mn')) {
    const subdomain = hostname.slice(0, -'.stratum.mn'.length);

    if (
      subdomain &&
      subdomain !== 'www' &&
      subdomain !== 'api'
    ) {
      return subdomain;
    }
  }

  // Local
  if (hostname.endsWith('.localhost')) {
    const subdomain = hostname.slice(0, -'.localhost'.length);

    if (subdomain) {
      return subdomain;
    }
  }

  return null;
};