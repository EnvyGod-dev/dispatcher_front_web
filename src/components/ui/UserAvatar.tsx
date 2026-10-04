import Image from 'next/image'

interface UserAvatarProps {
  imageUrl?: string
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10', 
  lg: 'w-12 h-12'
}

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
}

export default function UserAvatar({ 
  imageUrl, 
  name, 
  size = 'md', 
  className = '' 
}: UserAvatarProps) {
  const sizeClass = sizeClasses[size]
  const iconSize = iconSizes[size]

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${className}`}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name || 'User'}
          width={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          height={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              parent.innerHTML = `
                <svg class="${iconSize} text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              `
            }
          }}
        />
      ) : (
        <svg 
          className={`${iconSize} text-gray-400`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
          />
        </svg>
      )}
    </div>
  )
}