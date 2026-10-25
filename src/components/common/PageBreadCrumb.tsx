import React from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";

interface ActionButton {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
}

interface PageBreadcrumbProps {
  pageTitle: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ActionButton | ActionButton[];
  /** Өгвөл "Excel татах" товч нэмэгдэнэ. */
  onExport?: () => void;
  isExporting?: boolean;
}

const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({ 
  pageTitle, 
  description,
  actions,
  onExport,
  isExporting = false,
}) => {
  const actionArray: ActionButton[] = [
    ...(onExport
      ? [
          {
            label: isExporting ? "Татаж байна..." : "Excel татах",
            onClick: () => {
              if (!isExporting) onExport();
            },
            variant: "secondary" as const,
            icon: isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            ),
          },
        ]
      : []),
    ...(actions ? (Array.isArray(actions) ? actions : [actions]) : []),
  ];
  
  const getButtonClasses = (variant: ActionButton['variant'] = 'primary') => {
    const baseClasses = "flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200";
    
    const variants = {
      primary: "bg-brand-500 text-white hover:bg-brand-600 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
      secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700",
      success: "bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    };
    
    return `${baseClasses} ${variants[variant]}`;
  };

  const defaultIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Left Section - Title and Description */}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-semibold text-brand-500">
            {pageTitle}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        {/* Right Section - Action Buttons */}
        {actionArray.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {actionArray.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={getButtonClasses(action.variant)}
              >
                {action.icon || defaultIcon}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default PageBreadcrumb;