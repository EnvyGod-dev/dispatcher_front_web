'use client';

import http, { getOrganizationSubdomain } from '@/services';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const STRATUM_LOGO = '/images/logo/logo.svg';

interface BrandLogoProps {
  /** Байгууллагын лого. Хоосон эсвэл ачаалагдахгүй бол Stratum-ын лого. */
  logoUrl?: string | null;
  name?: string | null;
  /** Логоны өндөр (px). Өргөн нь харьцаагаараа, maxWidth хүртэл. */
  height: number;
  maxWidth: number;
  className?: string;
}

export default function BrandLogo({ logoUrl, name, height, maxWidth, className }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [logoUrl]);

  if (!logoUrl || failed) {
    return (
      <Image
        src={STRATUM_LOGO}
        alt="Stratum"
        width={Math.round(height * 3.5)}
        height={height}
        style={{ height, width: 'auto', maxWidth }}
        className={className}
        priority
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={name?.trim() || 'Logo'}
      onError={() => setFailed(true)}
      style={{ height, width: 'auto', maxWidth }}
      className={`object-contain ${className ?? ''}`}
    />
  );
}

type Branding = { name: string | null; logoUrl: string | null };

/** Нэвтрэхээс өмнө (subdomain-аар) байгууллагын нэр, лого. */
export const useTenantBranding = () => {
  const subdomain = typeof window === 'undefined' ? null : getOrganizationSubdomain();

  return useQuery({
    queryKey: ['tenant-branding', subdomain],
    enabled: !!subdomain,
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async (): Promise<Branding> => {
      const res = await http.get<Branding>(`/api/branding/${subdomain}`);
      return res.body ?? { name: null, logoUrl: null };
    },
  });
};
