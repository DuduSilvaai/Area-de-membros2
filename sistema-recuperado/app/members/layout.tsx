'use client';

import { usePathname } from 'next/navigation';
import ProtectedRoute from "@/components/ProtectedRoute";
import { ChatWidget } from "@/components/members/ChatWidget";

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isClassroom = pathname?.startsWith('/members/') && pathname !== '/members';

  // Extract portalId from pathname if in classroom
  const portalId = isClassroom ? pathname?.split('/')[2] : undefined;

  return (
    <ProtectedRoute>
      {isClassroom ? (
        // Classroom Layout: Full screen, no global navbar, minimal chrome
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white transition-colors duration-500">
          {children}
          <ChatWidget />
        </div>
      ) : (
        // Dashboard Layout: Aurora Background, Navbar handled by page itself
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white transition-colors duration-500">
          {children}
          <ChatWidget />
        </div>
      )}
    </ProtectedRoute>
  );
}
