'use client';

import { usePathname } from 'next/navigation';
import ProtectedRoute from "@/components/ProtectedRoute";
import StudentNavbar from "@/components/members/StudentNavbar";

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isClassroom = pathname?.startsWith('/members/') && pathname !== '/members';

  return (
    <ProtectedRoute>
      {isClassroom ? (
        // Classroom Layout: Full screen, no global navbar, no padding
        <div className="min-h-screen bg-[#0F0F12] text-white">
          {children}
        </div>
      ) : (
        // Dashboard Layout: Navbar + Padding
        <div className="min-h-screen bg-gray-900 text-white">
          <StudentNavbar />
          <main className="p-6">
            {children}
          </main>
        </div>
      )}
    </ProtectedRoute>
  );
}
