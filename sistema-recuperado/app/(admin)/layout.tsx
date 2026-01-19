'use client';

import AdminGuard from "@/components/AdminGuard";
import Sidebar from "@/components/Sidebar";

/**
 * Layout para rotas administrativas.
 * Todas as rotas dentro de (admin) são protegidas pelo AdminGuard.
 */
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 ml-[280px] p-8 transition-all duration-300">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
