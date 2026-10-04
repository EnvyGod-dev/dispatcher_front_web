'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/components/AuthProvider'
import Loading from '@/components/loading'
import { buildUrlForHostname, getExpectedHostname } from '@/lib/tenant'

export default function TenantGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!user) return

    const expectedHostname = getExpectedHostname(user as any)

    if (!expectedHostname) return

    if (window.location.hostname.toLowerCase() !== expectedHostname) {
      setIsRedirecting(true)
      window.location.replace(buildUrlForHostname(expectedHostname))
    }
  }, [user])

  /**
   * Буруу host дээр байх үед dashboard render хийхгүй —
   * эс тэгвэл header-гүй API хүсэлтүүд явж 400 өгнө.
   */
  if (isRedirecting) return <Loading />

  if (user && typeof window !== 'undefined') {
    const expectedHostname = getExpectedHostname(user as any)
    if (
      expectedHostname &&
      window.location.hostname.toLowerCase() !== expectedHostname
    ) {
      return <Loading />
    }
  }

  return <>{children}</>
}