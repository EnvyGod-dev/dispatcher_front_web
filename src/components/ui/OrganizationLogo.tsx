'use client'

import { useState } from 'react'

interface OrganizationLogoProps {
  logoUrl?: string | null
  name?: string | null
  size?: 'sm' | 'md'
}

/**
 * Лого байхгүй эсвэл ачаалагдахгүй бол
 * нэрийн эхний үсгийг харуулна.
 */
export default function OrganizationLogo({
  logoUrl,
  name,
  size = 'md',
}: OrganizationLogoProps) {
  const [hasError, setHasError] = useState(false)

  const sizeClass = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'
  const label = name?.trim() || ''

  if (!logoUrl || hasError) {
    return (
      <div
        className={`${sizeClass} flex flex-shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300`}
      >
        {label.charAt(0).toUpperCase() || '?'}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={label}
      onError={() => setHasError(true)}
      className={`${sizeClass} flex-shrink-0 rounded-full border border-gray-200 bg-white object-contain p-0.5 dark:border-gray-700`}
    />
  )
}