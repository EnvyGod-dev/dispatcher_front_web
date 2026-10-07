import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  additionalInfo?: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor?: string;
  trend?: {
    value: number;
    label?: string;
    direction: 'up' | 'down' | 'neutral';
  };
  breakdown?: Array<{
    label: string;
    value: string;
    color?: string;
  }>;
  isLoading?: boolean;
  onClick?: () => void;
}

export default function StatCard({
  title,
  value,
  subtitle,
  additionalInfo,
  icon,
  bgColor,
  iconColor = 'text-foreground/70',
  trend,
  breakdown,
  isLoading = false,
  onClick,
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;

    const iconClass = 'w-3 h-3';
    switch (trend.direction) {
      case 'up':
        return (
          <TrendingUp
            className={`${iconClass} text-green-600 dark:text-green-400`}
          />
        );
      case 'down':
        return (
          <TrendingDown
            className={`${iconClass} text-red-600 dark:text-red-400`}
          />
        );
      case 'neutral':
        return (
          <Minus className={`${iconClass} text-gray-600 dark:text-gray-400`} />
        );
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    switch (trend.direction) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      case 'neutral':
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Урт утга (техникийн нэр гэх мэт) тасрахгүй: үсгийг жижигрүүлж, мөр шилжүүлнэ.
  const valueLength = String(value ?? '').length;
  const valueSize = valueLength <= 8 ? 'text-3xl' : valueLength <= 14 ? 'text-2xl' : 'text-lg leading-snug';

  if (isLoading) {
    return (
      <div className="bg-background rounded-lg border border-border p-6 text-card-foreground shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="mb-3 h-4 w-24 rounded bg-muted"></div>
            <div className="mb-2 h-8 w-16 rounded bg-muted"></div>
            <div className="h-3 w-32 rounded bg-muted"></div>
          </div>
          <div className="h-14 w-14 rounded-lg bg-muted"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-background text-card-foreground rounded-lg border border-border p-5 shadow-sm
        transition-all duration-200 hover:shadow-md
        ${onClick ? 'cursor-pointer hover:border-brand-300 dark:hover:border-brand-800' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Content Section */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {title}
          </p>

          {/* Value with Trend */}
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className={`${valueSize} min-w-0 font-bold text-foreground break-words [overflow-wrap:anywhere]`}>
              {value}
            </h3>

            {trend && (
              <div className={`flex items-center gap-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-sm font-medium">
                  {trend.value > 0 ? '+' : ''}
                  {trend.value}%
                </span>
              </div>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="mb-1 text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}

          {/* Breakdown - NEW */}
          {breakdown && breakdown.length > 0 && (
            <div className="mt-2 space-y-1">
              {breakdown.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className={`${item.color || 'text-muted-foreground'}`}>
                    {item.label}
                  </span>
                  <span className={`font-semibold ${item.color || 'text-foreground'}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Additional Info */}
          {additionalInfo && (
            <p className="mt-2 text-xs font-medium text-brand-600 dark:text-brand-400">
              {additionalInfo}
            </p>
          )}

          {/* Trend Label */}
          {trend?.label && (
            <p className="mt-1 text-xs text-muted-foreground/80">
              {trend.label}
            </p>
          )}
        </div>

        {/* Icon Section - Fixed size container */}
        <div
          className={`
          flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center
          ${bgColor}
        `}
        >
          <div
            className={`w-full h-full w-7 h-7 flex items-center justify-center ${iconColor}`}
          >
            {React.cloneElement(icon as React.ReactElement)}
          </div>
        </div>
      </div>
    </div>
  );
}
