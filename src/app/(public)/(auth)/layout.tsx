import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { ThemeProvider } from "@/context/ThemeContext";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className="relative bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col dark:bg-gray-900 sm:p-0">
          {hasChildren && (
            <div className="lg:w-1/2 w-full flex items-center justify-center sm-m-0">
              {children}
            </div>
          )}
          <div
            className={`${
              hasChildren ? "lg:w-1/2" : "w-full"
            } h-full bg-gradient-to-br from-brand-950 via-brand-900 to-gray-900 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-black relative overflow-hidden`}
          >
            <GridShape />
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="flex flex-col items-center max-w-xs auth-fade-in-up">
                <div className="text-center space-y-3 px-6">
                  <h2 className="text-white/90 text-[9vw] font-semibold tracking-wide">
                    STRATUM
                  </h2>
                </div>
              </div>
            </div>
          </div>
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
