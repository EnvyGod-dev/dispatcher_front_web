// components/sidebar/MenuSection.tsx
'use client';
import Link from 'next/link';
import { MenuSection as MenuSectionType } from '@/lib/navigation/menu-config';
import { UserRole } from '@/services/roles';
import { ChevronDownIcon } from 'lucide-react';

type Props = {
  section: MenuSectionType;
  userRole: UserRole;
  isExpanded: boolean;
  isMobileOpen: boolean;
  openSubmenu: { sectionKey: string; itemIndex: number } | null;
  subMenuHeight: Record<string, number>;
  subMenuRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  isActive: (path: string) => boolean;
  onSubmenuToggle: (sectionKey: string, itemIndex: number) => void;
  onMobileMenuClose: () => void;
};

export const MenuSection: React.FC<Props> = ({
  section,
  userRole,
  isExpanded,
  isMobileOpen,
  openSubmenu,
  subMenuHeight,
  subMenuRefs,
  isActive,
  onSubmenuToggle,
  onMobileMenuClose,
}) => {
  const shouldShowText = isExpanded || isMobileOpen;

  // filter items based on user role
  const filteredItems = section.items.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  if (filteredItems.length === 0) return null;

  const isSubmenuOpen = (itemIndex: number) =>
    openSubmenu?.sectionKey === section.key &&
    openSubmenu?.itemIndex === itemIndex;

  return (
    <div>
      <h2
        className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
          !shouldShowText ? 'justify-center' : 'justify-start'
        }`}
      >
        {shouldShowText ? section.title : '•••'}
      </h2>

      <ul className="flex flex-col gap-4">
        {filteredItems.map((item, index) => {
          const Icon = item.icon;
          const hasSubmenu = !!item.subItems;
          const isOpen = isSubmenuOpen(index);
          const isItemActive = item.path ? isActive(item.path) : false;

          return (
            <li key={`${section.key}-${index}`}>
              {hasSubmenu ? (
                <button
                  onClick={() => onSubmenuToggle(section.key, index)}
                  className={`menu-item group ${
                    isOpen ? 'menu-item-active' : 'menu-item-inactive'
                  } cursor-pointer ${
                    !shouldShowText ? 'justify-center' : 'justify-start'
                  }`}
                >
                  <span
                    className={
                      isOpen
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive'
                    }
                  >
                    <Icon size={22} strokeWidth={2} />
                  </span>
                  {shouldShowText && (
                    <>
                      <span className="menu-item-text truncate">
                        {item.name}
                      </span>
                      <ChevronDownIcon
                        className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-brand-500' : ''
                        }`}
                      />
                    </>
                  )}
                </button>
              ) : item.path ? (
                <Link
                  href={item.path}
                  className={`menu-item group ${
                    isItemActive ? 'menu-item-active' : 'menu-item-inactive'
                  }`}
                  onClick={() => {
                    if (isMobileOpen) {
                      onMobileMenuClose();
                    }
                  }}
                >
                  <span
                    className={
                      isItemActive
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive'
                    }
                  >
                    <Icon size={22} strokeWidth={2} />
                  </span>
                  {shouldShowText && (
                    <span className="menu-item-text truncate">{item.name}</span>
                  )}
                </Link>
              ) : null}

              {/* submenu items */}
              {hasSubmenu && shouldShowText && (
                <div
                  ref={(el) => {
                    subMenuRefs.current[`${section.key}-${index}`] = el;
                  }}
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    height: isOpen
                      ? `${subMenuHeight[`${section.key}-${index}`]}px`
                      : '0px',
                  }}
                >
                  <ul className="mt-2 space-y-1 ml-6 sm:ml-9">
                    {item.subItems?.map((subItem) => {
                      const isSubItemActive = isActive(subItem.path);
                      return (
                        <li key={subItem.path}>
                          <Link
                            href={subItem.path}
                            className={`menu-dropdown-item ${
                              isSubItemActive
                                ? 'menu-dropdown-item-active'
                                : 'menu-dropdown-item-inactive'
                            }`}
                            onClick={() => {
                              if (isMobileOpen) {
                                onMobileMenuClose();
                              }
                            }}
                          >
                            <span className="truncate">{subItem.name}</span>
                            {(subItem.new || subItem.pro) && (
                              <span className="flex items-center gap-1 ml-auto">
                                {subItem.new && (
                                  <span
                                    className={`menu-dropdown-badge ${
                                      isSubItemActive
                                        ? 'menu-dropdown-badge-active'
                                        : 'menu-dropdown-badge-inactive'
                                    }`}
                                  >
                                    new
                                  </span>
                                )}
                                {subItem.pro && (
                                  <span
                                    className={`menu-dropdown-badge ${
                                      isSubItemActive
                                        ? 'menu-dropdown-badge-active'
                                        : 'menu-dropdown-badge-inactive'
                                    }`}
                                  >
                                    pro
                                  </span>
                                )}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
