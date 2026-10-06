'use client';

import { useAuth } from '@/components/AuthProvider';
import BrandLogo from '@/components/ui/BrandLogo';
import Link from 'next/link';
import React from 'react';
import { useSidebar } from '../context/SidebarContext';
import { menuSections } from '@/lib/navigation/menu-items';
import { MenuSection } from '@/components/sidebar/MenuSection';
import { useMenuState } from '@/lib/hooks/use-menu-state';

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, toggleMobileSidebar } = useSidebar();
  const { user } = useAuth();

  const {
    openSubmenu,
    subMenuHeight,
    subMenuRefs,
    isActive,
    handleSubmenuToggle,
  } = useMenuState();

  if (!user) return null;

  return (
    <aside
      className={`fixed flex flex-col lg:mt-0 top-0 px-3 sm:px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-[100vh] lg:h-screen transition-all duration-300 z-40 ease-in-out border-r border-gray-200
        ${
          isExpanded || isMobileOpen
            ? 'w-[270px] sm:w-[290px]'
            : 'w-[70px] sm:w-[90px]'
        }
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}
    >
      <div className={`py-4 sm:py-8 flex justify-center items-center`}>
        <Link href="/" className="flex justify-center">
          <BrandLogo
            logoUrl={user.organization?.logoUrl}
            name={user.organization?.name}
            height={isExpanded || isMobileOpen ? 40 : 28}
            maxWidth={isExpanded || isMobileOpen ? 200 : 48}
          />
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-6">
            {menuSections.map((section) => (
              <MenuSection
                key={section.key}
                section={section}
                userRole={user.role}
                isExpanded={isExpanded}
                isMobileOpen={isMobileOpen}
                openSubmenu={openSubmenu}
                subMenuHeight={subMenuHeight}
                subMenuRefs={subMenuRefs}
                isActive={isActive}
                onSubmenuToggle={handleSubmenuToggle}
                onMobileMenuClose={toggleMobileSidebar}
              />
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
