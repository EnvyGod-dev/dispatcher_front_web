import { AuthProvider } from '@/components/AuthProvider';
import TenantGuard from '@/components/TenantGuard';
import { gipFont } from '../lib/fonts';

import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { QueryProvider } from '@/components/providers';
import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={gipFont.variable}>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              <TenantGuard>
                <SidebarProvider>{children}</SidebarProvider>
              </TenantGuard>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}