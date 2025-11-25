'use client';

import ProtectedRoute from "@/components/ProtectedRoute";
import StudentNavbar from "@/components/members/StudentNavbar";

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900 text-white">
        <StudentNavbar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
