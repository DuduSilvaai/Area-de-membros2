'use client';

import AdminGuard from "@/components/AdminGuard";

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
      {children}
    </AdminGuard>
  );
}
