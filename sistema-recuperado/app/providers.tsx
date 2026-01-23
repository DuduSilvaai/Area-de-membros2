'use client';

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                {children}
                <Toaster richColors position="top-right" />
            </AuthProvider>
        </ThemeProvider>
    );
}
