// hooks/use-menu-state.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

type OpenSubmenu = {
  sectionKey: string;
  itemIndex: number;
} | null;

export const useMenuState = () => {
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<OpenSubmenu>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  // find and open the submenu that contains the active path
  useEffect(() => {
    // you'll need to pass menuSections here or import them
    // this is just the logic - adapt to your needs
    const foundActive = false;

    // iterate through sections and items to find active path
    // then set openSubmenu accordingly

    if (!foundActive) {
      // keep submenu open even when navigating to child routes
      // don't reset to null
    }
  }, [pathname]);

  // calculate submenu heights
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.sectionKey}-${openSubmenu.itemIndex}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = useCallback(
    (sectionKey: string, itemIndex: number) => {
      setOpenSubmenu((prev) => {
        if (prev?.sectionKey === sectionKey && prev?.itemIndex === itemIndex) {
          return null; // close if clicking the same item
        }
        return { sectionKey, itemIndex };
      });
    },
    []
  );

  return {
    openSubmenu,
    setOpenSubmenu,
    subMenuHeight,
    subMenuRefs,
    isActive,
    handleSubmenuToggle,
  };
};

export const useActivePath = () => {
  const pathname = usePathname();

  const isActive = useCallback(
    (path: string) => {
      // exact match
      if (pathname === path) return true;

      // check if current path starts with the item path (for nested routes)
      // but exclude root to avoid everything matching
      if (path !== '/' && pathname.startsWith(path)) return true;

      return false;
    },
    [pathname]
  );

  return { pathname, isActive };
};
